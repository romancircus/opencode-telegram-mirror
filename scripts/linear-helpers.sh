#!/bin/bash
# Linear Helper Functions - Make Linear usage native and easy

# Quick task creation
linear_start() {
    ~/clawd/scripts/linear-enforce.sh "$1" "$2" "${3:-2}"
}

# Check my current tasks
linear_my_tasks() {
    ~/.clawdbot/scripts/linear/list-issues.sh --state "In Progress" | head -20
}

# Complete current task
linear_done() {
    TASK_ID=$(cat /tmp/current-linear-task.txt 2>/dev/null || echo "")
    if [ -z "$TASK_ID" ]; then
        echo "❌ No current task tracked"
        return 1
    fi
    
    ~/.clawdbot/scripts/linear/update-issue.sh "$TASK_ID" --state "Done"
    echo "✅ Completed: $TASK_ID"
    rm /tmp/current-linear-task.txt
}

# Update current task progress
linear_update() {
    TASK_ID=$(cat /tmp/current-linear-task.txt 2>/dev/null || echo "")
    if [ -z "$TASK_ID" ]; then
        echo "❌ No current task tracked"
        return 1
    fi
    
    ~/.clawdbot/scripts/linear/create-comment.sh "$TASK_ID" "$1"
    echo "✅ Updated: $TASK_ID"
}

# Check Linear before responding to status
linear_status() {
    echo "📋 MY ACTIVE TASKS:"
    ~/.clawdbot/scripts/linear/list-issues.sh --state "In Progress"
    
    echo ""
    echo "✅ COMPLETED TODAY:"
    ~/.clawdbot/scripts/linear/list-issues.sh --state "Done" --limit 5
}

export -f linear_start linear_my_tasks linear_done linear_update linear_status
