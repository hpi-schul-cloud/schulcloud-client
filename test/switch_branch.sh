#! /bin/bash

cd $1
echo "switching branch..."
git checkout $2 > /dev/null 2>&1 || true
echo "(new) active branch:"
git branch | grep \* | cut -d ' ' -f2
cd ..
