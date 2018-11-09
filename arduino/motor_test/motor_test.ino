/*  Arduino DC Motor Control - PWM | H-Bridge | L298N
         Example 02 - Arduino Robot Car Control
    by Dejan Nedelkovski, www.HowToMechatronics.com
*/

#define enA 9
#define in1 4
#define in2 5
#define enB 10
#define in3 6
#define in4 7

int motorSpeedA = 0;
int motorSpeedB = 0;

void setup() {
  pinMode(enA, OUTPUT);
  pinMode(enB, OUTPUT);
  pinMode(in1, OUTPUT);
  pinMode(in2, OUTPUT);
  pinMode(in3, OUTPUT);
  pinMode(in4, OUTPUT);
  
  pinMode(13, OUTPUT);

digitalWrite(13, HIGH);
// Set Motor A backward
digitalWrite(in1, HIGH);
digitalWrite(in2, LOW);
analogWrite(enA, 200); // Send PWM signal to motor A
delay(500);
analogWrite(enA, 0); // Send PWM signal to motor A

digitalWrite(13, LOW);
delay(1000);

digitalWrite(13, HIGH);

// Set Motor B backward
digitalWrite(in3, HIGH);
digitalWrite(in4, LOW);
analogWrite(enB, 200); // Send PWM signal to motor A
delay(500);
analogWrite(enB, 0); // Send PWM signal to motor A

digitalWrite(13, LOW);
delay(500);
  
}

void loop() {
analogWrite(enA, 0); // Send PWM signal to motor A
analogWrite(enB, 0); // Send PWM signal to motor A
}
