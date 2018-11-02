//Standard PWM DC control
//v21

#include <Servo.h>
#include "Arduino.h"
#include "Wire.h"
#include "DFRobot_VL53L0X.h"
//#include "DFRobot_LCD.h"

#include "Adafruit_PWMServoDriver.h"
#define SERVOMIN  200 // this is the 'minimum' pulse length count (out of 4096)
#define SERVOMAX  500 // this is the 'maximum' pulse length count (out of 4096)
uint8_t servonum = 0;
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

//DFRobotVL53L0X sensor;
//DFRobot_LCD lcd(16,2);

//Servo TOFServo;
Servo CameraServo;


int RightBumperPin = A2;
int LeftBumperPin = A3;
int RightFloorPin = A4;
int LeftFloorPin = A5;

int CameraPos = 0;
int CameraMoving = false;
int CameraNextMove = 0;
int CameraGoTo = 90;
int CameraPin = 10;


int E1 = 5;     //M1 Speed Control
int E2 = 6;     //M2 Speed Control
int M1 = 4;    //M1 Direction Control
int M2 = 7;    //M1 Direction Control

int kk = 0;
int mm = 0;

int StopAfterN = 0;

int LeftBumper = 0;
int RightBumper = 0;

int LeftHeight = 0;
int RightHeight = 0;

bool FirstHeight = true;
int FirstHeightCounter = 0;

int AutoDrive = false;

///For previous Romeo, please use these pins.
//int E1 = 6;     //M1 Speed Control
//int E2 = 9;     //M2 Speed Control
//int M1 = 7;    //M1 Direction Control
//int M2 = 8;    //M1 Direction Control

//int TOFPos = 0;
//int TOFMoving = false;
//int TOFNextMove = 0;
//int TOFGoTo = 90;
//int TOFPin = 9;
//int TOFScanDirection = 1;

//int ScanDegrees[190];
//int ScanZones[18];
//int ScanZonesPos = 0;
//int ScanZoneTotal = 0;

//int LoopStart = 0;
//int LoopEnd = 0;

//int LifeCounter = 0;
//int LifeCounterX = 0;

//bool StartTOFScan = false;


int LastLeftBumper   = 0;
int LastRightBumper  = 0;
int LastLeftHeight   = 0;
int LastRightHeight  = 0;

//int Read_Distance_Delay = 0;
//float Last_Distance = 0;
//float Current_Distance = 0;
//float Temp_Distance = 0;

//String LCDMsg = "";

int RepeatTurnLCounter = 0;
int RepeatTurnLCounterSpeed = 0;
int RepeatTurnRCounter = 0;
int RepeatTurnRCounterSpeed = 0;

//===========================================================================================
const byte buffSize = 128;
char inputBuffer[buffSize];
const char startMarker = '<';
const char endMarker = '>';
byte bytesRecvd = 0;
boolean readInProgress = false;
boolean newDataFromPC = false;

char messageFromPC[buffSize] = {0};
char StringMessage[buffSize] = {0};
int FirstInt = 0;
int SecondInt = 0;

float servoFraction = 0.0; // fraction of servo range to move
unsigned long curMillis;


//===========================================================================================
void getDataFromPC() {

  // receive data from PC and save it into inputBuffer
  while (Serial.available() > 0) {

    char x = Serial.read();

    // the order of these IF clauses is significant
    if (x == endMarker) {
      readInProgress = false;
      newDataFromPC = true;
      inputBuffer[bytesRecvd] = 0;
      parseData();
      break;
    }

    if(readInProgress) {
      inputBuffer[bytesRecvd] = x;
      bytesRecvd ++;
      if (bytesRecvd == buffSize) {
        bytesRecvd = buffSize - 1;
      }
    }

    if (x == startMarker) {
      bytesRecvd = 0;
      readInProgress = true;
    }
  }
}

