#!/bin/bash
curl --verbose --compressed 'http://stream.pushshift.io/?type=comments' | node process.js data
