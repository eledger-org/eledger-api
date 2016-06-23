#!/bin/bash

# This is a cheesy helper script to simplify building the swagger file because swagger's node tool is
# not working correctly.

set -x

rm api/swagger/swagger.yaml

node_modules/swagger-cli/bin/swagger.js bundle api/swagger/index.json > api/swagger/swagger.yaml