//===========================================================================================
void parseData() {

  // split the data into its parts
  char * strtokIndx; // this is used by strtok() as an index

  strtokIndx = strtok(inputBuffer,",");      // get the first part - the string
  strcpy(messageFromPC, strtokIndx); // copy it to messageFromPC

  strtokIndx = strtok(NULL, ","); // this continues where the previous call left off
  FirstInt = atoi(strtokIndx);     // convert this part to an integer

  strtokIndx = strtok(NULL, ",");
  SecondInt = atoi(strtokIndx);     // convert this part to an integer

  strtokIndx = strtok(NULL, ",");
  strcpy(StringMessage, strtokIndx); // copy it to messageFromPC

//  servoFraction = atof(strtokIndx);     // convert this part to a float
}


void setup(void)
{
  int i;
  for (i = 4; i <= 7; i++)
    pinMode(i, OUTPUT);
  Serial.begin(115200);      //Set Baud Rate
  Serial.println("{op:'start':mes:'Hello World'}");

//  TOFServo.attach(TOFPin);
  CameraServo.attach(CameraPin);

  pinMode(RightBumperPin, INPUT); //Right Bumper
  pinMode(LeftBumperPin, INPUT); //Left Bumper

  pinMode(RightFloorPin, INPUT); //Right Height Sensor
  pinMode(LeftFloorPin, INPUT); //Left Height Sensor


  //join i2c bus (address optional for master)
  Wire.begin();
  //Set I2C sub-device address
  //sensor.begin(0x50);
  //Set to Back-to-back mode and high precision mode
  //sensor.setMode(Continuous, High);
  //Laser rangefinder begins to work
  //sensor.start();

  pwm.begin();
  pwm.setPWMFreq(60);  // Analog servos run at ~60 Hz updates

	delay(100);

  Serial.println(servonum);
  for (uint16_t pulselen = SERVOMIN; pulselen < SERVOMAX; pulselen++) {
    pwm.setPWM(servonum, 0, pulselen);
    delay(20);
  }

  delay(500);
  for (uint16_t pulselen = SERVOMAX; pulselen > SERVOMIN; pulselen--) {
    pwm.setPWM(servonum, 0, pulselen);
    delay(20);
  }

  delay(500);


//  lcd.init();
//  lcd.print("hello world");

//  for (int scount =  0; scount < 180; scount++) { ScanDegrees[scount] = 0; }
}


