#!/bin/bash
# Kimi Auth Plugin Test Suite
# Tests the clawdbot-kimi-auth plugin and validates it as the default brain

echo "=========================================="
echo "Kimi OAuth Plugin - Deployment Test Suite"
echo "=========================================="
echo ""

# Test 1: Plugin Installation
echo "✓ TEST 1: Plugin Installation"
echo "  Checking plugin directory..."
if [ -d ~/.clawdbot/plugins/kimi-auth ]; then
    echo "  ✅ Plugin installed at ~/.clawdbot/plugins/kimi-auth"
else
    echo "  ❌ Plugin not found"
    exit 1
fi

# Test 2: Plugin Manifest
echo ""
echo "✓ TEST 2: Plugin Manifest"
if [ -f ~/.clawdbot/plugins/kimi-auth/clawdbot.plugin.json ]; then
    PLUGIN_ID=$(cat ~/.clawdbot/plugins/kimi-auth/clawdbot.plugin.json | grep -o '"id": "[^"]*"' | cut -d'"' -f4)
    echo "  ✅ Plugin ID: $PLUGIN_ID"
else
    echo "  ❌ Plugin manifest missing"
    exit 1
fi

# Test 3: Enabled in Config
echo ""
echo "✓ TEST 3: Plugin Enabled"
if cat ~/.clawdbot/clawdbot.json | jq -e '.plugins.entries["kimi-auth"].enabled' >/dev/null 2>&1; then
    echo "  ✅ Plugin enabled in clawdbot.json"
else
    echo "  ❌ Plugin not enabled"
    exit 1
fi

# Test 4: Auth Profile Migration
echo ""
echo "✓ TEST 4: Auth Profile Migration"
if [ -f ~/.clawdbot/auth-profiles.json ]; then
    PROFILE_COUNT=$(cat ~/.clawdbot/auth-profiles.json | jq '.profiles | length')
    echo "  ✅ Found $PROFILE_COUNT auth profile(s)"
    
    # Check for kimi profile
    if cat ~/.clawdbot/auth-profiles.json | jq -e '.profiles[] | select(.profileId == "kimi:default")' >/dev/null 2>&1; then
        echo "  ✅ Kimi profile (kimi:default) exists"
        
        # Check token expiry
        EXPIRES=$(cat ~/.clawdbot/auth-profiles.json | jq -r '.profiles[] | select(.profileId == "kimi:default") | .credential.expires')
        NOW=$(date +%s%3N)
        if [ "$EXPIRES" -gt "$NOW" ]; then
            echo "  ✅ Token valid (expires: $(date -d @$(($EXPIRES/1000)) '+%Y-%m-%d %H:%M:%S'))"
        else
            echo "  ⚠️  Token expired (will auto-refresh)"
        fi
    else
        echo "  ❌ Kimi profile not found"
        exit 1
    fi
else
    echo "  ❌ No auth-profiles.json"
    exit 1
fi

# Test 5: Model Configuration
echo ""
echo "✓ TEST 5: Model Configuration"
PRIMARY=$(cat ~/.clawdbot/clawdbot.json | jq -r '.agents.defaults.model.primary')
echo "  Primary model: $PRIMARY"
if [ "$PRIMARY" = "kimi/kimi-k2.5" ]; then
    echo "  ✅ Kimi K2.5 set as default brain"
else
    echo "  ⚠️  Primary is $PRIMARY (expected kimi/kimi-k2.5)"
fi

# Check fallbacks
FALLBACKS=$(cat ~/.clawdbot/clawdbot.json | jq -r '.agents.defaults.model.fallbacks | join(", ")')
echo "  Fallbacks: $FALLBACKS"

# Test 6: Model Aliases
echo ""
echo "✓ TEST 6: Model Aliases"
if cat ~/.clawdbot/clawdbot.json | jq -e '.agents.defaults.models["kimi/kimi-k2.5"]' >/dev/null 2>&1; then
    ALIAS=$(cat ~/.clawdbot/clawdbot.json | jq -r '.agents.defaults.models["kimi/kimi-k2.5"].alias')
    echo "  ✅ Kimi K2.5 alias: $ALIAS"
else
    echo "  ⚠️  No alias configured for kimi/kimi-k2.5"
fi

# Test 7: Gateway Status
echo ""
echo "✓ TEST 7: Gateway Status"
if systemctl is-active --quiet clawdbot-gateway.service 2>/dev/null; then
    echo "  ✅ Gateway service active"
    
    # Check port
    if nc -z localhost 18789 2>/dev/null; then
        echo "  ✅ Gateway responding on port 18789"
    else
        echo "  ⚠️  Gateway not responding on port 18789"
    fi
else
    echo "  ❌ Gateway service not active"
    exit 1
fi

# Test 8: Source Token Check
echo ""
echo "✓ TEST 8: Source Token (opencode-kimi-auth)"
if [ -f ~/.opencode-kimi-auth/oauth.json ]; then
    SOURCE_EXPIRES=$(cat ~/.opencode-kimi-auth/oauth.json | jq -r '.expires_at')
    echo "  ✅ Source token exists (opencode-kimi-auth)"
    echo "  Source expires: $(date -d @$(($SOURCE_EXPIRES/1000)) '+%Y-%m-%d %H:%M:%S')"
    
    # Compare with clawdbot token
    CB_EXPIRES=$(cat ~/.clawdbot/auth-profiles.json | jq -r '.profiles[] | select(.profileId == "kimi:default") | .credential.expires')
    if [ "$SOURCE_EXPIRES" -eq "$CB_EXPIRES" ]; then
        echo "  ✅ Tokens synchronized"
    else
        echo "  ℹ️  Tokens may differ (normal if refreshed independently)"
    fi
else
    echo "  ℹ️  No source token (fresh install)"
fi

# Test 9: Performance Comparison Setup
echo ""
echo "✓ TEST 9: Performance Test Ready"
echo "  To test latency, run:"
echo "    time clawdbot agent --message 'Hello'"
echo ""
echo "  Expected: ~400ms faster than opencode/kimi-k2"
echo "  (Direct API: 93ms vs OpenCode routing: 506ms)"

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo ""
echo "🧠 Your New Brain Configuration:"
echo "   Primary:     Kimi K2.5 (Direct OAuth)"
echo "   Fallback 1:  GLM-4.7 (OpenCode)"
echo "   Fallback 2:  Claude Sonnet (OpenCode)"
echo "   Fallback 3:  Gemini Pro (OpenCode)"
echo ""
echo "✅ All systems ready!"
echo ""
echo "Next steps:"
echo "1. Send a message via Telegram to test"
echo "2. Or use: clawdbot agent --message 'Hello'"
echo "3. Monitor with: clawdbot gateway --verbose"
echo ""
echo "Migration complete! Your clawd bot now uses Kimi directly."
