#!/usr/bin/env python

from __future__ import division

from http.server import BaseHTTPRequestHandler, HTTPServer
from socketserver import ThreadingMixIn
from os import curdir, sep
from urllib.parse import urlparse, parse_qs
import cgi
import time
import threading
import sys

from imutils.video import VideoStream
import imutils
import cv2
import requests
import signal

import datetime
import json

from robotsettings import *
from servosettings import *

# Import the PCA9685 module.
# import Adafruit_PCA9685

build_version = "1.024"

LOGFILE = "robotserver"
SERVERLOG = "serverlog"

servo_threads = []
servo_run = []
servo_goto = []
upload_array = []

panLoop = 0
panPos = 0

framex = 0
imagex = 0
imagepausex = 65
imageChanged = True
picamera_firstFrame = None
picamera = None
server = None
upload_new_image_counter = 55

file_name_counter = 0

slave_file_list = {}

if 'selfIP' in locals():
    # do nothing
    thecowsarehere = True
else:
    selfIP = "192.168.1.246:8080"


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
def detect_motion():
    global picamera_firstFrame, picamera, imageChanged, framex, serverID, masterPiIP, upload_new_image_counter
    global file_name_counter

    t = threading.currentThread()
    while getattr(t, "do_run", True):
        start_time = time.clock()
        # log_write('Camera!', True)

        picamera_frame = picamera.read()
        capture_time = time.clock() - start_time
        picamera_small = imutils.resize(picamera_frame, width=320, inter=cv2.INTER_LINEAR)

        picamera_blur = cv2.cvtColor(picamera_small, cv2.COLOR_BGR2GRAY)
        picamera_blur = cv2.GaussianBlur(picamera_blur, (21, 21), 0)

        # if the first frame is None, initialize it
        if picamera_firstFrame is None:
            picamera_firstFrame = picamera_blur
            continue

        picamera_frameDelta = cv2.absdiff(picamera_firstFrame, picamera_blur)
        picamera_thresh = cv2.threshold(picamera_frameDelta, 25, 255, cv2.THRESH_BINARY)[1]
        picamera_thresh = cv2.dilate(picamera_thresh, None, iterations=2)

        (_, picamera_cnts, _) = cv2.findContours(picamera_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        for c in picamera_cnts:
            if cv2.contourArea(c) < 500:
                continue

            (x, y, w, h) = cv2.boundingRect(c)
            # log_write("area: x: " + str(x) + " y: " + str(y) + " w: " + str(w) + " h: " + str(h))
            cv2.rectangle(picamera_small, (x, y), (x + w, y + h), (0, 255, 0), 1)
            imageChanged = True

        if showvideowin:
            cv2.imshow("Security Feed Back", picamera_small)
            #   cv2.moveWindow("Security Feed Back", 705, 60)

        framex += 1
        if imageChanged and (framex > 2):
            imageChanged = False
            framex = 0
            picamera_firstFrame = None

            file_name_counter += 1
            if file_name_counter > 10: file_name_counter = 1

            name_big = "./webserver/pi_camera/picamera_full_" + str(file_name_counter) + ".jpg"
            cv2.imwrite(name_big, picamera_frame)

            name = "./webserver/pi_camera/picamera_small_" + str(file_name_counter) + ".jpg"
            cv2.imwrite(name, picamera_small)

            name = "./webserver/pi_camera/picamera_blur_" + str(file_name_counter) + ".jpg"
            cv2.imwrite(name, picamera_blur)

            name = "./webserver/pi_camera/picamera_thresh_" + str(file_name_counter) + ".jpg"
            cv2.imwrite(name, picamera_thresh)

            picamera_hsv = cv2.cvtColor(picamera_small, cv2.COLOR_BGR2HSV)
            name_hsv = "./webserver/pi_camera/picamera_hsv_" + str(file_name_counter) + ".jpg"
            cv2.imwrite(name_hsv, picamera_hsv)

            upload_array.append({'filename_big': "/pi_camera/picamera_full_" + str(file_name_counter) + ".jpg",
                                 'filename_small': "/pi_camera/picamera_small_" + str(file_name_counter) + ".jpg",
                                 'filename_blur': "/pi_camera/picamera_blur_" + str(file_name_counter) + ".jpg",
                                 'filename_thresh': "/pi_camera/picamera_thresh_" + str(file_name_counter) + ".jpg",
                                 'filename_hsv': "/pi_camera/picamera_hsv_" + str(file_name_counter) + ".jpg",
                                 'filename_counter': file_name_counter,
                                 'servername': serverID,
                                 'build': build_version,
                                 'time_taken': time.clock() - start_time,
                                 'capture_time': capture_time})

            #        else:
            #            time.sleep(0.1)

    log_write("camera thread stopping...", True)
    picamera.stop()


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
                # pwm.set_pwm(channel, 0, servo_goto[channel])
                time.sleep(1)
                servo_run[channel] = False
                # pwm.set_pwm(channel, 4096, 0)
        time.sleep(0.1)

    log_write("servo " + str(channel) + " thread stopping...", True)


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
        global upload_new_image_counter, imageChanged, upload_array

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

                if path_file_name == "/startupload.php":
                    log_write('Robot Command: X:' + self.path)
                    imageChanged = True
                    upload_new_image_counter = 50

                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes('ROBOT RESULT:  starting 50 uploads', 'UTF-8'))
                    except:
                        log_write("Error 107: (startupload) HTTP Response Error", True)

                if path_file_name == "/stopupload.php":
                    log_write('Robot Command: X:' + self.path)
                    upload_new_image_counter = 0

                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes('ROBOT RESULT:  stopping uploads', 'UTF-8'))
                    except:
                        log_write("Error 108: (stopupload) HTTP Response Error", True)

                if path_file_name == "/servo.php":
                    log_write('Robot Command: X:' + self.path)
                    servo_id = ''.join(query_components.get('servo', '0'))
                    servo_value = ''.join(query_components.get('value', '400'))

                    textresponse = "Servo ID to run:" + servo_id + ", GoTo Value:" + servo_value
                    log_write(textresponse)

                    servo_run[int(servo_id)] = True
                    servo_goto[int(servo_id)] = int(servo_value)

                    # Open the static file requested and send it
                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes('ROBOT RESULT:  ' + textresponse, 'UTF-8'))
                    except:
                        log_write("Error 109: (servo) HTTP Response Error", True)

                if path_file_name == "/servopi.php":
                    log_write('Robot Command: X:' + self.path)
                    server_id = ''.join(query_components.get('server', '246'))
                    servo_value = ''.join(query_components.get('value', '400'))
                    servo_id = "0"

                    if server_id in slave_file_list:

                        servo_id = slave_file_list[server_id]['servo']['servo_pin'];

                        if servo_value == "home": servo_value = slave_file_list[server_id]['servo']['servo_home']
                        if servo_value == "min": servo_value = slave_file_list[server_id]['servo']['servo_min']
                        if servo_value == "max": servo_value = slave_file_list[server_id]['servo']['servo_max']

                        textresponse = "Server ID: " + server_id + " Servo ID to run:" + servo_id + ", GoTo Value:" + servo_value

                        servo_run[int(servo_id)] = True
                        servo_goto[int(servo_id)] = int(servo_value)

                    else:
                        textresponse = "Servo ID for ServerID:" + server_id + " not found. NOT RUNNING!"

                    log_write(textresponse)

                    # Open the static file requested and send it
                    try:
                        self.send_response(200)
                        self.send_header('Access-Control-Allow-Origin', '*')
                        self.send_header('Content-type', mimetype)
                        self.end_headers()
                        self.wfile.write(bytes('ROBOT SERVO PI RESULT:  ' + textresponse, 'UTF-8'))
                    except:
                        log_write("Error 110: (servopi) HTTP Response Error", True)

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


