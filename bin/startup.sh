#!/bin/bash

dir=$(dirname $0)

if [[ "$NODE_ENV" == "" ]]; then
  NODE_ENV=development
fi

mkdir -p static-stored-files/thumbnails

if $dir/rebuild_json.sh; then
  NODE_ENV=$NODE_ENV node App.js
fi
