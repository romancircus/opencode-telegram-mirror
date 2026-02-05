#!/bin/bash
# Linear Enforcement Script
# MANDATORY: Run before starting ANY deliverable work
# This ensures I create Linear tasks BEFORE execution

set -e

TASK_TITLE="$1"
TASK_DESCRIPTION="$2"
PRIORITY="${3:-2}"

if [ -z "$TASK_TITLE" ]; then
    echo "❌ ERROR: Linear task required before starting work"
    echo "Usage: linear-enforce.sh \"Task Title\" \"Description\" [priority]"
    exit 1
fi

echo "📋 Creating Linear task: $TASK_TITLE"

# Create the task
RESULT=$(~/.clawdbot/scripts/linear/create-issue.sh \
    --title "$TASK_TITLE" \
    --team "Romancircus" \
    --description "$TASK_DESCRIPTION" \
    --priority "$PRIORITY" 2>&1)

if [[ "$RESULT" =~ Created\ \[ROM-([0-9]+)\] ]]; then
    TASK_ID="ROM-${BASH_REMATCH[1]}"
    echo "✅ Linear task created: $TASK_ID"
    echo "$TASK_ID" > /tmp/current-linear-task.txt
    
    # Auto-update to In Progress
    ~/.clawdbot/scripts/linear/update-issue.sh "$TASK_ID" --state "In Progress" >/dev/null 2>&1
    
    echo "🏭 Task tracked in Linear. Proceed with work."
    echo "$TASK_ID"
else
    echo "❌ Failed to create Linear task"
    echo "$RESULT"
    exit 1
fi
