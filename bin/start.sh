#!/bin/bash

dir=$(dirname $0)

if $dir/rebuild_json.sh; then
  NODE_ENV=$NODE_ENV node App.js
fi

