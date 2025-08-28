#!/usr/bin/env bash
set -e
TS=$(date +"%Y%m%d-%H%M%S")
git add -A
git commit -m "Golden working snapshot $TS" || true
git tag -f golden-$TS
git branch -f golden
git push -u origin main
git push origin --tags
git push -u origin golden
