#include <Wire.h>
#include <Adafruit_MotorShield.h>
#include <avr/wdt.h>

Adafruit_MotorShield AFMS = Adafruit_MotorShield(0x6f); 
Adafruit_DCMotor *myMotor = AFMS.getMotor(2);
Adafruit_DCMotor *myMotor2 = AFMS.getMotor(1);

void setup() {
  wdt_enable(WDTO_4S);
  
  Serial.begin(115200);           // set up Serial library at 9600 bps
  Serial.println("Adafruit Motorshield v2 - DC Motor test!");

  AFMS.begin(60);  // create with the default frequency 1.6KHz

  myMotor->setSpeed(128);
  myMotor->run(FORWARD);
  myMotor->run(RELEASE);

  myMotor2->setSpeed(128);
  myMotor2->run(FORWARD);
  myMotor2->run(RELEASE);

}

void loop() {
  uint8_t i;
  
  wdt_reset();
   
  Serial.print("tick");
    AFMS.setPWM(0, 250);
    delay(1500);

  for (uint16_t i=250; i<400; i += 1) {
    AFMS.setPWM(0, i);
    delay(15);
    Serial.print(i);
    wdt_reset();
  }

  for (uint16_t i=400; i>350; i -= 1) {
    AFMS.setPWM(0, i);
    delay(15);
    Serial.print(i);
    wdt_reset();
  }
  Serial.println("");
  AFMS.setPWM(0, 5000);

  for (uint16_t i=400; i<550; i += 1) {
    AFMS.setPWM(1, i);
    delay(15);
    Serial.print(i);
    wdt_reset();
  }

  for (uint16_t i=550; i>400; i -= 1) {
    AFMS.setPWM(1, i);
    delay(15);
    Serial.print(i);
    wdt_reset();
  }
  
  Serial.println("");
  AFMS.setPWM(1, 5000);
  

  myMotor->run(FORWARD);
  myMotor2->run(FORWARD);
  for (i=0; i<128; i++) {
    myMotor->setSpeed(i);  
    myMotor2->setSpeed(i);  
    delay(2);
  }
  for (i=128; i!=0; i--) {
    myMotor->setSpeed(i);  
    myMotor2->setSpeed(i);  
    delay(2);
  }
  
  Serial.print("tock");

  myMotor->run(BACKWARD);
  myMotor2->run(BACKWARD);
  for (i=0; i<128; i++) {
    myMotor->setSpeed(i);  
    myMotor2->setSpeed(i);  
    delay(2);
  }
  for (i=128; i!=0; i--) {
    myMotor->setSpeed(i);  
    myMotor2->setSpeed(i);  
    delay(2);
  }

  Serial.print("tech");
  myMotor->run(RELEASE);
  delay(25);
  myMotor2->run(RELEASE);
  delay(25);
  
  for (i=0; i<60; i++)
  {
    delay(1000);
    wdt_reset();
  }
}
