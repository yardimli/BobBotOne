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
	mask = cv2.GaussianBlur(mask,(5,5),0) 
	
	
	radius = 0
	x = 0
	y = 0
		
	# detect circles in the image
	print("detect circle")
	circles = cv2.HoughCircles(mask, cv2.HOUGH_GRADIENT,4,200,param1=50,param2=12,minRadius=15,maxRadius=100)
	print("detect circle done")
	 
	# ensure at least some circles were found
	if circles is not None:
		# convert the (x, y) coordinates and radius of the circles to integers
		circles = np.round(circles[0, :]).astype("int")
	 
		# loop over the (x, y) coordinates and radius of the circles
		for (x1, y1, r1) in circles:
			print (x1,y1,r1)
			# draw the circle in the output image, then draw a rectangle
			# corresponding to the center of the circle
			cv2.circle(frame, (x1, y1), r1, (0, 255, 0), 4)
		
