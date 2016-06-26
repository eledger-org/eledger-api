#!/bin/bash

dir=$(dirname $0)

if [[ "$NODE_ENV" == "" ]]; then
  NODE_ENV=development
fi

if $dir/rebuild_json.sh; then
  NODE_ENV=$NODE_ENV node app.js
fi
