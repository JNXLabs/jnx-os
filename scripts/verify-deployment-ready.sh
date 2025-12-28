#!/bin/bash
# JNX-OS Deployment Verification Script
# Run this before any deployment to check for common issues

set -e

echo "======================================"
echo "JNX-OS Deployment Verification"
echo "======================================"
echo ""

PROJECT_ROOT="/home/ubuntu/jnx-os"
NEXTJS_DIR="$PROJECT_ROOT/nextjs_space"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

echo "1. Checking for Symlinks..."
if [ -L "$NEXTJS_DIR/yarn.lock" ]; then
    echo -e "${RED}❌ FAIL: yarn.lock is a symlink${NC}"
    echo "   Run: cp -L $NEXTJS_DIR/yarn.lock $NEXTJS_DIR/yarn.lock.tmp && mv $NEXTJS_DIR/yarn.lock.tmp $NEXTJS_DIR/yarn.lock"
    ((ERRORS++))
else
    echo -e "${GREEN}✅ PASS: yarn.lock is a real file${NC}"
fi

if [ -L "$NEXTJS_DIR/node_modules" ]; then
    echo -e "${YELLOW}⚠️  WARNING: node_modules is a symlink (OK for local, ignored by Git)${NC}"
    ((WARNINGS++))
else
    echo -e "${GREEN}✅ PASS: node_modules is real or doesn't exist${NC}"
fi

echo ""
echo "2. Checking Environment Variables..."
if [ -f "$NEXTJS_DIR/.env" ]; then
    echo -e "${GREEN}✅ PASS: .env file exists${NC}"
    
    # Check for required vars
    REQUIRED_VARS=("NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY" "CLERK_SECRET_KEY" "NEXT_PUBLIC_SUPABASE_URL")
    for VAR in "${REQUIRED_VARS[@]}"; do
        if grep -q "$VAR=" "$NEXTJS_DIR/.env"; then
            echo -e "${GREEN}✅ $VAR is set${NC}"
        else
            echo -e "${RED}❌ $VAR is missing${NC}"
            ((ERRORS++))
        fi
    done
else
    echo -e "${RED}❌ FAIL: .env file not found${NC}"
    ((ERRORS++))
fi

echo ""
echo "3. Checking package.json..."
if [ -f "$NEXTJS_DIR/package.json" ]; then
    echo -e "${GREEN}✅ PASS: package.json exists${NC}"
    
    # Check Tailwind version
    TAILWIND_VERSION=$(grep -oP '"tailwindcss":\s*"\K[^"]+' "$NEXTJS_DIR/package.json" || echo "not found")
    if [[ "$TAILWIND_VERSION" == "3.3.3" ]]; then
        echo -e "${GREEN}✅ Tailwind CSS version: $TAILWIND_VERSION${NC}"
    else
        echo -e "${YELLOW}⚠️  WARNING: Tailwind CSS version: $TAILWIND_VERSION (expected 3.3.3)${NC}"
        ((WARNINGS++))
    fi
else
    echo -e "${RED}❌ FAIL: package.json not found${NC}"
    ((ERRORS++))
fi

echo ""
echo "4. Testing Local Build..."
cd "$NEXTJS_DIR"
if yarn build &> /dev/null; then
    echo -e "${GREEN}✅ PASS: Local build successful${NC}"
else
    echo -e "${RED}❌ FAIL: Local build failed${NC}"
    echo "   Run: cd $NEXTJS_DIR && yarn build"
    ((ERRORS++))
fi

echo ""
echo "======================================"
echo "Verification Summary"
echo "======================================"
echo -e "Errors:   ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ Deployment Ready!${NC}"
    echo "You can safely push to GitHub and deploy to Vercel."
    exit 0
else
    echo -e "${RED}❌ Deployment Not Ready!${NC}"
    echo "Fix the errors above before deploying."
    exit 1
fi
