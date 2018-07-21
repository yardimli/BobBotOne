from imutils.video import VideoStream
import datetime
import imutils
import time
import cv2
import requests

picamera = VideoStream(usePiCamera=True).start()
time.sleep(0.25)

picamera_firstFrame = None

panLoop = 0
panPos = 0

framex = 0
imagex = 0
imagepausex = 65
imageChanged = True
# loop over the frames of the video
try:
    while True:

        panLoop += 1
        if panLoop > 30:
            panLoop = 0
            panPos += 1

            if panPos == 1:
                payload = {"servo": "0", "value": "250"}
                r = requests.get("http://192.168.1.241:8080/servo.php", params=payload)
                print(r.text)
                time.sleep(2)


            if panPos == 2:
                payload = {"servo": "0", "value": "350"}
                r = requests.get("http://192.168.1.241:8080/servo.php", params=payload)
                print(r.text)
                time.sleep(2)

            if panPos == 3:
                payload = {"servo": "0", "value": "450"}
                r = requests.get("http://192.168.1.241:8080/servo.php", params=payload)
                print(r.text)
                panPos = 0
                time.sleep(2)

        picamera_frame = picamera.read()
        picamera_small = imutils.resize(picamera_frame, width=640)

        picamera_hsv = cv2.cvtColor(picamera_small, cv2.COLOR_BGR2HSV)

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
            print("area: x: " + str(x) + " y: " + str(y) + " w: " + str(w) + " h: " + str(h))
            cv2.rectangle(picamera_small, (x, y), (x + w, y + h), (0, 255, 0), 1)
            imageChanged = True

        if showvideowin:
            cv2.imshow("Security Feed Back", picamera_small)
            #   cv2.imshow("Thresh Back", picamera_thresh)
            #   cv2.imshow("Frame Delta Back", picamera_frameDelta)
            #   cv2.imshow("HSV Back", picamera_hsv)

            #   cv2.moveWindow("Security Feed Back", 705, 60)
            #   cv2.moveWindow("Thresh Back",       420, 620)
            #   cv2.moveWindow("Frame Delta Back",  820, 620)
            #   cv2.moveWindow("HSV Back",         1220, 620)

        framex += 1
        if imageChanged:  # framex > 5:
            imageChanged = False
            framex = 0
            picamera_firstFrame = None

            name = "./webserver/pictures/picamera_frame_" + serverID + ".jpg"
            cv2.imwrite(name, picamera_small)

            name_hsv = "./webserver/pictures/picamera_frame_hsv_" + serverID + ".jpg"
            cv2.imwrite(name_hsv, picamera_hsv)

            serverurl = 'http://192.168.1.241:8080/post'
            files = {'file': open(name, 'rb')}
            values = {'servername': "241"}

            r = requests.post(serverurl, files=files, data=values)
            print(r.text)

        key = cv2.waitKey(1) & 0xFF

        # if the `q` key is pressed, break from the lop
        if key == ord("q") or key == ord("Q"):
            break  # cleanup the webcam and close any open windows

except KeyboardInterrupt:
    print('^C received, shutting down the image motion detector')

    # picamera.release()
    # cv2.destroyAllWindows()
