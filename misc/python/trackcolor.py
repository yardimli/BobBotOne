from __future__ import print_function

from picamera.array import PiRGBArray
from picamera import PiCamera

from pyimagesearch import imutils

import time
import cv2

import serial
import time
import string
import random
import os
import math
import numpy as np

ser = serial.Serial('/dev/ttyACM1', 115200)

ser_motor = serial.Serial('/dev/ttyACM0', 9600)


# initialize the camera and grab a reference to the raw camera capture
camera = PiCamera()
camera.resolution = (1024, 768)
camera.framerate = 8
rawCapture = PiRGBArray(camera, size=(1024, 768))

# allow the camera and serial to warmup

sleeptime = 3
sleepwaitloop = 0
while sleepwaitloop<sleeptime:
	sleepwaitloop = sleepwaitloop + 0.1
	
	out = ''
	while ser.inWaiting() > 0:
		out += ser.read(1)

	if out != '':
		out += " "
		print (">> SERVO: " ,out)


	out = ''
	while ser_motor.inWaiting() > 0:
		out += ser_motor.read(1)

	if out != '':
		out += " "
		print (">> MOTOR: " ,out)

	key = cv2.waitKey(1) & 0xFF
	if key == ord("q"):
		sleepwaitloop=1000
	time.sleep(0.1)
	


goleft =0
goright = 0
goup = 0
godown = 0
jump =0
vdirection = ""
hdirection = ""
startscan = 0
scanHdir = 0
scanVdir = 1
StartScanCounter = 0
doscan=1

xreswidth = int(1024)
xreshalf = int(round( xreswidth /2) )
xres10p = int(round( xreswidth /20) )

yreswidth = int(round( xreswidth * float(480.0/640) ) )
yreshalf = int(round( yreswidth /2) )
yres10p = int(round( yreswidth /20 * float(480.0/640)) )
print( xreswidth,xreshalf,xres10p)
print( yreswidth,yreshalf,yres10p)

