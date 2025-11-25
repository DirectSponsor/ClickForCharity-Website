#!/bin/bash

# ClickForCharity Deployment Script
# Safe deployment with data separation and backup rotation

set -e  # Exit on any error

# Configuration
REMOTE_HOST="clickforcharity"
REMOTE_PATH="/var/www/clickforcharity.net/public_html"
LOCAL_PATH="$(pwd)"
BACKUP_DIR="$HOME/backups/clickforcharity-deploys"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

success() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] ✅ $1${NC}"
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] ⚠️  $1${NC}"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ❌ $1${NC}"
    exit 1
}

# Pre-deployment checks
pre_deploy_checks() {
    log "Running pre-deployment checks..."
    
    # Check if we're in the CFC directory
    if [[ ! -f "index.html" ]] || [[ ! -d "api" ]]; then
        error "Not in ClickForCharity directory. Missing index.html or api/"
    fi
    
    # Check server connectivity
    if ! ssh "$REMOTE_HOST" "echo 'Connection test'" >/dev/null 2>&1; then
        error "Cannot connect to $REMOTE_HOST"
    fi
    
    success "Pre-deployment checks passed"
}

# Create local backup
create_local_backup() {
    log "Creating local backup..."
    
    mkdir -p "$BACKUP_DIR"
    
    local timestamp=$(date +%Y%m%d-%H%M%S)
    local backup_file="$BACKUP_DIR/clickforcharity-local-$timestamp.tar.gz"
    
    tar -czf "$backup_file" \
        --exclude='.git' \
        --exclude='node_modules' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='deploy.sh' \
        -C "$(dirname "$LOCAL_PATH")" \
        "$(basename "$LOCAL_PATH")"
    
    success "Local backup created: $backup_file"
    
    # Keep 6 most recent
    cd "$BACKUP_DIR"
    ls -t clickforcharity-local-*.tar.gz | tail -n +7 | xargs -r rm -f
    cd "$LOCAL_PATH"
}

# Deploy files to remote server
deploy_files() {
    log "Deploying files to $REMOTE_HOST:$REMOTE_PATH..."
    
    rsync -avz --delete \
        --exclude='.git/' \
        --exclude='node_modules/' \
        --exclude='*.tmp' \
        --exclude='*.log' \
        --exclude='deploy.sh' \
        --exclude='.DS_Store' \
        --exclude='Thumbs.db' \
        --progress \
        "$LOCAL_PATH/" "$REMOTE_HOST:$REMOTE_PATH/"
    
    success "Files deployed successfully"
}

# Fix permissions on remote server
fix_permissions() {
    log "Fixing file permissions on remote server..."
    
    ssh "$REMOTE_HOST" "
        sudo chown -R www-data:www-data '$REMOTE_PATH'
        find '$REMOTE_PATH' -type d -exec chmod 755 {} \;
        find '$REMOTE_PATH' -type f -exec chmod 644 {} \;
        echo 'Permissions fixed'
    "
    
    success "Permissions updated"
}

# Main deployment process
main() {
    log "🚀 Starting ClickForCharity deployment..."
    echo "Local: $LOCAL_PATH"
    echo "Remote: $REMOTE_HOST:$REMOTE_PATH"
    echo ""
    
    # Ask for confirmation
    read -p "Continue with deployment? (y/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log "Deployment cancelled"
        exit 0
    fi
    
    pre_deploy_checks
    create_local_backup
    deploy_files
    fix_permissions
    
    success "🎉 Deployment completed successfully!"
    log "Site: https://clickforcharity.net/"
}

# Run main function
main "$@"
