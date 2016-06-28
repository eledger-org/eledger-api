#!/bin/bash

./node_modules/mocha/bin/mocha test/index.js

# To prevent the possibility of sql injection when using squel, verify that the toString function // safe
# does not get called.  If you need a toString() call, use "" + x instead, or add // safe to the end of the
# line:
#
# @example
#   squel.select().field("COUNT(*)", "count").from("LedgerEntries").toString(); // safe

grepResult=$(grep -nrE "toString" . --exclude-dir=node_modules | grep -v "// safe")

if [[ "$grepResult" != "" ]]; then
  echo "Failing test because of a toString failure: $grepResult" # // safe

  exit 1
fi

