#!/bin/bash

if pgrep raspistill > /dev/null
then
    echo "raspistill already running"
else
lxterminal -e sudo raspistill --nopreview -w 640 -h 480 -q 5 -o /var/www/html/pic.jpg -tl 500 -t 9999999 -th 0:0:0 &

# raspistill -w 640 -h 480 -q 5 -o /tmp/stream/pic.jpg -tl 100 -t 9999999 -th 0:0:0 -n > /dev/null 2>&1& 
    echo "raspistill started"
fi
