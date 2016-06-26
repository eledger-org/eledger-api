#!/bin/bash

if [[ "$NODE_ENV" == "" ]]; then
  NODE_ENV=development
fi

NODE_ENV="$NODE_ENV" \
nodemon \
  $(find ./eledger-web/app -name "*html" -exec echo -ne " "-w {} \;) \
  $(find ./eledger-web/app -name "*ts" -exec echo -ne " "-w {} \;) \
  -w api \
  -w App.js \
  -w config \
  -w DbUpgrade.js \
  -w models \
  -w Mysqlc.js \
  -w package.json \
  -i api/swagger/swagger.json \
  -e js,ts,component.ts,html,css,json \
  -V \
  -x bin/fullstart.sh
