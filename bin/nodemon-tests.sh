#!/bin/bash

if [[ "$NODE_ENV" == "" ]]; then
  NODE_ENV=development
fi

NODE_ENV="$NODE_ENV" \
nodemon \
  -w api \
  -w App.js \
  -w config \
  -w DbUpgrade.js \
  -w models \
  -w Mysqlc.js \
  -w package.json \
  -w test \
  -i api/swagger/swagger.json \
  -e js,ts,component.ts,html,css,json \
  -V \
  -x bin/tests.sh

