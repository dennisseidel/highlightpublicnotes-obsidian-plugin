#!/bin/bash
npm run build
version=$(cat manifest.json | jq -r ".version")
npx standard-version -v
gh release create ${version} -F CHANGELOG.md manifest.json main.js styles.css
