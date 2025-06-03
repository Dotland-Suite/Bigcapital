#!/bin/bash

FORKED_REPO="https://github.com/bigcapitalhq/bigcapital.git"
ORIGINAL_REPO="https://github.com/Dotland-Suite/Bigcapital.git"

git clone --bare $FORKED_REPO

cd bigcapital.git

git push --mirror $ORIGINAL_REPO