#!/bin/bash

cd $HOME/public/wordpress/ConstructionGuide
npx http-server -o -c-1 &
npx webpack --watch
