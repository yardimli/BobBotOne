"use strict"

var Adafruit_MotorHAT = require('./hat/Adafruit_MotorHAT/Adafruit_MotorHAT');
var sleep = require('sleep');


var mh = new Adafruit_MotorHAT(0x6f, 60);


var turnOffMotors = () => {
  mh.getMotor(1).run(Adafruit_MotorHAT.RELEASE);
  mh.getMotor(2).run(Adafruit_MotorHAT.RELEASE);
  mh.getMotor(3).run(Adafruit_MotorHAT.RELEASE);
  mh.getMotor(4).run(Adafruit_MotorHAT.RELEASE);
};

process.on('exit', (code) => {
  turnOffMotors();
  console.log('About to exit with code:', code);
});


var myMotor1 = mh.getMotor(1);
var myMotor2 = mh.getMotor(2);


console.log("14 15 stop");
mh.getPWM().setPWM(14, 4096, 0);
mh.getPWM().setPWM(15, 4096, 0);
sleep.usleep(50000);

console.log("14 400");
mh.getPWM().setPWM(14, 0, 400);
sleep.sleep(1);
mh.getPWM().setPWM(14, 4096, 0);

console.log("15 450");
mh.getPWM().setPWM(15, 0, 450);
sleep.sleep(1);
mh.getPWM().setPWM(15, 4096, 0);

mh.getPWM().setPWM(14, 4096, 0);
mh.getPWM().setPWM(15, 4096, 0);
sleep.usleep(50000);
sleep.sleep(3);

while (true) {

  for (var i = 350; i < 500; i++) {
    mh.getPWM().setPWM(15, 0, i);
    mh.getPWM().setPWM(14, 0, i);
    sleep.usleep(5000);
  }

  for (var i = 500; i > 350; i--) {
    mh.getPWM().setPWM(15, 0, i);
    mh.getPWM().setPWM(14, 0, i);
    sleep.usleep(5000);
  }

  mh.getPWM().setPWM(14, 4096, 0);
  mh.getPWM().setPWM(15, 4096, 0);
  sleep.usleep(50000);

  if (1 === 1) {
    console.log("Forward! ");
    myMotor1.run(Adafruit_MotorHAT.FORWARD);
    myMotor2.run(Adafruit_MotorHAT.FORWARD);
    console.log('Speed up....');
    for (var i = 0; i < 128; i++) {
      myMotor1.setSpeed(i);
      myMotor2.setSpeed(i);
      sleep.usleep(5000);
    }


    console.log('Slow down....');
    for (var i = 128; i > 0; i--) {
      myMotor1.setSpeed(i);
      myMotor2.setSpeed(i);
      sleep.usleep(5000);
    }


    console.log('Backward! ');
    myMotor1.run(Adafruit_MotorHAT.BACKWARD);
    myMotor2.run(Adafruit_MotorHAT.BACKWARD);

    console.log('Speed up....');
    for (var i = 0; i < 128; i++) {
      myMotor1.setSpeed(i);
      myMotor2.setSpeed(i);
      sleep.usleep(5000);
    }


    console.log('Slow down....');
    for (var i = 128; i > 0; i--) {
      myMotor1.setSpeed(i);
      myMotor2.setSpeed(i);
      sleep.usleep(5000);
    }


    console.log("Release");
    myMotor1.run(Adafruit_MotorHAT.RELEASE);
    myMotor2.run(Adafruit_MotorHAT.RELEASE);
    sleep.sleep(5);

  }
}


