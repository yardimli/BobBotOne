#!/usr/bin/env python

from __future__ import division

import time
import threading
import sys
import datetime
import json

from Raspi_PWM_Servo_Driver import PWM

servo_threads = []
servo_run = []
servo_goto = []

servo_min = 300

CONTROL_SERVO = True
SERVERLOG = "serverlog"


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

    if showmessage:
        print("[%s] %s" % (sttime, amessage))

    return


#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
def move_servo(channel):
    t = threading.currentThread()
    while getattr(t, "do_run", True):
        if CONTROL_SERVO:
            if servo_run[channel]:
                log_write("servo " + str(channel) + " going to " + str(servo_goto[channel]), True)
                pwm.setPWM(channel, 0, servo_goto[channel])
                time.sleep(1)
                servo_run[channel] = False
                pwm.setPWM(channel, 4096, 0)
        time.sleep(0.1)

    log_write("servo " + str(channel) + " thread stopping...", True)


pwm = PWM(0x6F)
pwm.setPWMFreq(60)  # Set frequency to 60 Hz
# pwm = Adafruit_PCA9685.PCA9685()
# pwm.set_pwm_freq(60)
try:
    for i in range(0, 16):

        servo_run.append(False)
        servo_goto.append(servo_min)
        if i == 0 or i == 1 or i == 14 or i == 15:
            print(i)
            servo_thread = threading.Thread(name="servo_" + str(i), target=move_servo, args=(i,))
            servo_threads.append(servo_thread)
            servo_thread.start()
except:
    log_write('Error 112: threading error', True)

try:
    while True:
        # do something
        time.sleep(0.1)

        servo_run[0] = True
        servo_goto[0] = 300

        time.sleep(1)
        servo_run[1] = True
        servo_goto[1] = 300
        time.sleep(1)

        servo_run[14] = True
        servo_goto[14] = 300
        time.sleep(1)

        servo_run[15] = True
        servo_goto[15] = 300
        time.sleep(1)

        servo_run[0] = True
        servo_goto[0] = 450
        time.sleep(1)

        servo_run[1] = True
        servo_goto[1] = 450
        time.sleep(1)

        servo_run[14] = True
        servo_goto[14] = 450
        time.sleep(1)

        servo_run[15] = True
        servo_goto[15] = 450
        time.sleep(1)

except KeyboardInterrupt:

    print('^C received, shutting down the web server')
    log_write('shutting down the web server')

for i in range(0, 15):
    servo_threads[i].do_run = False

print('^C received, WEBSERVER DONE SHUTDOWN!!')
log_write('WEBSERVER DONE SHUTDOWN!')
