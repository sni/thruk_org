#!/bin/bash

type optipng >/dev/null 2>&1 || { echo "optipng required!"; exit 1; }

CMD="optipng -o7"

if [ $# -gt 0 ]; then $CMD $*; exit; fi

for file in $(find src/ -type f -name \*.png); do
  echo $file;
  $CMD $file 2>&1 | grep '^Output file size'
done
