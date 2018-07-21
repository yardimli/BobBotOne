#!/usr/bin/env python

import time
import serial
import string
import random
import os

from http.server import BaseHTTPRequestHandler, HTTPServer
from urllib.parse import urlparse, parse_qs
from socketserver import ThreadingMixIn
from os import curdir, sep
import datetime
import json
import threading
import sys
import signal

from robotsettings import *

build_version = "0.1.001"
server = None

if 'selfIP' in locals():
    # do nothing
    thecowsarehere = True
else:
    selfIP = "192.168.1.246:8080"

LOGFILE = "robotserver"
SERVERLOG = "serverlog"

PORT_NAME = '/dev/ttyACM0'
# '/dev/ttyUSB0'

ser = serial.Serial(PORT_NAME, 115200)

serial_data = ""

time.sleep(1)
print("starting")


#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
def log_write(amessage, showmessage=False):
    sttime = datetime.datetime.now().strftime('%Y%m%d_%H:%M:%S - ')
    fttime = datetime.datetime.now().strftime('%Y%m%d')
    open(SERVERLOG + "_" + fttime + ".txt", "a").write(
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
# This class will handles any incoming request from
# the browser
class RobotWebServer(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        fttime = datetime.datetime.now().strftime('%Y%m%d')
        open(LOGFILE + "_" + fttime + ".txt", "a").write(
            "%s - - [%s] %s\n" % (self.address_string(), self.log_date_time_string(), format % args))
        return

    def do_POST(self):
        mimetype = 'text/html'
        self.send_response(200)
        self.send_header('Content-type', mimetype)
        self.end_headers()
        self.wfile.write(bytes('UPLOAD DONE. NOT SAVED: ', 'UTF-8'))

    # Handler for the GET requests
    def do_GET(self):
        global serial_data
        parsedpath = urlparse(self.path)

        if self.path == "/":
            self.path = "/index.html"

        try:
            # Check the file extension required and
            # set the right mime type
            full_path = self.path
            full_path_split = full_path.split("?")
            path_file_name = full_path_split[0]

            send_reply = False
            is_robot_command = False
            if path_file_name.endswith(".php"):
                mimetype = 'text/plain'
                is_robot_command = True
            if path_file_name.endswith(".html"):
                mimetype = 'text/html'
                send_reply = True
            if path_file_name.endswith(".jpg"):
                mimetype = 'image/jpg'
                send_reply = True
            if path_file_name.endswith(".gif"):
                mimetype = 'image/gif'
                send_reply = True
            if path_file_name.endswith(".js"):
                mimetype = 'application/javascript'
                send_reply = True
            if path_file_name.endswith(".css"):
                mimetype = 'text/css'
                send_reply = True
            if path_file_name.endswith(".ico"):
                mimetype = 'image/x-icon'
                send_reply = True
            if path_file_name.endswith(".mp3"):
                mimetype = 'audio/mpeg'
                send_reply = True
            if path_file_name.endswith(".ttf"):
                mimetype = 'application/x-font-ttf'
                send_reply = True

            if is_robot_command:
                query_components = parse_qs(parsedpath.query)

                if path_file_name == "/status.php":
                    upload_array = []
                    json_data = json.dumps(upload_array)

                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', 'application/json')
                        self.end_headers()
                        self.wfile.write(bytes(json_data, 'UTF-8'))
                    except:
                        log_write("Error 104: (status) HTTP Response Error", True)

                    upload_array = []

                if path_file_name == "/version.php":
                    log_write('Robot Command: X:' + self.path)

                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes(build_version, 'UTF-8'))
                    except:
                        log_write("Error 105: (version) HTTP Response Error")

                if path_file_name == "/read_serial.php":
                    log_write('Robot Command: X:' + self.path)
                    textresponse = "QUEUE: " + serial_data
                    serial_data = ""
                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes('' + textresponse, 'UTF-8'))
                    except:
                        log_write("Error 509: HTTP Response Error", True)

                if path_file_name == "/send_serial.php":
                    log_write('Robot Command: X:' + self.path)
                    message_to_send = ''.join(query_components.get('q', ''))

                    textresponse = "QUEUE: " + serial_data
                    serial_data = ""

                    ser.write(message_to_send.encode('utf-8'))

                    # Open the static file requested and send it
                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes('' + textresponse, 'UTF-8'))
                    except:
                        log_write("Error 609: HTTP Response Error", True)

            if send_reply:
                # log_write(curdir + sep + WEB_SERVER_FOLDER + path_file_name)

                # Open the static file requested and send it
                try:
                    f = open(curdir + sep + WEB_SERVER_FOLDER + path_file_name, 'rb')
                    self.send_response(200)
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.send_header('Content-type', mimetype)
                    self.end_headers()
                    self.wfile.write(f.read())
                    f.close()
                except:
                    log_write("Error 111: (send_reply) HTTP Response Error", True)

                return


        except IOError:
            self.send_error(404, 'File Not Found: %s' % self.path)


class ThreadedHTTPServer(ThreadingMixIn, HTTPServer):
    pass


testdrive = 1
while testdrive < 13:

    out = ''
    while ser.inWaiting() > 0:
        data = ser.read(1)
        out += data.decode()

    if out != '':
        out += " "
        print(out)

        if testdrive == 1:
            ser.write("U".encode('utf-8'))
            time.sleep(0.1)

        if testdrive == 3:
            ser.write("U".encode('utf-8'))
            time.sleep(0.1)

        if testdrive == 5:
            ser.write("U".encode('utf-8'))
            time.sleep(0.1)

        if testdrive == 7:
            ser.write("D".encode('utf-8'))
            time.sleep(0.1)

        if testdrive == 9:
            ser.write("D".encode('utf-8'))
            time.sleep(0.1)

        if testdrive == 11:
            ser.write("D".encode('utf-8'))
            time.sleep(0.1)

        testdrive = testdrive + 1

    time.sleep(0.1)

#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
try:
    # Create a web server and define the handler to manage the
    # incoming request
    server = ThreadedHTTPServer(('', PORT_NUMBER), RobotWebServer)  # HTTPServer(('', PORT_NUMBER), RobotWebServer)
    log_write('Started http server on port ', True)
    log_write(PORT_NUMBER, True)

    # Wait forever for incoming http requests
    server_thread = threading.Thread(target=server.serve_forever).start()


    def handler_stop_signals(signum, frame):
        global server
        log_write('SIGTERM, shutting down the web server', True)
        server.shutdown()
        # server.socket.close()
        sys.exit()


    signal.signal(signal.SIGINT, handler_stop_signals)
    signal.signal(signal.SIGTERM, handler_stop_signals)

    while True:
        # do something
        time.sleep(0.1)

        while ser.inWaiting() > 0:
            data = ser.read(1)
            serial_data += data.decode()




#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
except KeyboardInterrupt:
    print('^C received, shutting down the web server')
    log_write('shutting down the web server')
    server.shutdown()
    # server.socket.close()

print('^C received, WEBSERVER DONE SHUTDOWN!!')
log_write('WEBSERVER DONE SHUTDOWN!')
