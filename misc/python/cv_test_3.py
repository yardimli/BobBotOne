import cv2

cap=cv2.VideoCapture(0)#Access default WebCam

width,height=640,480 #Aspect ratio of Video to be saved
fps=20 #required fps 
fourcc = cv2.cv.CV_FOURCC('D','I','V','X')#FourCC code for AVI format
w = cv2.VideoWriter('out.AVI', fourcc, fps, (width, height), 1)#see blog

raw_input('Press Enter to start saving video ,and Esc to Stop and Quit')

while(True):
    
    f,frame=cap.read()
    frame=cv2.resize(frame,(width,height)) 
    cv2.imshow('Video',frame)
    w.write(frame)#write frame to video file
    ch=cv2.waitKey(50)
    
    if ch==27:
        break

cap.release()

cv2.destroyAllWindows()
