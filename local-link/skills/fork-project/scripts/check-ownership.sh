#!/bin/bash
# Check if current git repository belongs to Lionad

set -e

origin_url=$(git remote get-url origin 2>/dev/null || echo "")

if [ -z "$origin_url" ]; then
    echo "ERROR: No git remote origin found"
    exit 1
fi

# Check if it's a Lionad repository
if echo "$origin_url" | grep -qiE "github\.com/(Lionad-Morotar|lionad)/"; then
    echo "OWNED: This repository belongs to Lionad"
    echo "URL: $origin_url"
    exit 0
else
    echo "NOT_OWNED: This repository does not belong to Lionad"
    echo "URL: $origin_url"
    exit 1
fi
