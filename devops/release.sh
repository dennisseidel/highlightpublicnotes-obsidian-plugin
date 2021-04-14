#!/bin/bash
npm run build
version=$(cat manifest.json | jq -r ".version")
npx standard-version
gh release create ${version} -F manifest.json main.js styles.css