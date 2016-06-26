#!/bin/bash

# If you want to provide your own remote, just pass it as an argument to publish_docs.  I'll assume the
# origin remote otherwise.  Or set an environment variable ELEDGER_API_REMOTE=...

if [[ "$1" == "" ]] && [[ "$ELEDGER_API_REMOTE" == "" ]]; then
  ELEDGER_API_REMOTE="$(git remote get-url origin)"
elif [[ "$ELEDGER_API_REMOTE" == "" ]]; then
  ELEDGER_API_REMOTE="$1"
fi

if [ ! -d "gen" ]; then
  echo "Generate docs first using:"                             1>&2
  echo "    ./bin/build_docs.sh"                                1>&2

  exit 1
fi

local_dir=$(pwd)
docs_dir=/tmp/$(basename $local_dir)

if [ ! -d ${docs_dir} ]; then
  git clone . ${docs_dir}

  pushd $docs_dir

  git remote set-url origin ${ELEDGER_API_REMOTE}

  if ! git checkout --orphan gh-pages; then
    git checkout gh-pages
  fi
else
  pushd $docs_dir

  git remote set-url origin ${ELEDGER_API_REMOTE}

  git pull

  git checkout gh-pages
fi

git rm -rf .

mv $local_dir/gen/* .

rmdir $local_dir/gen

git add .

git commit -m "gh-pages update ${RANDOM}.${RANDOM}"

git push

popd

