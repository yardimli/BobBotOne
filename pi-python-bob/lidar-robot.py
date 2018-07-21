#!/usr/bin/env python3
'''Records measurments to a given file. Usage example:

$ ./record_measurments.py out.txt'''
import sys
from rplidar import RPLidar
import time
import os
import atexit
import curses

from Raspi_MotorHAT_module import Raspi_MotorHAT

PORT_NAME = '/dev/ttyUSB0'

lidar = RPLidar(PORT_NAME)
mh = Raspi_MotorHAT(addr=0x6f)


# recommended for auto-disabling motors on shutdown!
def turnOff():
    print('Stoping Motor.')
    mh.getMotor(1).run(Raspi_MotorHAT.RELEASE)
    mh.getMotor(2).run(Raspi_MotorHAT.RELEASE)
    mh.getMotor(3).run(Raspi_MotorHAT.RELEASE)
    mh.getMotor(4).run(Raspi_MotorHAT.RELEASE)
    time.sleep(0.1)
    print('Stoping Lidar.')
    lidar.stop()
    lidar._serial_port.setDTR(True)
    time.sleep(0.5)
    lidar.disconnect()

    time.sleep(5)

    curses.nocbreak()
    if stdscr:
        stdscr.keypad(0)
    curses.echo()
    curses.endwin()


atexit.register(turnOff)

motors = []

################################# DC motor test!
motors.append(mh.getMotor(1))
motors.append(mh.getMotor(2))
motors.append(mh.getMotor(3))
motors.append(mh.getMotor(4))

# motors 0 and 3 are back motors
# motors 1 and 2 are front motors

# os.system('clear')
stdscr = curses.initscr()
stdscr.clear()
stdscr.refresh()

print("sleeping")
lidar.stop()
lidar._serial_port.setDTR(True)
time.sleep(1)

# set the speed to start, from 0 (off) to 255 (max speed)
motors[0].setSpeed(150)
motors[0].run(Raspi_MotorHAT.FORWARD)
time.sleep(0.1)
motors[0].run(Raspi_MotorHAT.RELEASE)

motors[1].setSpeed(150)
motors[1].run(Raspi_MotorHAT.FORWARD)
time.sleep(0.1)
motors[1].run(Raspi_MotorHAT.RELEASE)

motors[2].setSpeed(150)
motors[2].run(Raspi_MotorHAT.FORWARD)
time.sleep(0.1)
motors[2].run(Raspi_MotorHAT.RELEASE)

motors[3].setSpeed(150)
motors[3].run(Raspi_MotorHAT.FORWARD)
time.sleep(0.1)
motors[3].run(Raspi_MotorHAT.RELEASE)

lidar_zones = [0] * 100
lidar_zones_count = [0] * 100
for deg in range(0, 36):
    lidar_zones_count[deg] = 1

mes_temp_deg = [None] * 1000
mes_temp_dist = [None] * 1000

print("starting")
lidar.start_motor()
try:
    print('Recording measurments... Press Crl+C to stop.')
    xx2 = 0
    for measurement in lidar.iter_measurments(500):
        mes_temp_deg[xx2] = measurement[2]
        mes_temp_dist[xx2] = measurement[3]
        xx2 += 1

        if xx2 > 500:
            xx2 = 0
            for deg in range(0, 36):
                if lidar_zones_count[deg]>10:
                    lidar_zones[deg] = round(lidar_zones[deg] / lidar_zones_count[deg])
                    lidar_zones_count[deg] = 1

            for xx in range(0, 500):

#                degx = round(mes_temp_deg[xx]/10)

                for deg in range(0, 36):
                    startdeg = (deg * 10) - 5
                    enddeg = startdeg + 9
                    if startdeg < 0:
                        startdeg = 360 + startdeg
                    if enddeg < 0:
                        enddeg = 360 - enddeg
                    if enddeg > 360:
                        enddeg = enddeg - 360

                    if mes_temp_deg[xx] in range(startdeg, enddeg):
                        lidar_zones[deg] += round(mes_temp_dist[xx])
                        lidar_zones_count[deg] += 1

            #            stdscr.addstr(ypos, 10, str(round(measurement[3])) + " " + str(round(measurement[2])) + " " + str(
            #                measurement[1]) + " " + str(
            #                measurement[0]) + "            ")
            #            stdscr.refresh()

            for deg in range(0, 36):
                startdeg = (deg * 10) - 5
                enddeg = startdeg + 9
                if startdeg < 0:
                    startdeg = 360 + startdeg
                if enddeg < 0:
                    enddeg = 360 - enddeg
                if enddeg > 360:
                    enddeg = enddeg - 360

                ypos = deg
                xpos = 10
                if ypos > 17:
                    ypos = ypos - 18
                    xpos = 40
                stdscr.addstr(ypos+3, xpos,
                              str(startdeg) + " " + str(enddeg) + " " + str(
                                  round(lidar_zones[deg] / lidar_zones_count[deg])) + "    --        ")
                stdscr.refresh()


except KeyboardInterrupt:
    print('Stoping.')

print('Restore Screen 2')
curses.nocbreak()
stdscr.keypad(False)
curses.echo()
curses.endwin()
