#!/usr/bin/env python

import os
import sys
import time
from os.path import getmtime
import subprocess
import requests
import datetime

from robotsettings import *

CONTROLLOG = "controllog"


#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
def log_write(amessage, showmessage=False):
    sttime = datetime.datetime.now().strftime('%Y%m%d_%H:%M:%S - ')

    fttime = datetime.datetime.now().strftime('%Y%m%d')
    open(CONTROLLOG + "_" + fttime + ".txt", "a").write(
        "[%s] %s\n" % (sttime, amessage))

    if showmessage == True:
        print("[%s] %s" % (sttime, amessage))

    return


#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
def RepresentsInt(s):
    try:
        int(s)
        return True
    except ValueError:
        return False


current_version = "1000"

file = open("version.txt", "r")
current_version = file.read()
file.close()

WATCHED_FILES = ['servosettings.py', 'robotsettings.py', 'webserver.py']
WATCHED_FILES_MTIMES = [(f, getmtime(f)) for f in WATCHED_FILES]

time.sleep(0.5)
log_write('checking to kill webserver.py if any', True)
subprocess.call(['pkill', '-9', '-f', './webserver.py'])
time.sleep(1)

p = subprocess.Popen(['./webserver.py'])

checknewversion_counter = 1
restart_everything_timer = 0

try:
    while True:
        # do something
        time.sleep(1)

        restart_everything_timer += 1
        checknewversion_counter += 1

        if restart_everything_timer > 600:
            restart_everything_timer = 0
            log_write("restart everything after 600 seconds: ", True)

            # When running the script via `./daemon.py` (e.g. Linux/Mac OS), use
            p.terminate()
            time.sleep(3)

            log_write('checking to kill webserver.py if not already dead')
            subprocess.call(['pkill', '-9', '-f', './webserver.py'])
            time.sleep(2)

            p = subprocess.Popen(['./webserver.py'])

        if checknewversion_counter == 15:
            try:
                link = "http://" + selfIP + "/status.php"
                log_write("checking if self is alive from: " + link)
                f = requests.get(link)
            except:
                log_write('can''t reach self http server. forcing restart:', True)

                # When running the script via `./daemon.py` (e.g. Linux/Mac OS), use
                p.terminate()
                time.sleep(3)

                log_write('checking to kill webserver.py if not already dead')
                subprocess.call(['pkill', '-9', '-f', './webserver.py'])
                time.sleep(2)

                p = subprocess.Popen(['./webserver.py'])

        if checknewversion_counter > 25:
            checknewversion_counter = 0

            try:
                link = "http://192.168.1.110/SmartRobot/version.txt"
                log_write("checking for new version from: " + link)
                f = requests.get(link)
                server_version = f.text
            except:
                log_write('ERROR 1: can''t reach update Server', True)

            log_write("current version: " + current_version + "   and version on server:" + server_version)

            if RepresentsInt(server_version):
                if server_version != current_version:

                    try:
                        link = "http://192.168.1.110/SmartRobot/webserver.py"
                        f = requests.get(link)
                        file = open("webserver.py", "wb")
                        file.write(bytes(f.text, 'UTF-8'))
                        file.close()

                        file = open("version.txt", "wb")
                        file.write(bytes(server_version, 'UTF-8'))
                        file.close()
                        current_version = server_version
                    except:
                        log_write('ERROR 2: can''t reach update Server', True)

                else:
                    log_write("no new version")

            else:
                log_write("ERROR 31: could not read version from server...", True)



        # One of the files has changed, so restart the script.
        for f, mtime in WATCHED_FILES_MTIMES:
            if getmtime(f) != mtime:
                log_write('--> restarting because of file changes..', True)
                WATCHED_FILES_MTIMES = [(f, getmtime(f)) for f in WATCHED_FILES]

                # When running the script via `./daemon.py` (e.g. Linux/Mac OS), use
                p.terminate()
                time.sleep(3)

                log_write('checking to kill webserver.py if not already dead')
                subprocess.call(['pkill', '-9', '-f', './webserver.py'])
                time.sleep(2)

                p = subprocess.Popen(['./webserver.py'])


except KeyboardInterrupt:
    print('^C received, shutting down the contorl service')
    log_write('^C received, shutting down the contorl service')
    p.terminate()
    time.sleep(3)