void loop(void)
{
  if (StopAfterN>0) {
    StopAfterN--;
  }

  if (StopAfterN<=0) {
    StopAfterN = 0;
    stop();
  }

//  LifeCounterX++;
//  if (LifeCounterX>500) {
//    LifeCounter++;
//    LifeCounterX=0;
//    int r = random(255);
//    int g = random(255);
//    int b = random(255);
//    lcd.setRGB(r, g, b);
//    lcd.setCursor(0,1);
//    if (LCDMsg!="") {
//      lcd.print(LCDMsg);
//      LCDMsg = "";
//    } else
//    {
//      lcd.print(LifeCounter);
//      lcd.print(" ");
//      lcd.print(StopAfterN);
//      lcd.print("        ");
//    }
//  }

//  if (StartTOFScan) {
//    //move scanner, find angle of longest free space
//    if (!TOFMoving) {
//      ScanDegrees[TOFPos] = sensor.getDistance();
//
////      Serial.print(TOFPos);
////      Serial.print("deg. distance: ");
////      Serial.println(ScanDegrees[TOFPos]);
//
//      if (TOFScanDirection==1) { TOFGoTo = TOFGoTo + 5; }
//      if (TOFScanDirection==2) { TOFGoTo = TOFGoTo - 5; }
//      if (TOFGoTo>=170 || TOFGoTo<=10) {
//        Serial.print("{op:'scan_result',");
//
//	      Serial.print("dir:");
//	      Serial.print(TOFScanDirection);
//	      Serial.print(", scans: { ");
//
//
//        for (int scount = 1; scount <= 17; scount++) {
//          LoopStart = (scount*10)+1;
//          LoopEnd = LoopStart+10;
//
//          ScanZoneTotal = 0;
//          for (int scount2 = LoopStart; scount2 < LoopEnd; scount2++) ScanZoneTotal += ScanDegrees[scount2];
//
//          int ScanZoneAvg = ScanZoneTotal/2;
//
//          ScanZones[scount]=ScanZoneAvg;
//
//		      Serial.print("{ start:");
//		      Serial.print(LoopStart);
//		      Serial.print(", ");
//
//		      Serial.print("end:");
//		      Serial.print(LoopEnd-1);
//		      Serial.print(", ");
//
//		      Serial.print("avg_dist:");
//		      Serial.print(ScanZoneAvg);
//		      Serial.print("} , ");
//        }
//
//        Serial.println("} }");
//        if (TOFGoTo>=170) {
//          TOFGoTo=170;
//          TOFScanDirection=2;
//        }
//
//        if (TOFGoTo<=10) {
//          TOFGoTo = 10;
//          TOFScanDirection=1;
//        }
//
//        for (int scount2 =  0; scount2 < 180; scount2++) ScanDegrees[scount2] = 0;
//      }
//    }
//  }


  if (CameraPos!= CameraGoTo) {
    CameraMoving = true;

    if (!CameraServo.attached() ) { CameraServo.attach(CameraPin); }

    if (CameraServo.attached() ) {

      CameraNextMove--;
      if (CameraNextMove<=0) {
        if (CameraPos < CameraGoTo) { CameraPos++; }
        if (CameraPos > CameraGoTo) { CameraPos--; }
        
        CameraServo.write(CameraPos);
        CameraNextMove = 5;
      }
    }
    
//    if (CameraPos == CameraGoTo && CameraServo.attached() ) { CameraServo.detach(); }
    if (CameraPos == CameraGoTo) { CameraMoving = false; }
  }


//  if (TOFPos!= TOFGoTo) {
//    TOFMoving = true;
//    if (!TOFServo.attached() ) { TOFServo.attach(TOFPin); }
//
//    if (TOFServo.attached() ) {
//
//      TOFNextMove--;
//      if (TOFNextMove<=0) {
//        if (TOFPos < TOFGoTo) { TOFPos++; }
//        if (TOFPos > TOFGoTo) { TOFPos--; }
////        Serial.print("Move TOF to :");
////        Serial.println(TOFPos);
//
//        TOFServo.write(TOFPos);
//        TOFNextMove = 5;
//      }
//    }
//
////    if (TOFPos == TOFGoTo && TOFServo.attached() ) { TOFServo.detach(); }
//    if (TOFPos == TOFGoTo) { TOFMoving = false; }
//  }




  LeftBumper = digitalRead(LeftBumperPin);
  RightBumper = digitalRead(RightBumperPin);

  LeftHeight = digitalRead(LeftFloorPin);
  RightHeight = digitalRead(RightFloorPin);

//	Read_Distance_Delay++;
//	if (Read_Distance_Delay>5) {
//		Temp_Distance = sensor.getDistance();
//		if (Temp_Distance>120) {
//		  Current_Distance = Temp_Distance;
//		}
//	  Read_Distance_Delay = 0;
//	}

  kk++;
  if (kk>10) {
    mm++;
    kk=0;
    if (mm>10000) {
      mm=0;
    }


    if ( (LastLeftBumper != LeftBumper) ||
         (LastRightBumper != RightBumper) ||
         (LastLeftHeight != LeftHeight) ||
         (LastRightHeight != RightHeight) ) //||
//         (Last_Distance != Current_Distance) )
    {
      Serial.print("{\"op\":\"sd\", \"c\":");
      Serial.print(mm);
      Serial.print(", ");
    
      Serial.print("\"lb\":");
      Serial.print(LeftBumper);
      Serial.print(", ");
      Serial.print("\"rb\":");
      Serial.print(RightBumper);
      Serial.print(", ");
    
      Serial.print("\"lh\":");
      Serial.print(LeftHeight);
      Serial.print(", ");
      Serial.print("\"rh\":");
      Serial.print(RightHeight);

//			Serial.print(", ");
//			Serial.print("\"d\":");
//			Serial.print(Current_Distance);

      Serial.println("}");

	    LastLeftBumper   = LeftBumper;
	    LastRightBumper  = RightBumper;
	    LastLeftHeight   = LeftHeight;
	    LastRightHeight  = RightHeight;
//	    Last_Distance = Current_Distance;
    }
  }

//  if (LeftBumper == LOW) { LCDMsg = "Left B"; }
//  if (RightBumper == LOW) { LCDMsg = "Right B"; }
//  if (LeftHeight == LOW) { LCDMsg = "Left H"; }
//  if (RightHeight == LOW) { LCDMsg = "Right H"; }


  if (LeftBumper == LOW || RightBumper == LOW || LeftHeight == LOW || RightHeight == LOW  ) { // || ( Current_Distance<850 && Current_Distance>120)) {
    RepeatTurnLCounter=0;
    RepeatTurnRCounter=0;

    stop();
  }


	if (RepeatTurnLCounter>0 && StopAfterN==0) {
		RepeatTurnLCounter--;

		if (RepeatTurnLCounter>10) {
	    StopAfterN = 15;
	    turn_L(RepeatTurnLCounterSpeed, RepeatTurnLCounterSpeed);
	  }
	}

	if (RepeatTurnRCounter>0 && StopAfterN==0) {
		RepeatTurnRCounter--;
		if (RepeatTurnRCounter>10) {
	    StopAfterN = 15;
	    turn_R(RepeatTurnRCounterSpeed, RepeatTurnRCounterSpeed);
	  }
	}

  curMillis = millis();
  getDataFromPC();

  if (newDataFromPC) {
    newDataFromPC = false;

    if (strcmp(messageFromPC, "Camera_GoTo") == 0) {
      Serial.print("{op:'camera_goto', ");
      Serial.print("CurrentValue:");
      Serial.print(CameraGoTo);
      Serial.print(", CurrentPos:");
      Serial.print(CameraPos);
      Serial.println("}");
      CameraGoTo = FirstInt;
    } else

    if (strcmp(messageFromPC, "Advance") == 0) {
        Serial.print("{op:'advance', ");
        Serial.print("value_1:");
        Serial.print(FirstInt);
        Serial.print(", value_2:");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        advance(FirstInt, FirstInt);

        RepeatTurnLCounter=0;
        RepeatTurnRCounter=0;
        if (SecondInt<10) { delay(250); }
    } else

    if (strcmp(messageFromPC, "Back_Off") == 0) {
        Serial.print("{op:'back_off', ");
        Serial.print("value_1:");
        Serial.print(FirstInt);
        Serial.print(", value_2:");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        back_off(FirstInt, FirstInt);

        RepeatTurnLCounter=0;
        RepeatTurnRCounter=0;
        if (SecondInt<10) { delay(250); }
    } else

    if (strcmp(messageFromPC, "Turn_L") == 0) {
        Serial.print("{op:'turn_l', ");
        Serial.print("value_1:");
        Serial.print(FirstInt);
        Serial.print(", value_2:");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        turn_L(FirstInt, FirstInt);

        RepeatTurnLCounter=0;
        RepeatTurnRCounter=0;
        if (SecondInt<10) { delay(400); }
    } else

    if (strcmp(messageFromPC, "Turn_R") == 0) {
        Serial.print("{op:'turn_r', ");
        Serial.print("value_1:");
        Serial.print(FirstInt);
        Serial.print(", value_2:");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        turn_R(FirstInt, FirstInt);

        RepeatTurnLCounter=0;
        RepeatTurnRCounter=0;
        if (SecondInt<10) { delay(400); }
    } else

    if (strcmp(messageFromPC, "Repeat_L") == 0) {
        Serial.print("{op:'repeat_turn_l', ");
        Serial.print("speed:");
        Serial.print(FirstInt);
        Serial.print(", count:");
        Serial.print(SecondInt);
        Serial.println("}");

        if (FirstInt>255) { FirstInt=255; }
        if (SecondInt>40) { SecondInt=40; }
        RepeatTurnLCounterSpeed = FirstInt;
		    RepeatTurnLCounter = SecondInt;
    } else

    if (strcmp(messageFromPC, "Repeat_R") == 0) {
        Serial.print("{op:'repeat_turn_r', ");
        Serial.print("speed:");
        Serial.print(FirstInt);
        Serial.print(", count:");
        Serial.print(SecondInt);
        Serial.println("}");

        if (FirstInt>255) { FirstInt=255; }
        if (SecondInt>40) { SecondInt=40; }
        RepeatTurnRCounterSpeed = FirstInt;
		    RepeatTurnRCounter = SecondInt;
    } else

    if (strcmp(messageFromPC, "Current_Distance") == 0) {
//        Serial.print("{op:'distance', value:");
//        Serial.print(sensor.getDistance());
//        Serial.println("}");
    } else

    if (strcmp(messageFromPC, "Sweep_Servos") == 0) {
        if (CameraGoTo==0) { CameraGoTo = 180; } else { CameraGoTo = 0; }
//        if (TOFGoTo==0) { TOFGoTo = 180; } else { TOFGoTo = 0; }

        Serial.println("{op:'sweep_servo', msg:'Sweeping Servos'}");
    } else

    if (strcmp(messageFromPC, "Home_Servos") == 0) {
        CameraGoTo = 90;
//        TOFGoTo = 90;

        Serial.println("{op:'servo_to', msg:'Servo to 90'}");
    }

    if (strcmp(messageFromPC, "Stop") == 0) {
        stop();
        AutoDrive = 0;
        RepeatTurnLCounter=0;
        RepeatTurnRCounter=0;

//        if (TOFServo.attached() ) { TOFServo.detach(); }
        if (CameraServo.attached() ) { CameraServo.detach(); }

        Serial.println("{op:'stop', msg:'stop all'}");
    }

//    else
//    if (strcmp(messageFromPC, "Switch_Scan") == 0) {
//        StartTOFScan = !StartTOFScan;
//        Serial.print("{op:'switch_scan', value:");
//        Serial.print(StartTOFScan);
//        Serial.println("}");
//    } else
//
//    if (strcmp(messageFromPC, "LCD") == 0) {
//      Serial.print("{op:'lcd', ");
//      Serial.print("set text to:");
//      Serial.print(StringMessage);
//      Serial.println("}");
//
//	    lcd.setRGB(255, 255, 255);
//	    lcd.setCursor(FirstInt,SecondInt);
//      lcd.print(StringMessage);
//    } else
//
//    if (strcmp(messageFromPC, "Scan_GoTo") == 0) {
//      Serial.print("{op:'scan_goto', ");
//      Serial.print("CurrentValue:");
//      Serial.print(TOFGoTo);
//      Serial.print(", CurrentPos:");
//      Serial.print(TOFPos);
//      Serial.println("}");
//      TOFGoTo = FirstInt;
//    }
  }

  delay(5);
}


