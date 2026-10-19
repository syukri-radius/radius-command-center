#!/usr/bin/env bash
set -e

REPO_URL="https://github.com/syukri-radius/radius-command-center.git"
BRANCH="main"

echo "=== AetherOps Command Center: Git Push Helper ==="

if [ -n "$1" ]; then
  TOKEN="$1"
  AUTH_REPO_URL="https://${TOKEN}@github.com/syukri-radius/radius-command-center.git"
  echo "Pushing using provided access token..."
  git remote set-url origin "$AUTH_REPO_URL"
  git push -u origin "$BRANCH"
  git remote set-url origin "$REPO_URL" # reset to clean URL
  echo "Successfully pushed to ${REPO_URL} on branch ${BRANCH}!"
else
  echo "Usage: ./deploy_to_github.sh <YOUR_GITHUB_PERSONAL_ACCESS_TOKEN>"
  echo "Alternatively, run:"
  echo "  git push -u origin main"
fi
