# import the necessary packages
from panorama import Stitcher
import argparse
import imutils
import cv2

# construct the argument parse and parse the arguments
ap = argparse.ArgumentParser()
ap.add_argument("-f", "--first", required=True,
                help="path to the first image")
ap.add_argument("-s", "--second", required=True,
                help="path to the second image")
args = vars(ap.parse_args())

# load the two images and resize them to have a width of 400 pixels
# (for faster processing)
imageA = cv2.imread(args["first"])
imageB = cv2.imread(args["second"])
imageA = imutils.resize(imageA, width=400)
imageB = imutils.resize(imageB, width=400)

# stitch the images together to create a panorama
stitcher = Stitcher()
(result, vis) = stitcher.stitch([imageA, imageB], showMatches=True)

# show the images
cv2.imshow("Image A", imageA)
cv2.imshow("Image B", imageB)
cv2.imshow("Keypoint Matches", vis)
cv2.imshow("Result", result)
cv2.waitKey(0)


# image1 = cv2.imread("webserver/pi_camera/temp_picamera_frame_241.jpg")
# image2 = cv2.imread("webserver/pi_camera/temp_picamera_frame_242.jpg")
# image3 = cv2.imread("webserver/pi_camera/temp_picamera_frame_243.jpg")
# image4 = cv2.imread("webserver/pi_camera/temp_picamera_frame_244.jpg")
# image5 = cv2.imread("webserver/pi_camera/temp_picamera_frame_245.jpg")
# image6 = cv2.imread("webserver/pi_camera/temp_picamera_frame_246.jpg")
