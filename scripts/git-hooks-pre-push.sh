#!/bin/bash
# JNX-OS Pre-Push Hook: BLOCK Push if Symlinks Detected

NEXTJS_DIR="/home/ubuntu/jnx-os/nextjs_space"
YARN_LOCK="$NEXTJS_DIR/yarn.lock"

# Check if yarn.lock is a symlink
if [ -L "$YARN_LOCK" ]; then
    echo "❌ ERROR: yarn.lock is still a symlink!"
    echo "❌ Push BLOCKED to prevent Vercel build failure"
    echo ""
    echo "Quick Fix:"
    echo "  cd /home/ubuntu/jnx-os/nextjs_space"
    echo "  rm yarn.lock && cp /opt/hostedapp/node/root/app/yarn.lock ."
    echo "  git add yarn.lock"
    echo "  git commit --amend --no-edit"
    echo "  git push origin main"
    echo ""
    exit 1  # Block the push
fi

echo "✅ yarn.lock is a real file"
echo "🚀 Push allowed"
exit 0
