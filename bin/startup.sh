#!/bin/bash

dir=$(dirname $0)

if $dir/rebuild_yaml.sh; then
  node app.js
fi
