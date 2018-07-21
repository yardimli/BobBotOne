# import the necessary packages
import argparse
import datetime
import imutils
import time
import cv2

camera1 = cv2.VideoCapture(0)
time.sleep(0.25)

camera2 = cv2.VideoCapture(1)
time.sleep(0.25)

camera3 = cv2.VideoCapture(2)
time.sleep(0.25)


while True:

    (grabbed1, frame1) = camera1.read()
#   frame1 = imutils.resize(frame1, width=500)
 
    (grabbed2, frame2) = camera2.read()
#    frame2 = imutils.resize(frame2, width=500)
 
 
    (grabbed3, frame3) = camera3.read()
#    frame3 = imutils.resize(frame3, width=500)
 
 
    cv2.imshow("Camera 1", frame1)
    cv2.imshow("Camera 2", frame2)
    cv2.imshow("Camera 3", frame3)

    cv2.moveWindow("Camera 1", 1020, 20);
    cv2.moveWindow("Camera 2", 1020, 320);
    cv2.moveWindow("Camera 3", 1020, 620);

    key = cv2.waitKey(1) & 0xFF

    # if the `q` key is pressed, break from the lop
    if key == ord("q"):
        break

# cleanup the camera and close any open windows
camera.release()
cv2.destroyAllWindows()
