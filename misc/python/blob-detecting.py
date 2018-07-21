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
#			print(area)
			if 1000 < area < 30000:
				contours_area.append(con)
				
		# check if contour is of circular shape
		for con in contours_area:
			perimeter = cv2.arcLength(con, True)
			area = cv2.contourArea(con)
			if perimeter == 0:
				break
			circularity = 4*math.pi*(area/(perimeter*perimeter))
			print ( circularity )
			if 0.7 < circularity < 1.2:
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

