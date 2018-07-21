#!/usr/bin/env python

from Raspi_MotorHAT_module import Raspi_MotorHAT

import time
import atexit

# create a default object, no changes to I2C address or frequency
mh = Raspi_MotorHAT(addr=0x6f)


# recommended for auto-disabling motors on shutdown!
def turnOffMotors():
    mh.getMotor(1).run(Raspi_MotorHAT.RELEASE)
    mh.getMotor(2).run(Raspi_MotorHAT.RELEASE)
    mh.getMotor(3).run(Raspi_MotorHAT.RELEASE)
    mh.getMotor(4).run(Raspi_MotorHAT.RELEASE)


atexit.register(turnOffMotors)

motors = []

################################# DC motor test!
motors.append(mh.getMotor(1))
motors.append(mh.getMotor(2))
motors.append(mh.getMotor(3))
motors.append(mh.getMotor(4))

# motors 0 and 3 are back motors
# motors 1 and 2 are front motors

# when viewed from the back
# back right M1 motor 0
# front right M2 motor 1

# front left M3 motor 2
# back left M4 motor 3

# set the speed to start, from 0 (off) to 255 (max speed)
motors[0].setSpeed(150)
motors[0].run(Raspi_MotorHAT.FORWARD)
# turn on motor
motors[0].run(Raspi_MotorHAT.RELEASE)
motors[1].setSpeed(150)
motors[1].run(Raspi_MotorHAT.FORWARD)
motors[1].run(Raspi_MotorHAT.RELEASE)


motors[2].setSpeed(150)
motors[2].run(Raspi_MotorHAT.FORWARD)
motors[2].run(Raspi_MotorHAT.RELEASE)
motors[3].setSpeed(150)
motors[3].run(Raspi_MotorHAT.FORWARD)
motors[3].run(Raspi_MotorHAT.RELEASE)



while (True):
    print("Rotate! ")
    motors[0].run(Raspi_MotorHAT.FORWARD)
    motors[1].run(Raspi_MotorHAT.FORWARD)

    motors[2].run(Raspi_MotorHAT.BACKWARD)
    motors[3].run(Raspi_MotorHAT.BACKWARD)

    print("\tSpeed up...")
    for i in range(255):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.005)

    print("\tSlow down...")
    for i in reversed(range(255)):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.005)



    print("Forwards! ")
    motors[0].run(Raspi_MotorHAT.FORWARD)
    motors[1].run(Raspi_MotorHAT.FORWARD)

    motors[2].run(Raspi_MotorHAT.FORWARD)
    motors[3].run(Raspi_MotorHAT.FORWARD)

    print("\tSpeed up...")
    for i in range(255):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.001)

    print("\tSlow down...")
    for i in reversed(range(255)):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.001)

    print("Backward! ")
    motors[0].run(Raspi_MotorHAT.BACKWARD)
    motors[1].run(Raspi_MotorHAT.BACKWARD)

    motors[2].run(Raspi_MotorHAT.BACKWARD)
    motors[3].run(Raspi_MotorHAT.BACKWARD)

    print("\tSpeed up...")
    for i in range(165):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.001)

    print("\tSlow down...")
    for i in reversed(range(165)):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.001)

    print("Rotate! ")
    motors[0].run(Raspi_MotorHAT.BACKWARD)
    motors[1].run(Raspi_MotorHAT.BACKWARD)

    motors[2].run(Raspi_MotorHAT.FORWARD)
    motors[3].run(Raspi_MotorHAT.FORWARD)

    print("\tSpeed up...")
    for i in range(255):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.005)

    print("\tSlow down...")
    for i in reversed(range(255)):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.005)

    print("Backward! ")
    motors[0].run(Raspi_MotorHAT.BACKWARD)
    motors[1].run(Raspi_MotorHAT.BACKWARD)

    motors[2].run(Raspi_MotorHAT.BACKWARD)
    motors[3].run(Raspi_MotorHAT.BACKWARD)

    print("\tSpeed up...")
    for i in range(255):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.001)

    print("\tSlow down...")
    for i in reversed(range(255)):
        motors[0].setSpeed(i)
        motors[1].setSpeed(i)

        motors[2].setSpeed(i)
        motors[3].setSpeed(i)
        time.sleep(0.001)

    print("Release")
    motors[0].run(Raspi_MotorHAT.RELEASE)
    motors[1].run(Raspi_MotorHAT.RELEASE)

    motors[2].run(Raspi_MotorHAT.RELEASE)
    motors[3].run(Raspi_MotorHAT.RELEASE)
    time.sleep(1.0)