void stop(void)                    //Stop
{
  digitalWrite(E1, LOW);
  digitalWrite(E2, LOW);
}

void advance(char a, char b)         //Move forward
{
  analogWrite (E1, a);     //PWM Speed Control
  digitalWrite(M1, HIGH);
  analogWrite (E2, b);
  digitalWrite(M2, HIGH);
}

void back_off(char a, char b)         //Move backward
{
  analogWrite (E1, a);
  digitalWrite(M1, LOW);
  analogWrite (E2, b);
  digitalWrite(M2, LOW);
}

void turn_L(char a, char b)            //Turn Left
{
  analogWrite (E1, a);
  digitalWrite(M1, HIGH);
  analogWrite (E2, b);
  digitalWrite(M2, LOW);
}

void turn_R(char a, char b)            //Turn Right
{
  analogWrite (E1, a);
  digitalWrite(M1, LOW);
  analogWrite (E2, b);
  digitalWrite(M2, HIGH);
}

// you can use this function if you'd like to set the pulse length in seconds
// e.g. setServoPulse(0, 0.001) is a ~1 millisecond pulse width. its not precise!
void setServoPulse(uint8_t n, double pulse) {
  double pulselength;

  pulselength = 1000000;   // 1,000,000 us per second
  pulselength /= 60;   // 60 Hz
  Serial.print(pulselength); Serial.println(" us per period");
  pulselength /= 4096;  // 12 bits of resolution
  Serial.print(pulselength); Serial.println(" us per bit");
  pulse *= 1000000;  // convert to us
  pulse /= pulselength;
  Serial.println(pulse);
  pwm.setPWM(n, 0, pulse);
}

