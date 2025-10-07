#!/bin/bash

# Deployment Status Checker
# Usage: ./scripts/check-deployment.sh

set -e

REPO="yanivmizrachiy/gcal_pwa_yaniv"
BRANCH="main"

echo "🔍 Checking Deployment Status for $REPO"
echo "========================================="
echo

# Check if gh CLI is installed
if ! command -v gh &> /dev/null; then
    echo "⚠️  GitHub CLI (gh) is not installed."
    echo "   Install from: https://cli.github.com/"
    echo
    echo "   Showing basic status only..."
    echo
fi

# Check progress.json
echo "📊 Deployment Progress:"
echo "-----------------------"
if command -v curl &> /dev/null; then
    PROGRESS_URL="https://raw.githubusercontent.com/$REPO/$BRANCH/progress.json"
    PROGRESS=$(curl -s "$PROGRESS_URL")
    
    if command -v jq &> /dev/null; then
        echo "$PROGRESS" | jq -r '
        "Current Step: \(.currentStep)",
        "Percent Complete: \(.percent)%",
        "Last Update: \(.lastUpdate)",
        "",
        "Steps:",
        "  • GAS Deploy: \(.steps.gas_deploy.status) (\(.steps.gas_deploy.percent)%)",
        "  • EXEC_URL Update: \(.steps.exec_url_update.status) (\(.steps.exec_url_update.percent)%)",
        "  • PWA Deploy: \(.steps.pwa_deploy.status) (\(.steps.pwa_deploy.percent)%)"
        '
    else
        echo "$PROGRESS"
        echo
        echo "💡 Install jq for prettier output: sudo apt-get install jq"
    fi
else
    echo "⚠️  curl is not installed. Cannot check progress.json"
fi

echo
echo "🚀 Recent Workflow Runs:"
echo "------------------------"
if command -v gh &> /dev/null; then
    gh run list --repo "$REPO" --workflow=gas-deploy.yml --limit 5 --json status,conclusion,startedAt,name,displayTitle | \
        jq -r '.[] | "[\(.status)] \(.displayTitle) - Started: \(.startedAt)"'
else
    echo "⚠️  Install GitHub CLI to see workflow runs"
    echo "   https://cli.github.com/"
fi

echo
echo "🌐 Health Checks:"
echo "-----------------"

# Check if pages site is up
PAGES_URL="https://${REPO%/*}.github.io/${REPO#*/}/"
if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$PAGES_URL")
    if [ "$HTTP_CODE" = "200" ]; then
        echo "✅ PWA Site: $PAGES_URL (HTTP $HTTP_CODE)"
    else
        echo "❌ PWA Site: $PAGES_URL (HTTP $HTTP_CODE)"
    fi
else
    echo "⚠️  curl is not installed. Cannot check PWA site"
fi

# Try to get EXEC_URL from progress.json
if command -v curl &> /dev/null && command -v jq &> /dev/null; then
    EXEC_URL=$(echo "$PROGRESS" | jq -r '.steps.gas_deploy.execUrl // empty')
    if [ -n "$EXEC_URL" ] && [ "$EXEC_URL" != "null" ]; then
        echo
        echo "🔗 GAS Backend:"
        echo "   URL: $EXEC_URL"
        
        # Try selftest
        if echo "$EXEC_URL" | grep -q '?'; then
            TEST_URL="${EXEC_URL}&mode=selftest"
        else
            TEST_URL="${EXEC_URL}?mode=selftest"
        fi
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$TEST_URL" 2>/dev/null || echo "000")
        if [ "$HTTP_CODE" = "200" ]; then
            echo "   Status: ✅ Healthy (HTTP $HTTP_CODE)"
        else
            echo "   Status: ❌ Unhealthy (HTTP $HTTP_CODE)"
        fi
    fi
fi

echo
echo "========================================="
echo "For more details, visit:"
echo "  https://github.com/$REPO/actions"
echo
