from imutils.video import VideoStream
import argparse
import datetime
import imutils
import time
import cv2

webcamera = VideoStream(src=0).start()
time.sleep(0.25)

picamera = VideoStream(usePiCamera=True).start()
time.sleep(0.25)

picamera_firstFrame = None
webcamera_firstFrame = None

framex = 0
imagex = 0
imagepausex = 65
# loop over the frames of the video
while True:
    webcamera_frame = webcamera.read()
    webcamera_small = imutils.resize(webcamera_frame, width=640)

    webcamera_hsv = cv2.cvtColor(webcamera_small, cv2.COLOR_BGR2HSV)

    webcamera_blur = cv2.cvtColor(webcamera_small, cv2.COLOR_BGR2GRAY)
    webcamera_blur = cv2.GaussianBlur(webcamera_blur, (21, 21), 0)

    picamera_frame = picamera.read()
    picamera_small = imutils.resize(picamera_frame, width=640)

    picamera_hsv = cv2.cvtColor(picamera_small, cv2.COLOR_BGR2HSV)

    picamera_blur = cv2.cvtColor(picamera_small, cv2.COLOR_BGR2GRAY)
    picamera_blur = cv2.GaussianBlur(picamera_blur, (21, 21), 0)

    # if the first frame is None, initialize it
    if webcamera_firstFrame is None:
        webcamera_firstFrame = webcamera_blur
        continue

    if picamera_firstFrame is None:
        picamera_firstFrame = picamera_blur
        continue

    webcamera_frameDelta = cv2.absdiff(webcamera_firstFrame, webcamera_blur)
    webcamera_thresh = cv2.threshold(webcamera_frameDelta, 25, 255, cv2.THRESH_BINARY)[1]
    webcamera_thresh = cv2.dilate(webcamera_thresh, None, iterations=2)

    picamera_frameDelta = cv2.absdiff(picamera_firstFrame, picamera_blur)
    picamera_thresh = cv2.threshold(picamera_frameDelta, 25, 255, cv2.THRESH_BINARY)[1]
    picamera_thresh = cv2.dilate(picamera_thresh, None, iterations=2)

    (_, webcamera_cnts, _) = cv2.findContours(webcamera_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    (_, picamera_cnts, _) = cv2.findContours(picamera_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for c in webcamera_cnts:
        if cv2.contourArea(c) < 500:
            continue

        (x, y, w, h) = cv2.boundingRect(c)
        cv2.rectangle(webcamera_small, (x, y), (x + w, y + h), (0, 255, 0), 1)

    for c in picamera_cnts:
        if cv2.contourArea(c) < 500:
            continue

        (x, y, w, h) = cv2.boundingRect(c)
        cv2.rectangle(picamera_small, (x, y), (x + w, y + h), (0, 255, 0), 1)

    cv2.imshow("Security Feed Front", webcamera_small)
    #    cv2.imshow("Thresh Front", webcamera_thresh)
    #    cv2.imshow("Frame Delta Front", webcamera_frameDelta)
    #    cv2.imshow("HSV Front", webcamera_hsv)

    cv2.moveWindow("Security Feed Front", 60, 60)
    #    cv2.moveWindow("Thresh Front",       420, 20)
    #    cv2.moveWindow("Frame Delta Front",  820, 20)
    #    cv2.moveWindow("HSV Front",         1220, 20)

    cv2.imshow("Security Feed Back", picamera_small)
    #   cv2.imshow("Thresh Back", picamera_thresh)
    #   cv2.imshow("Frame Delta Back", picamera_frameDelta)
    #   cv2.imshow("HSV Back", picamera_hsv)

    cv2.moveWindow("Security Feed Back", 705, 60)
    #   cv2.moveWindow("Thresh Back",       420, 620)
    #   cv2.moveWindow("Frame Delta Back",  820, 620)
    #   cv2.moveWindow("HSV Back",         1220, 620)

    framex += 1
    if framex > 10:
        framex = 0
        webcamera_firstFrame = None
        picamera_firstFrame = None

        name = "./webserver/pictures/webcamera_frame.jpg"
        cv2.imwrite(name, webcamera_small)

        name = "./webserver/pictures/picamera_frame.jpg"
        cv2.imwrite(name, picamera_small)

        name = "./webserver/pictures/webcamera_frame_hsv.jpg"
        cv2.imwrite(name, webcamera_hsv)

        name = "./webserver/pictures/picamera_frame_hsv.jpg"
        cv2.imwrite(name, picamera_hsv)

    key = cv2.waitKey(1) & 0xFF

    # if the `q` key is pressed, break from the lop
    if key == ord("q"):
        break  # cleanup the webcam and close any open windows

webcamera.release()
picamera.release()
cv2.destroyAllWindows()
