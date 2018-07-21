# Simple demo of of the PCA9685 PWM servo/LED controller library.
# This will move channel 0 from min to max position repeatedly.
# Author: Tony DiCola
# License: Public Domain



from __future__ import division
import time
import thread

# Import the PCA9685 module.
import Adafruit_PCA9685

# Uncomment to enable debug output.
# import logging
# logging.basicConfig(level=logging.DEBUG)

# Initialise the PCA9685 using the default address (0x40).
pwm = Adafruit_PCA9685.PCA9685(0x6F)

# Alternatively specify a different address and/or bus:
# pwm = Adafruit_PCA9685.PCA9685(address=0x41, busnum=2)

# Configure min and max servo pulse lengths
servo_min = 150  # Min pulse length out of 4096
servo_max = 600  # Max pulse length out of 4096


# Helper function to make setting a servo pulse width simpler.
def set_servo_pulse(channel, pulse):
    pulse_length = 1000000  # 1,000,000 us per second
    pulse_length //= 60  # 60 Hz
    print('{0}us per period'.format(pulse_length))
    pulse_length //= 4096  # 12 bits of resolution
    print('{0}us per bit'.format(pulse_length))
    pulse *= 1000
    pulse //= pulse_length
    pwm.set_pwm(channel, 0, pulse)


# Set frequency to 60hz, good for servos.
pwm.set_pwm_freq(60)


def moveservo(channel):
    for i in range(0, 24):
        pwm.set_pwm(channel, 0, servo_min)
        time.sleep(1)
        pwm.set_pwm(channel, 0, servo_max)
        time.sleep(1)
        pwm.set_pwm(channel, 4096, 0)
        time.sleep(0.1)


#pwm.set_pwm(channel, 0, 400)
#pwm.set_pwm(channel, 4096, 0)

print('Moving servo on channel 0, press Ctrl-C to quit...')

try:
        thread.start_new_thread(moveservo, (0,))
        thread.start_new_thread(moveservo, (1,))
        thread.start_new_thread(moveservo, (14,))
        thread.start_new_thread(moveservo, (15,))

except:
    print("error")

while 1:
    pass

# while True:
# Move servo on channel O between extremes.
#     for i in range(0,15):
#        print(str(i)+" to min")
#         pwm.set_pwm(i, 0, servo_min)

# 	time.sleep(1)

#     for i in range(0,15):
#         print(str(i)+" to max")
#         pwm.set_pwm(i, 0, servo_max)

# 	time.sleep(1)
