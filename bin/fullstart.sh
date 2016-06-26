#!/bin/bash

node_dir="node_modules/eledger-web/"

pushd $node_dir

tsc=FAIL

if npm run tsc; then
  tsc=PASS
fi

popd

if [[ "$tsc" != "PASS" ]]; then
  exit 1
fi

dir=$(dirname $0)

if $dir/rebuild_json.sh; then
  NODE_ENV=$NODE_ENV node App.js
fi
