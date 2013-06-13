#!/bin/sh
echo "Instrumenting library..."
rm -rf ../lib-cov
jscoverage ../lib ../lib-cov

echo "Backing up package.json..."
mv ../package.json support/

echo "Switching to coverage package.json..."
cp support/coverage-package.json ../package.json

echo "Checking coverage..."
mocha -R html-cov integration2/ > coverage.html

echo "Switching back to previous package.json"
mv support/package.json ..

echo "Open coverage.html"
