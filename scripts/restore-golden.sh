#!/usr/bin/env bash
set -e
git fetch --all --tags
TAG=$(git tag --list 'golden-*' | sort | tail -n1)
[ -n "$TAG" ] || { echo "No golden-* tag found"; exit 1; }
git reset --hard "$TAG"
echo "Restored to $TAG"
