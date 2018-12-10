//v101

#include "Arduino.h"
#include "Wire.h"
#include "DFRobot_VL53L0X.h"

#include "Adafruit_PWMServoDriver.h"
#define SERVOMIN  200 // this is the 'minimum' pulse length count (out of 4096)
#define SERVOMAX  500 // this is the 'maximum' pulse length count (out of 4096)
uint8_t Camera_Servo_Num = 0;
Adafruit_PWMServoDriver pwm = Adafruit_PWMServoDriver();

//DFRobotVL53L0X sensor;

int RightFloorPin = A4;
int LeftFloorPin = A5;

int CameraPos = 0;
int CameraMoving = false;
int CameraNextMove = 0;
int CameraGoTo = 90;
int CameraPin = 10;


#define enA 9
#define in1 4
#define in2 5
#define enB 10
#define in3 6
#define in4 7


int kk = 0;
int mm = 0;

int StopAfterN = 0;

int LeftHeight = 0;
int RightHeight = 0;

bool FirstHeight = true;
int FirstHeightCounter = 0;

int AutoDrive = false;

//int ScanDegrees[190];
//int ScanZones[18];
//int ScanZonesPos = 0;
//int ScanZoneTotal = 0;

//int LoopStart = 0;
//int LoopEnd = 0;

//int LifeCounter = 0;
//int LifeCounterX = 0;

int LastLeftHeight   = 0;
int LastRightHeight  = 0;

//int Read_Distance_Delay = 0;
//float Last_Distance = 0;
//float Current_Distance = 0;
//float Temp_Distance = 0;

//String LCDMsg = "";

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
}


void setup(void)
{
  pinMode(enA, OUTPUT);
  pinMode(enB, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  pinMode(in3, OUTPUT);
  pinMode(in4, OUTPUT);
  
  pinMode(13, OUTPUT);

  Serial.begin(115200);      //Set Baud Rate
  Serial.println("{\"op\":\"start\",\"mes\":\"Hello World\"}");

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

	Camera_Servo_Num = 0;
  for (uint16_t pulselen = SERVOMIN; pulselen < SERVOMAX-100; pulselen++) {
    pwm.setPWM(Camera_Servo_Num, 0, pulselen);
    delay(20);
  }



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

  if (CameraPos!= CameraGoTo) {
    CameraMoving = true;

      CameraNextMove--;
      if (CameraNextMove<=0) {
        if (CameraPos < CameraGoTo) { CameraPos++; }
        if (CameraPos > CameraGoTo) { CameraPos--; }

        if (CameraPos>SERVOMAX) { CameraPos = SERVOMAX; CameraGoTo=CameraPos; }
        if (CameraPos<SERVOMIN) { CameraPos = SERVOMIN; CameraGoTo=CameraPos; }

	      pwm.setPWM(Camera_Servo_Num, 0, CameraPos);
        CameraNextMove = 5;
      }
    if (CameraPos == CameraGoTo) { CameraMoving = false; }
  }


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


		/* (Last_Distance != Current_Distance) || */
    if ( (LastLeftHeight != LeftHeight) || (LastRightHeight != RightHeight) )
    {
      Serial.print("{\"op\":\"sd\", \"c\":");
      Serial.print(mm);
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

	    LastLeftHeight   = LeftHeight;
	    LastRightHeight  = RightHeight;
//	    Last_Distance = Current_Distance;
    }
  }

	/* ( Current_Distance<850 && Current_Distance>120) */
  if (LeftHeight == LOW || RightHeight == LOW ) {
    stop();
  }

  curMillis = millis();
  getDataFromPC();

  if (newDataFromPC) {
    newDataFromPC = false;

    if (strcmp(messageFromPC, "Camera_GoTo") == 0) {
      Serial.print("{\"op\":\"camera_goto\", ");
      Serial.print("\"CurrentValue\":");
      Serial.print(CameraGoTo);
      Serial.print(", \"CurrentPos\":");
      Serial.print(CameraPos);
      Serial.println("}");
      CameraGoTo = FirstInt;
    } else

    if (strcmp(messageFromPC, "Advance") == 0) {
        Serial.print("{\"op\":\"advance\", ");
        Serial.print("\"value_1\":");
        Serial.print(FirstInt);
        Serial.print(", \"value_2\":");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        advance(FirstInt, FirstInt);
        if (SecondInt<10) { delay(250); }
    } else

    if (strcmp(messageFromPC, "Back_Off") == 0) {
        Serial.print("{\"op\":\"back_off\", ");
        Serial.print("\"value_1\":");
        Serial.print(FirstInt);
        Serial.print(", \"value_2\":");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        back_off(FirstInt, FirstInt);
        if (SecondInt<10) { delay(250); }
    } else

    if (strcmp(messageFromPC, "Turn_L") == 0) {
        Serial.print("{\"op\":\"turn_l\", ");
        Serial.print("\"value_1\":");
        Serial.print(FirstInt);
        Serial.print(", \"value_2\":");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        turn_L(FirstInt, FirstInt);
        if (SecondInt<10) { delay(400); }
    } else

    if (strcmp(messageFromPC, "Turn_R") == 0) {
        Serial.print("{\"op\":\"turn_r\", ");
        Serial.print("\"value_1\":");
        Serial.print(FirstInt);
        Serial.print(", \"value_2\":");
        Serial.print(SecondInt);
        Serial.println("}");

        if (SecondInt>120) { SecondInt=120; }
        StopAfterN = SecondInt;
        turn_R(FirstInt, FirstInt);
        if (SecondInt<10) { delay(400); }
    } else

    if (strcmp(messageFromPC, "Current_Distance") == 0) {
//        Serial.print("{\"op\":\"distance\", \"value\":");
//        Serial.print(sensor.getDistance());
//        Serial.println("}");
    } else

    if (strcmp(messageFromPC, "Sweep_Servos") == 0) {
        if (CameraGoTo==0) { CameraGoTo = SERVOMAX; } else { CameraGoTo = SERVOMIN; }
        Serial.println("{\"op\":\"sweep_servo\", \"msg\":\"Sweeping Servos\"}");
    } else

    if (strcmp(messageFromPC, "Home_Servos") == 0) {
        CameraGoTo = SERVOMAX/2;
        Serial.println("{\"op\":\"servo_to\", \"msg\":\"Servo to 90\"}");
    }

    if (strcmp(messageFromPC, "Stop") == 0) {
        stop();
        AutoDrive = 0;
        Serial.println("{\"op\":\"stop\", \"msg\":\"stop all\"}");
    }
  }

  delay(5);
}


