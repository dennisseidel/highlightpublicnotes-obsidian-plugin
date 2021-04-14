#!/bin/bash
npm run build
npx standard-version -v
version=$(cat manifest.json | jq -r ".version")
gh release create ${version} -F CHANGELOG.md manifest.json main.js styles.css
