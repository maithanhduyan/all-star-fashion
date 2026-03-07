#!/bin/bash
# ============================================
# All Star Fashion — VPS Deployment Script
# ============================================
# Usage: bash deploy.sh [first-run|update|rollback]
#
# Prerequisites:
#   - Ubuntu 22.04+ / Debian 12+
#   - Docker & Docker Compose installed
#   - Domain allstarfashion.vn pointing to VPS IP
#   - .env file configured with production values
# ============================================

set -euo pipefail

APP_DIR="/opt/allstar-fashion"
BACKUP_DIR="/opt/allstar-backups"
COMPOSE="docker compose"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[DEPLOY]${NC} $*"; }
warn() { echo -e "${YELLOW}[WARN]${NC} $*"; }
err()  { echo -e "${RED}[ERROR]${NC} $*" >&2; }

# ---------- First-time VPS setup ----------
setup_vps() {
    log "=== First-time VPS Setup ==="

    # Install Docker if not present
    if ! command -v docker &>/dev/null; then
        log "Installing Docker..."
        curl -fsSL https://get.docker.com | sh
        sudo usermod -aG docker "$USER"
        log "Docker installed. You may need to re-login for group changes."
    fi

    # Install Nginx
    if ! command -v nginx &>/dev/null; then
        log "Installing Nginx..."
        sudo apt update && sudo apt install -y nginx
    fi

    # Install Certbot
    if ! command -v certbot &>/dev/null; then
        log "Installing Certbot..."
        sudo apt install -y certbot python3-certbot-nginx
    fi

    # Create app directory
    sudo mkdir -p "$APP_DIR" "$BACKUP_DIR"
    sudo chown "$USER:$USER" "$APP_DIR" "$BACKUP_DIR"

    log "VPS setup complete."
    log ""
    log "Next steps:"
    log "  1. Copy project files to $APP_DIR"
    log "  2. Create .env from .env.example (change ALL passwords!)"
    log "  3. Run: bash deploy.sh first-run"
}

# ---------- First deployment ----------
first_run() {
    log "=== First Deployment ==="

    cd "$APP_DIR"

    # Check .env exists
    if [ ! -f .env ]; then
        err ".env file not found in $APP_DIR"
        err "Copy .env.example to .env and configure production values."
        exit 1
    fi

    # Build and start containers
    log "Building and starting containers..."
    $COMPOSE up -d --build

    # Wait for DB to be healthy
    log "Waiting for database..."
    sleep 10

    # Run migrations
    log "Running database migrations..."
    $COMPOSE exec -T app deno run -A db/migrate.ts

    # Run seed (initial data)
    log "Seeding initial data..."
    $COMPOSE exec -T app deno run -A db/seed.ts

    # Setup Nginx
    log "Configuring Nginx..."
    sudo cp nginx/allstarfashion.conf /etc/nginx/sites-available/allstarfashion.vn
    sudo ln -sf /etc/nginx/sites-available/allstarfashion.vn /etc/nginx/sites-enabled/
    sudo rm -f /etc/nginx/sites-enabled/default
    sudo nginx -t && sudo systemctl reload nginx

    log ""
    log "=== First deployment complete! ==="
    log ""
    log "SSL setup (run manually):"
    log "  sudo certbot --nginx -d allstarfashion.vn -d www.allstarfashion.vn"
    log ""
    log "Verify:"
    log "  curl -s -o /dev/null -w '%{http_code}' http://localhost:8000"
}

# ---------- Update deployment ----------
update() {
    log "=== Updating Application ==="

    cd "$APP_DIR"

    # Backup database before update
    backup_db

    # Pull latest code (assumes git)
    if [ -d .git ]; then
        log "Pulling latest code..."
        git pull origin main
    else
        warn "Not a git repo — skipping git pull. Copy files manually."
    fi

    # Rebuild and restart app (zero-downtime with --no-deps)
    log "Rebuilding app container..."
    $COMPOSE build app
    $COMPOSE up -d --no-deps app

    # Run migrations (if any new)
    log "Running migrations..."
    $COMPOSE exec -T app deno run -A db/migrate.ts

    log "=== Update complete! ==="
}

# ---------- Database backup ----------
backup_db() {
    local timestamp
    timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_file="$BACKUP_DIR/allstar_${timestamp}.sql.gz"

    log "Backing up database to $backup_file ..."
    $COMPOSE exec -T db pg_dump -U allstar allstar_fashion | gzip > "$backup_file"

    # Keep only last 10 backups
    ls -t "$BACKUP_DIR"/allstar_*.sql.gz | tail -n +11 | xargs -r rm

    log "Backup saved: $backup_file"
}

# ---------- Rollback ----------
rollback() {
    log "=== Rollback ==="

    cd "$APP_DIR"

    local latest_backup
    latest_backup=$(ls -t "$BACKUP_DIR"/allstar_*.sql.gz 2>/dev/null | head -1)

    if [ -z "$latest_backup" ]; then
        err "No backup found in $BACKUP_DIR"
        exit 1
    fi

    warn "This will REPLACE the current database with: $latest_backup"
    read -rp "Are you sure? (yes/no): " confirm
    if [ "$confirm" != "yes" ]; then
        log "Rollback cancelled."
        exit 0
    fi

    log "Restoring database from $latest_backup ..."
    gunzip -c "$latest_backup" | $COMPOSE exec -T db psql -U allstar allstar_fashion

    log "=== Rollback complete ==="
}

# ---------- Status ----------
status() {
    cd "$APP_DIR"
    log "=== Container Status ==="
    $COMPOSE ps
    echo ""
    log "=== App Health ==="
    curl -s -o /dev/null -w "HTTP %{http_code}\n" http://localhost:8000 || err "App unreachable"
    echo ""
    log "=== Recent App Logs ==="
    $COMPOSE logs --tail=20 app
}

# ---------- Main ----------
case "${1:-help}" in
    setup-vps)  setup_vps ;;
    first-run)  first_run ;;
    update)     update ;;
    backup)     backup_db ;;
    rollback)   rollback ;;
    status)     status ;;
    *)
        echo "Usage: bash deploy.sh <command>"
        echo ""
        echo "Commands:"
        echo "  setup-vps   Install Docker, Nginx, Certbot on fresh VPS"
        echo "  first-run   First deployment (build, start, migrate, seed, nginx)"
        echo "  update      Pull code, rebuild app, run migrations"
        echo "  backup      Backup PostgreSQL database"
        echo "  rollback    Restore database from latest backup"
        echo "  status      Show container status and health"
        ;;
esac
