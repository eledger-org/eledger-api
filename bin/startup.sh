#!/bin/bash

dir=$(dirname $0)

if $dir/rebuild_json.sh; then
  node app.js
fi
