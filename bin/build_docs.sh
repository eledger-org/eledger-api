#!/bin/bash

devDependenciesPrint() {
  echo "Try installing dev depencencies." 1>&2
  echo "    npm install"                  1>&2
}

if [ -f "node_modules/.bin/jsdoc" ]; then
  cmd="node node_modules/.bin/jsdoc"
elif [ -f "$(which jsdoc)" ]; then
  cmd="jsdoc"
else
  devDependenciesPrint

  exit 1
fi

if [ ! -d "node_modules/ink-docstrap/template" ]; then
  devDependenciesPrint

  exit 1
fi

rm -rf gen
$cmd \
  -d gen \
  -c config/jsdoc.conf.json \
  -R README.md \
  -t ./node_modules/ink-docstrap/template \
  -r . \

