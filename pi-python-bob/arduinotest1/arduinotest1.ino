//Standard PWM DC control
int E1 = 5;     //M1 Speed Control
int E2 = 6;     //M2 Speed Control
int M1 = 4;    //M1 Direction Control
int M2 = 7;    //M1 Direction Control

int ii=0;
int jj=0;

int LeftBumper = 0;
int RightBumper = 0;

int LeftHeight = 0;
int RightHeight = 0;
int FirstHeight = true;
int FirstHeightCounter = 0;

///For previous Romeo, please use these pins.
//int E1 = 6;     //M1 Speed Control
//int E2 = 9;     //M2 Speed Control
//int M1 = 7;    //M1 Direction Control
//int M2 = 8;    //M1 Direction Control

#include <Servo.h> 
 
Servo UltrasoundServo; 
Servo CameraServo;

int CameraPos = 0;
int UltrasoundPos = 0;
int CameraDirection = 0;
int UltrasoundDirection = 0;

void stop(void)                    //Stop
{
  digitalWrite(E1,LOW);   
  digitalWrite(E2,LOW);      
}   
void advance(char a,char b)          //Move forward
{
  analogWrite (E1,a);      //PWM Speed Control
  digitalWrite(M1,HIGH);    
  analogWrite (E2,b);    
  digitalWrite(M2,HIGH);
}  
void back_off (char a,char b)          //Move backward
{
  analogWrite (E1,a);
  digitalWrite(M1,LOW);   
  analogWrite (E2,b);    
  digitalWrite(M2,LOW);
}
void turn_L (char a,char b)             //Turn Left
{
  analogWrite (E1,a);
  digitalWrite(M1,LOW);    
  analogWrite (E2,b);    
  digitalWrite(M2,HIGH);
}
void turn_R (char a,char b)             //Turn Right
{
  analogWrite (E1,a);
  digitalWrite(M1,HIGH);    
  analogWrite (E2,b);    
  digitalWrite(M2,LOW);
}
void setup(void) 
{ 
  int i;
  for(i=4;i<=7;i++)
    pinMode(i, OUTPUT);  
  Serial.begin(19200);      //Set Baud Rate
  Serial.println("Run keyboard control");
  
  UltrasoundServo.attach(9);  
  CameraServo.attach(10);  
  pinMode(A5,INPUT); //Right Bumper
  pinMode(A4,INPUT); //Left Bumper

  pinMode(A3,INPUT); //Right Height Sensor
  pinMode(A2,INPUT); //Left Height Sensor
} 
void loop(void) 
{
  LeftBumper = digitalRead(A4);
  RightBumper = digitalRead(A5);

  LeftHeight = digitalRead(A3);
  RightHeight = digitalRead(A2);
  
  if (LeftBumper == LOW || RightBumper==LOW) {
    digitalWrite(13,HIGH);
    stop();
    turn_R (55,55);
    ii=175;
  } else
  {
    digitalWrite(13,LOW);
  }

  if (LeftHeight == LOW || RightHeight==LOW) {
    digitalWrite(13,HIGH);
    FirstHeightCounter++;
    if (FirstHeightCounter>10)
    {
      if (!FirstHeight) {
        FirstHeight = true;
        
        stop();
        turn_R (100,100);
        delay(100);
        stop();
      } 
    }
  } else
  {
    FirstHeightCounter = 0;
    FirstHeight = false;
    digitalWrite(13,LOW);
  }
  
  if(Serial.available()){
    char val = Serial.read();
    if(val != -1)
    {
      ii=0;
      switch(val)
      {
      case 'd'://Move Forward
        if (FirstHeight) { break; }
        advance (128,128);   //move forward in max speed
        ii=150;
        break;
      case 'a'://Move Backward
        if (FirstHeight) { break; }
        back_off (128,128);   //move back in max speed
        ii=150;
        break;
      case 'w'://Turn Left
        if (FirstHeight) { break; }
        turn_L (55,55);
        break;       
      case 's'://Turn Right
        turn_R (55,55);
        break;
      case 'z':
        jj=0;
        if (not UltrasoundServo.attached() ) {
          UltrasoundServo.attach(9);  
        }
        if (not CameraServo.attached() ) {
          CameraServo.attach(10);  
        }
        Serial.println("Hello");
        break;
      case 'x':
        stop();
        if (UltrasoundServo.attached() ) {
          UltrasoundServo.detach();  
        }
        
        if (CameraServo.attached() ) {
          CameraServo.detach();  
        }
        jj=601;
        break;
      }
    }
    else stop();  
  }
  ii++;
  if (ii>200) {
    ii=0;
    stop();
  }
 
  jj++;  
  if (jj<600) {
    
    if (CameraServo.attached() ) {
      if (CameraDirection==0) {
        CameraServo.write(CameraPos);
        delay(5);
        CameraPos++;
        if (CameraPos>=180) {CameraDirection=1;}
      }
    
      if (CameraDirection==1) {
        CameraServo.write(CameraPos);
        delay(5);
        CameraPos--;
        if (CameraPos<=1) {CameraDirection=0;}
      }
    }    
    
    if (UltrasoundServo.attached() ) {
      if (UltrasoundDirection==0) {
        UltrasoundServo.write(UltrasoundPos);
        delay(5);
        UltrasoundPos++;
        if (UltrasoundPos>=180) {UltrasoundDirection=1;}
      }
    
      if (UltrasoundDirection==1) {
        UltrasoundServo.write(UltrasoundPos);
        delay(5);
        UltrasoundPos--;
        if (UltrasoundPos<=1) {UltrasoundDirection=0;}
      }
    }
    
  } else
  if (jj==600)
  {
    if (UltrasoundServo.attached() ) {
      UltrasoundServo.detach();  
    }
    
    if (CameraServo.attached() ) {
      CameraServo.detach();  
    }
  } else
  {
    jj=601;
  }
  
  delay(10);
}