#
#
#
#
#
# --------------------------------------------------------------------------------------------------------------------
log_write("starting elo robot soft v" + build_version + "...", True)

if CONTROL_CAMERA:
    picamera = VideoStream(usePiCamera=True, resolution=(1648, 1232), framerate=20).start()
    time.sleep(2)

    picamera_firstFrame = None

    camera_thread = threading.Thread(name="camera", target=detect_motion, args=())
    camera_thread.start()

if CONTROL_SERVO:
    #    pwm = Adafruit_PCA9685.PCA9685()
    #    pwm.set_pwm_freq(60)
    try:
        for i in range(0, 15):
            servo_run.append(False)
            servo_goto.append(servo_min)
            servo_thread = threading.Thread(name="servo_" + str(i), target=move_servo, args=(i,))
            servo_threads.append(servo_thread)
            servo_thread.start()
    except:
        log_write('Error 112: threading error', True)

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

    time.sleep(1.5)
    try:
        log_write('test servo go min')
        payload = {"servo": servo_pin, "value": servo_min}
        r = requests.get("http://192.168.1.246:8080/servo.php", params=payload, timeout=0.5)
        log_write(r.text)
        time.sleep(1.5)
    except:
        log_write('Error 113: cant reach Master PI', True)

    try:
        log_write('test servo go max')
        payload = {"servo": servo_pin, "value": servo_max}
        r = requests.get("http://192.168.1.246:8080/servo.php", params=payload, timeout=0.5)
        log_write(r.text)
        time.sleep(1.5)
    except:
        log_write('Error 114: cant reach Master PI', True)

    try:
        log_write('test servo go home')
        payload = {"servo": servo_pin, "value": servo_home}
        r = requests.get("http://192.168.1.246:8080/servo.php", params=payload, timeout=0.5)
        log_write(r.text)
        time.sleep(1.5)
    except:
        log_write('Error 115: cant reach Master PI', True)

    imageChanged = True
    upload_new_image_counter = 5


    def handler_stop_signals(signum, frame):
        global server
        log_write('SIGTERM, shutting down the web server', True)
        server.shutdown()
        # server.socket.close()

        if CONTROL_SERVO:
            for i in range(0, 15):
                servo_threads[i].do_run = False

        if CONTROL_CAMERA:
            camera_thread.do_run = False

        sys.exit()


    signal.signal(signal.SIGINT, handler_stop_signals)
    signal.signal(signal.SIGTERM, handler_stop_signals)

    while True:
        # do something
        time.sleep(0.1)


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

if CONTROL_SERVO:
    for i in range(0, 15):
        servo_threads[i].do_run = False

if CONTROL_CAMERA:
    camera_thread.do_run = False

print('^C received, WEBSERVER DONE SHUTDOWN!!')
log_write('WEBSERVER DONE SHUTDOWN!')
