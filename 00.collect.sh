#!/bin/bash
while true
do
curl --verbose --compressed -L --retry 999 --retry-max-time 0 'http://stream.pushshift.io/?type=comments' | node process.js data
sleep 1
done