void stop(void)                    //Stop
{
	analogWrite(enA, 0); 
	analogWrite(enB, 0); 
}

void advance(char a, char b)         //Move forward
{
	// Set Motor A forward
	digitalWrite(in1, LOW);
	digitalWrite(in2, HIGH);
	analogWrite(enA, a); // Send PWM signal to motor A

	// Set Motor B forward
	digitalWrite(in3, LOW);
	digitalWrite(in4, HIGH);
	analogWrite(enB, b); // Send PWM signal to motor B
}

void back_off(char a, char b)         //Move backward
{
	// Set Motor A backward
	digitalWrite(in1, HIGH);
	digitalWrite(in2, LOW);
	analogWrite(enA, a); // Send PWM signal to motor A

	// Set Motor B backward
	digitalWrite(in3, HIGH);
	digitalWrite(in4, LOW);
	analogWrite(enB, b); // Send PWM signal to motor B
}

void turn_L(char a, char b)            //Turn Left
{
	// Set Motor A forward
	digitalWrite(in1, LOW);
	digitalWrite(in2, HIGH);
	analogWrite(enA, a); // Send PWM signal to motor A

	// Set Motor B backward
	digitalWrite(in3, HIGH);
	digitalWrite(in4, LOW);
	analogWrite(enB, b); // Send PWM signal to motor B
}

void turn_R(char a, char b)            //Turn Right
{
	// Set Motor A backward
	digitalWrite(in1, HIGH);
	digitalWrite(in2, LOW);
	analogWrite(enA, a); // Send PWM signal to motor A

	// Set Motor B forward
	digitalWrite(in3, LOW);
	digitalWrite(in4, HIGH);
	analogWrite(enB, b); // Send PWM signal to motor B
}

// you can use this function if you'd like to set the pulse length in seconds
// e.g. setServoPulse(0, 0.001) is a ~1 millisecond pulse width. its not precise!
void setServoPulse(uint8_t n, double pulse) {
  double pulselength;

  pulselength = 1000000;   // 1,000,000 us per second
  pulselength /= 60;   // 60 Hz
  //Serial.print(pulselength); Serial.println(" us per period");
  pulselength /= 4096;  // 12 bits of resolution
  //Serial.print(pulselength); Serial.println(" us per bit");
  pulse *= 1000000;  // convert to us
  pulse /= pulselength;
  //Serial.println(pulse);
  pwm.setPWM(n, 0, pulse);
}

