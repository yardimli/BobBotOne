import argparse
import datetime
import imutils
import time
import cv2

camera = cv2.VideoCapture(0)
time.sleep(0.25)

front_firstFrame = None
back_firstFrame = None

framex = 0
imagex = 0
imagepausex = 65
# loop over the frames of the video
while True:
    (grabbed, frame) = camera.read()

    frame_small = imutils.resize(frame, width=1000)

    #    front_frame = frame[0:frame.shape[0], 0:frame.shape[1] / 2]
    #    back_frame = frame[0:frame.shape[0], frame.shape[1] / 2:frame.shape[1]]
    #    front_small = imutils.resize(front_frame, width=500)
    #    back_small = imutils.resize(back_frame, width=500)
    #    print( ', '.join(frame_small.shape) )
    front_small = frame_small[0:frame_small.shape[0], 0:frame_small.shape[1] // 2]
    back_small = frame_small[0:frame_small.shape[0], frame_small.shape[1] // 2:frame_small.shape[1]]

    front_hsv = cv2.cvtColor(front_small, cv2.COLOR_BGR2HSV)
    back_hsv = cv2.cvtColor(back_small, cv2.COLOR_BGR2HSV)

    front_blur = cv2.cvtColor(front_small, cv2.COLOR_BGR2GRAY)
    front_blur = cv2.GaussianBlur(front_blur, (21, 21), 0)

    back_blur = cv2.cvtColor(back_small, cv2.COLOR_BGR2GRAY)
    back_blur = cv2.GaussianBlur(back_blur, (21, 21), 0)

    # if the first frame is None, initialize it
    if front_firstFrame is None:
        front_firstFrame = front_blur
        continue

    if back_firstFrame is None:
        back_firstFrame = back_blur
        continue

    front_frameDelta = cv2.absdiff(front_firstFrame, front_blur)
    front_thresh = cv2.threshold(front_frameDelta, 25, 255, cv2.THRESH_BINARY)[1]
    front_thresh = cv2.dilate(front_thresh, None, iterations=2)

    back_frameDelta = cv2.absdiff(back_firstFrame, back_blur)
    back_thresh = cv2.threshold(back_frameDelta, 25, 255, cv2.THRESH_BINARY)[1]
    back_thresh = cv2.dilate(back_thresh, None, iterations=2)

    (_, front_cnts, _) = cv2.findContours(front_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    (_, back_cnts, _) = cv2.findContours(back_thresh.copy(), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    for c in front_cnts:
        if cv2.contourArea(c) < 250:
            continue

        (x, y, w, h) = cv2.boundingRect(c)
        cv2.rectangle(front_small, (x, y), (x + w, y + h), (0, 255, 0), 2)

    for c in back_cnts:
        if cv2.contourArea(c) < 250:
            continue

        (x, y, w, h) = cv2.boundingRect(c)
        cv2.rectangle(back_small, (x, y), (x + w, y + h), (0, 255, 0), 2)

    cv2.imshow("Security Feed Front", front_small)
    cv2.imshow("Thresh Front", front_thresh)
    cv2.imshow("Frame Delta Front", front_frameDelta)
    cv2.imshow("HSV Front", front_hsv)

    cv2.moveWindow("Security Feed Front",  0, 20)
    cv2.moveWindow("Thresh Front",       420, 20)
    cv2.moveWindow("Frame Delta Front",  820, 20)
    cv2.moveWindow("HSV Front",         1220, 20)

    cv2.imshow("Security Feed Back", back_small)
    cv2.imshow("Thresh Back", back_thresh)
    cv2.imshow("Frame Delta Back", back_frameDelta)
    cv2.imshow("HSV Back", back_hsv)

    cv2.moveWindow("Security Feed Back",  0, 620)
    cv2.moveWindow("Thresh Back",       420, 620)
    cv2.moveWindow("Frame Delta Back",  820, 620)
    cv2.moveWindow("HSV Back",         1220, 620)

    framex += 1
    if framex > 10:
        framex = 0
        front_firstFrame = None
        back_firstFrame = None

        name = "./webserver/pictures/front_frame_%d.jpg" % imagex
        cv2.imwrite(name, front_small)

        name = "./webserver/pictures/back_frame_%d.jpg" % imagex
        cv2.imwrite(name, back_small)

        name = "./webserver/pictures/front_frame_hsv_%d.jpg" % imagex
        cv2.imwrite(name, front_hsv)

        name = "./webserver/pictures/back_frame_hsv_%d.jpg" % imagex
        cv2.imwrite(name, back_hsv)

    key = cv2.waitKey(1) & 0xFF

    # if the `q` key is pressed, break from the lop
    if key == ord("q"):
        break

# cleanup the camera and close any open windows
camera.release()
cv2.destroyAllWindows()
