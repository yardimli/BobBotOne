#!/usr/bin/env python3
'''Records measurments to a given file. Usage example:

$ ./record_measurments.py out.txt'''
import sys
from rplidar import RPLidar
import time
import atexit

PORT_NAME = '/dev/ttyUSB0'


def print_there(x, y, text):
    sys.stdout.write("\x1b7\x1b[%d;%df%s\x1b8" % (x, y, text))
    sys.stdout.flush()


lidar = RPLidar(PORT_NAME)


# recommended for auto-disabling motors on shutdown!
def turnOff():
    print('Stoping Motor.')
    lidar.stop()
    lidar._serial_port.setDTR(True)
    time.sleep(0.5)
    lidar.disconnect()


atexit.register(turnOffMotors)

print("sleeping")
lidar.stop()
lidar._serial_port.setDTR(True)
time.sleep(1)

print("starting")
lidar.start_motor()
try:
    print('Recording measurments... Press Crl+C to stop.')
    for measurment in lidar.iter_measurments(250):
        # line = '\t'.join(str(v) for v in measurment)
        if measurment[2] > 355 or measurment[2] < 5:
            print(str(round(measurment[3])) + " " + str(round(measurment[2])) + " " + str(measurment[1]) + " " + str(
                measurment[0]))
except KeyboardInterrupt:
    print('Stoping.')

