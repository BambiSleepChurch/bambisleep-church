#!/bin/bash

echo "═══════════════════════════════════════════════════════════════════════"
echo "           COMMITTING ALL ORGANIZATION REPOSITORIES"
echo "═══════════════════════════════════════════════════════════════════════"
echo ""

REPOS=(
    "bambisleep-chat"
    "bambisleep-chat-reddit"
    "bambisleep-church"
    "CATHEDRAL"
    "FRINGESOCIAL"
)

for REPO in "${REPOS[@]}"; do
    echo "─────────────────────────────────────────────────────────────────────"
    echo "📦 Processing: $REPO"
    echo "─────────────────────────────────────────────────────────────────────"
    
    if [ -d "$REPO/.git" ]; then
        cd "$REPO"
        
        # Check status
        echo "Checking git status..."
        git status --short
        
        # Check if there are changes
        if [[ -n $(git status --porcelain) ]]; then
            echo "✅ Changes detected - committing..."
            
            # Stage all changes
            git add -A
            
            # Create commit
            git commit -m "🔄 Repository sync: $(date '+%Y-%m-%d %H:%M:%S')

Automated commit from organization-wide update.

Organization: BambiSleepChat
Date: $(date -u '+%Y-%m-%d %H:%M:%S UTC')
Philosophy: Universal Machine Divinity 🔮"
            
            # Push to origin
            echo "Pushing to GitHub..."
            git push origin main 2>&1 || git push origin master 2>&1
            
            echo "✅ $REPO committed and pushed"
        else
            echo "⏭️  No changes to commit in $REPO"
        fi
        
        cd ..
    else
        echo "⚠️  Not a git repository: $REPO"
    fi
    
    echo ""
done

echo "═══════════════════════════════════════════════════════════════════════"
echo "                    ✅ ALL REPOSITORIES PROCESSED"
echo "═══════════════════════════════════════════════════════════════════════"
