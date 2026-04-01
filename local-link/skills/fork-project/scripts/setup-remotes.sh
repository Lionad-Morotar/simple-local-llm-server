#!/bin/bash
# Setup git remotes for a forked project
# Usage: setup-remotes.sh <new-repo-name> [upstream-url]

set -e

NEW_NAME="$1"
UPSTREAM_URL="${2:-}"

if [ -z "$NEW_NAME" ]; then
    echo "Usage: setup-remotes.sh <new-repo-name> [upstream-url]"
    exit 1
fi

# Get current origin URL before renaming
if git remote get-url origin >/dev/null 2>&1; then
    ORIGINAL_URL=$(git remote get-url origin)
    echo "Original origin: $ORIGINAL_URL"
else
    echo "ERROR: No origin remote found"
    exit 1
fi

# Use provided upstream or original origin as upstream
if [ -z "$UPSTREAM_URL" ]; then
    UPSTREAM_URL="$ORIGINAL_URL"
fi

# Rename origin to upstream
echo "Renaming origin to upstream..."
git remote rename origin upstream

# Add new origin
echo "Adding new origin: https://github.com/Lionad-Morotar/${NEW_NAME}.git"
git remote add origin "https://github.com/Lionad-Morotar/${NEW_NAME}.git"

# Verify
echo ""
echo "Remotes configured:"
git remote -v

echo ""
echo "Next steps:"
echo "1. Push to new origin: git push -u origin main"
echo "2. Update package.json with new repository URL"
echo "3. Update README.md with fork attribution"
