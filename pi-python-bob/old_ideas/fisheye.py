import cv2
import numpy as np
import time

# if the video argument is None, then we are reading from webcam
camera = cv2.VideoCapture(1)
time.sleep(0.25)

assert float(cv2.__version__.rsplit('.', 1)[0]) >= 3, 'OpenCV version 3 or newer required.'

K = np.array([[689.21, 0., 1295.56],
              [0., 690.48, 942.17],
              [0., 0., 1.]])

# zero distortion coefficients work well for this image
D = np.array([0., 0., 0., 0.])

# use Knew to scale the output
Knew = K.copy()
Knew[(0, 1), (0, 1)] = 0.4 * Knew[(0, 1), (0, 1)]

while True:
    (grabbed, frame) = camera.read()

    crop_img = frame[0:760, 0:760]

    img_undistorted = cv2.fisheye.undistortImage(crop_img, K, D=D, Knew=Knew)
    cv2.imshow('undistorted', img_undistorted)
    cv2.imshow('crop_img', crop_img)

    key = cv2.waitKey(1) & 0xFF

    # if the `q` key is pressed, break from the lop
    if key == ord("q"):
        break
