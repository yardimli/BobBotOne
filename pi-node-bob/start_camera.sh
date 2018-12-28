#!/bin/bash

if [ ! -d /tmp/stream ]
then
    mkdir /tmp/stream/
fi

# $(dirname $(mktemp -u))

if pgrep raspistill > /dev/null
then
    echo "raspistill already running"
else
    raspistill -w 820 -h 616 -q 15 -o /tmp/stream/bob-pic.jpg -tl 500 -t 300000 -th 0:0:0 -n > /dev/null 2>&1&
    echo "raspistill started"
fi
