#!/bin/bash

source ~/.profile
workon cv

cd /home/pi/SmartRobot

python clickmotion.py
$SHELL