# capture frames from the camera
for frame in camera.capture_continuous(rawCapture, format="bgr", use_video_port=True):

	crs = open('/var/www/html/color.dat','r')
	ColorRange={}
	k1 = 0
	k2 = 0
	line = crs.read().strip()
	for pair in line.split(';'):
		(key,value) = pair.split('=')
		ColorRange[key] = int(value)
		
	redLower = (ColorRange['BlueMin'], ColorRange['GreenMin'], ColorRange['RedMin'])
	redUpper = (ColorRange['BlueMax'], ColorRange['GreenMax'], ColorRange['RedMax'])

	image = frame.array
	
	frame = imutils.resize(image, width = xreswidth)

	hsv = cv2.cvtColor(frame, cv2.COLOR_BGR2HSV)

	mask = cv2.inRange(hsv, redLower, redUpper)
	mask = cv2.erode(mask, None, iterations=2)
	mask = cv2.dilate(mask, None, iterations=2)
	
	contours = cv2.findContours(mask.copy(), cv2.RETR_EXTERNAL,	cv2.CHAIN_APPROX_SIMPLE)[-2]
	center = None
	x=0
	y=0
	radius = 0
	contours_area = []
	contours_cirles = []
	if len(contours) > 0:
		
		# calculate area and filter into new array
		for con in contours:
			area = cv2.contourArea(con)
			print(area)
			if 1000 < area < 75000:
				contours_area.append(con)
				
		# check if contour is of circular shape
		for con in contours_area:
			  
			perimeter = cv2.arcLength(con, True)
			area = cv2.contourArea(con)

			polyDP = cv2.approxPolyDP(con, 0.02 * perimeter, True)
			print("poly:",len(polyDP))
			
			if perimeter == 0:
				break
			circularity = 4*math.pi*(area/(perimeter*perimeter))
			print ( circularity )
			if (0.55 < circularity < 1.2) and (len(polyDP)>=7) and (len(polyDP)<=25):
				contours_cirles.append(con)

        		
	if len(contours_cirles) > 0:
		# find the largest contour in the mask, then use
		# it to compute the minimum enclosing circle and
		# centroid
		c = max(contours_cirles, key=cv2.contourArea)
		((x, y), radius) = cv2.minEnclosingCircle(c)
		M = cv2.moments(c)
		center = (int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"]))
 
		# only proceed if the radius meets a minimum size
		if radius > xres10p/2:
			# draw the circle and centroid on the frame,
			# then update the list of tracked points
			cv2.circle(frame, (int(x), int(y)), int(radius),
				(0, 255, 255), 2)
			# cv2.circle(frame, center, 5, (0, 0, 255), -1)

		
		
	print ("x:", int(x), ", GoLeft:", goleft, " -- Y:", int(y), ", GoUp:", goup, ", Radius:", radius, ">", (xres10p/2), end='')
	
	if (radius>10 and radius<40):
		print (" GOTO FORWARD:")
		for x in xrange(1, 6):
			SpeedValue = chr(65 + (x*5));
			MotorStr = 'AA' + SpeedValue + 'BA' + SpeedValue + 'CA' + SpeedValue + 'DA' + SpeedValue;
			ser_motor.write(MotorStr+",.")
			time.sleep(0.2)
		for x in xrange(6, 1, -1):
			SpeedValue = chr(65 + (x*5));
			MotorStr = 'AA' + SpeedValue + 'BA' + SpeedValue + 'CA' + SpeedValue + 'DA' + SpeedValue;
			ser_motor.write(MotorStr+",.")
			time.sleep(0.2)

	if (radius>55):
		print (" GO BACKWARDS:")
		for x in xrange(1, 6):
			SpeedValue = chr(65 + (x*5));
			MotorStr = 'AB' + SpeedValue + 'BB' + SpeedValue + 'CB' + SpeedValue + 'DB' + SpeedValue;
			ser_motor.write(MotorStr+",.")
			time.sleep(0.2)
		for x in xrange(6, 1, -1):
			SpeedValue = chr(65 + (x*5));
			MotorStr = 'AB' + SpeedValue + 'BB' + SpeedValue + 'CB' + SpeedValue + 'DB' + SpeedValue;
			ser_motor.write(MotorStr+",.")
			time.sleep(0.2)
		
	SpeedValue = chr(65 + 0);
	MotorStr = 'AB' + SpeedValue + 'BB' + SpeedValue + 'CB' + SpeedValue + 'DB' + SpeedValue;
	ser_motor.write(MotorStr+",.")
	time.sleep(0.1)
		
	
	# show the frame
	frame = imutils.resize(frame, width = 320)
	hsv = imutils.resize(hsv, width = 320)
	mask = imutils.resize(mask, width = 320)
	
	cv2.imshow("Frame2", hsv)
	cv2.imshow("Frame",frame)
	cv2.imshow("Mask",mask)
	
	if not os.path.exists('/var/www/html/imagelock.html'):
		
		
		cv2.imwrite("/var/www/html/pic.jpg",frame)
		cv2.imwrite("/var/www/html/pic-hsv.png",hsv)
		cv2.imwrite("/var/www/html/pic-mask.jpg",mask)
		file = open('/var/www/html/imagelock.html', 'w+')

	if (int(x)==0 or int(y)==0):
		StartScanCounter = StartScanCounter+1
	else:
		StartScanCounter = 0
		
	

	if ((int(x)==0 or int(y)==0) or (radius < xres10p/2)) :
		if doscan==1 and StartScanCounter>5:
			if startscan==0:
				print( "START SCAN!")

			startscan = 1
			if scanHdir == 0:
				goleft = goleft + 20
			if scanHdir == 1:
				goleft = goleft - 20
				
			if goleft>=60:
				goleft = 60
				scanHdir = 1
				
				if scanVdir == 0:
					goup = goup + 20
				if scanVdir == 1:
					goup = goup - 20
					
				
			if goleft<=-60:
				goleft = -60
				scanHdir = 0
				
				if scanVdir == 0:
					goup = goup + 10
				if scanVdir == 1:
					goup = goup - 10

			if goup>=20:
				goup = 20
				scanVdir = 1
			if goup<=-20:
				goup = -20
				scanVdir = 0
				
	else:
		startscan = 0
	
		if int(x) > xreshalf+xres10p:
			hdirection = "L"
			
			jump = x-xreshalf
			jump = int(round(jump / xres10p))
			if (jump>8) : jump = 8
			
			goleft = goleft+jump
			scanHdir = 0
			
		if int(x) < xreshalf-xres10p:
			hdirection = "R"
			jump = x
			jump = int(round(jump / xres10p))
			if (jump>8) : jump = 8

			goleft = goleft - jump
			scanHdir = 1
			

		if int(y) > yreshalf+yres10p:
			vdirection = "U"
			jump = y-yreshalf
			jump = int(round(jump / (yres10p*2)))
			if (jump>5) : jump = 5

			goup = goup - jump
			scanVdir = 1

		if int(y) < yreshalf-yres10p:
			vdirection = "D"
			jump = y
			jump = int(round(jump / (yres10p*2)))
			if (jump>5) : jump = 5

			goup = goup+jump
			scanVdir = 0
		
		if (goup>30) : goup = 30
		if (goup<-30) : goup = -30
		if (goleft<-60) : goleft = -60
		if (goleft>60) : goleft = 60
	
	inputV = ""
	inputH = ""
	
	if goup>=0 :
		inputV = "BE" + chr(65+goup)
	if goup<0 :
		inputV = "BD" + chr(65+abs(goup))

	
	if goleft>=0 :
		inputH = "AD" + chr(65+goleft)
	if goleft<0 :
		inputH = "AE" + chr(65+abs(goleft))

	print (" GOTO GoLeft:",goleft," GoUp:",goup)
	ser.write(inputH+inputV+",.")
	time.sleep(0.1)
	ser.write(inputH+inputV+",.")
	
	sleeptime = 0.1
	if startscan==1:
		sleeptime  = 0.1
	else:
		sleeptime = 0.1
	
	
	
	sleepwaitloop = 0;
	while sleepwaitloop<sleeptime:
		sleepwaitloop = sleepwaitloop + 0.1
		
		out = ''
		while ser.inWaiting() > 0:
			out += ser.read(1)

		if out != '':
			out += " "
#			print( ">> SERVO: " , out)

		out = ''
		while ser_motor.inWaiting() > 0:
			out += ser_motor.read(1)

		if out != '':
			out += " "
#			print (">> MOTOR: " ,out)


		key = cv2.waitKey(1) & 0xFF
		if key == ord("q"):
			sleepwaitloop=1000
			
		if key == ord("s"):
			sleepwaitloop=1000
			if doscan==1:
				doscan=0
			else:
				doscan=1
			print("STOP/START SCAN:",doscan)
			
		time.sleep(0.1)
	print("--------")
		

	# clear the stream in preparation for the next frame
	rawCapture.truncate(0)


	# if the `q` key was pressed, break from the loop
	if key == ord("q"):
		input = "BDA" + "ADA,.";
		ser.write(input)
		time.sleep(1)
		
		break

# cleanup the camera and close any open windows
cv2.destroyAllWindows()
