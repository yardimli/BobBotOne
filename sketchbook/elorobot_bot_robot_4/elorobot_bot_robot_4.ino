//v102

#include "Arduino.h"
#include "Wire.h"
#include <NewPing.h>
#include <DFRobot_RGBPanel.h>
//#include <avr/wdt.h>
#include <EnableInterrupt.h>

DFRobot_RGBPanel panel;

int RightHeightPin = A0;
int LeftHeightPin = A1;

int LeftHeight = 0;
int RightHeight = 0;

int LastLeftHeight   = 0;
int LastRightHeight  = 0;

int UltraSoundEcho = 5;
int UltraSoundTrigger = 4;
int UltraSoundMaxDistance = 200;
int UltraSoundDistance = 0;

NewPing sonar(UltraSoundTrigger, UltraSoundEcho, UltraSoundMaxDistance); // NewPing setup of pins and maximum distance.

int FrontLeftMotorEncoder = 2;
int FrontRightMotorEncoder = 3;

int FrontLeftEncoderCounter = 0;
int FrontRightEncoderCounter = 0;
int LastFrontLeftSpeed =0;
int LastFrontRightSpeed =0;


int BackLeftMotorEncoder = 6;
int BackRightMotorEncoder = 7;

int BackLeftEncoderCounter = 0;
int BackRightEncoderCounter = 0;
int LastBackLeftSpeed =0;
int LastBackRightSpeed =0;


unsigned long LastTimer = 0;                //print manager timer

int PanelColor;

int SecondsLife1 = 0;
int SecondsLife2 = 0;


bool FirstHeight = true;
int FirstHeightCounter = 0;


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
  pinMode(13, OUTPUT);

  Serial.begin(115200);      //Set Baud Rate
  Serial.println("{\"op\":\"start\",\"mes\":\"Hello World\"}");

  pinMode(RightHeightPin, INPUT); //Right Height Sensor
  pinMode(LeftHeightPin, INPUT); //Left Height Sensor

	pinMode(UltraSoundEcho,INPUT);
	pinMode(UltraSoundTrigger,OUTPUT);

//	pinMode(FrontLeftMotorEncoder,INPUT);
//	pinMode(FrontRightMotorEncoder,INPUT);
//  attachInterrupt(digitalPinToInterrupt(FrontLeftMotorEncoder), FrontLeftWheelSpeed, CHANGE);
//  attachInterrupt(digitalPinToInterrupt(FrontRightMotorEncoder), FrontRightWheelSpeed, CHANGE);

	pinMode(FrontLeftMotorEncoder,INPUT_PULLUP);
	pinMode(FrontRightMotorEncoder,INPUT_PULLUP);

	enableInterrupt(FrontLeftMotorEncoder, FrontLeftWheelSpeed, CHANGE);
	enableInterrupt(FrontRightMotorEncoder, FrontRightWheelSpeed, CHANGE);

	pinMode(BackLeftMotorEncoder,INPUT_PULLUP);
	pinMode(BackRightMotorEncoder,INPUT_PULLUP);

	enableInterrupt(BackLeftMotorEncoder, BackLeftWheelSpeed, CHANGE);
	enableInterrupt(BackRightMotorEncoder, BackRightWheelSpeed, CHANGE);


  panel.clear();
  panel.display(17,RED);
  delay(100);
	panel.display(2,BLUE);
  delay(10);
}


void loop(void)
{
//  wdt_reset();

  if(millis() - LastTimer > 1000){
	    LastTimer = millis();
	    SecondsLife1++;
	}

  getDataFromPC();

  if (newDataFromPC) {
    newDataFromPC = false;

    if (strcmp(messageFromPC, "Clear_Panel") == 0) {
			  if (FirstInt==100) {
				  panel.clear();
			  } else
			  {
				  panel.fillScreen(FirstInt);
			  }
		} else

    if (strcmp(messageFromPC, "Set_Text") == 0) {
      if (SecondInt==1) {
			  panel.clear();
			  panel.print(StringMessage,FirstInt);
      } else
      if (SecondInt==2) {
			  panel.clear();
			  panel.scroll(Left);
			  panel.print(StringMessage,FirstInt);
      } else
      if (SecondInt==3) {
			  panel.clear();
			  panel.scroll(Right);
			  panel.print(StringMessage,FirstInt);
      }
		} else

    if (strcmp(messageFromPC, "Set_Face") == 0) {
		  panel.display(SecondInt,FirstInt);
    } else

    if (strcmp(messageFromPC, "Get_Data") == 0) {
		  LeftHeight = digitalRead(LeftHeightPin);
		  RightHeight = digitalRead(RightHeightPin);

		  UltraSoundDistance = sonar.ping_cm(); // Send ping, get distance in cm and print result (0 = outside set distance range)

	    Serial.print("{\"op\":\"en\", \"c\":");
	    Serial.print(SecondsLife1);
	    Serial.print(", ");

	    Serial.print("\"fle\":");
	    Serial.print(FrontLeftEncoderCounter);
	    Serial.print(", ");

	    Serial.print("\"fre\":");
	    Serial.print(FrontRightEncoderCounter);
	    Serial.print(", ");

	    Serial.print("\"ble\":");
	    Serial.print(BackLeftEncoderCounter);
	    Serial.print(", ");

	    Serial.print("\"bre\":");
	    Serial.print(BackRightEncoderCounter);
	    Serial.print(", ");

	    Serial.print("\"lh\":");
	    Serial.print(LeftHeight);
	    Serial.print(", ");

	    Serial.print("\"rh\":");
	    Serial.print(RightHeight);
	    Serial.print(", ");

	    Serial.print("\"us\":");
	    Serial.print(UltraSoundDistance);

	    Serial.println("}");

	    LastFrontLeftSpeed = FrontLeftEncoderCounter;
	    LastFrontRightSpeed = FrontRightEncoderCounter;
	    FrontLeftEncoderCounter = 0;
	    FrontRightEncoderCounter = 0;
	    
	    LastBackLeftSpeed = BackLeftEncoderCounter;
	    LastBackRightSpeed = BackRightEncoderCounter;
	    BackLeftEncoderCounter = 0;
	    BackRightEncoderCounter = 0;
	    

	    LastLeftHeight   = LeftHeight;
	    LastRightHeight  = RightHeight;
    }
  }

  delay(5);
}


void FrontLeftWheelSpeed()
{
  FrontLeftEncoderCounter++;  //count the left wheel encoder interrupts
}


void FrontRightWheelSpeed()
{
  FrontRightEncoderCounter++; //count the right wheel encoder interrupts
}


void BackLeftWheelSpeed()
{
  BackLeftEncoderCounter++;  //count the left wheel encoder interrupts
}


void BackRightWheelSpeed()
{
  BackRightEncoderCounter++; //count the right wheel encoder interrupts
}