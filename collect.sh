#!/bin/bash
while true
do
curl --verbose --compressed 'http://stream.pushshift.io/?type=comments' | node process.js data
sleep 1
done
