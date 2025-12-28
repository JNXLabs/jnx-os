#!/bin/bash
# JNX-OS Pre-Commit Hook: Convert Symlinks to Real Files BEFORE Commit

NEXTJS_DIR="/home/ubuntu/jnx-os/nextjs_space"
YARN_LOCK="$NEXTJS_DIR/yarn.lock"

# Check if yarn.lock is a symlink
if [ -L "$YARN_LOCK" ]; then
    echo "🔍 Detected yarn.lock symlink"
    echo "🔧 Converting to real file before commit..."
    
    # Get the target of the symlink
    TARGET=$(readlink -f "$YARN_LOCK")
    
    # Remove symlink and copy real file
    rm "$YARN_LOCK"
    cp "$TARGET" "$YARN_LOCK"
    
    # Stage the change for THIS commit
    git add "$NEXTJS_DIR/yarn.lock"
    
    echo "✅ yarn.lock converted and staged for commit"
fi

exit 0
