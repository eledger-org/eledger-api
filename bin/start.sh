#!/bin/bash

dir=$(dirname $0)

mkdir -p static-stored-files/thumbnails

if $dir/rebuild_json.sh; then
  NODE_ENV=$NODE_ENV node App.js
fi

