#!/bin/bash
# THEA Backend Docker Management Script

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Functions
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Help function
show_help() {
    echo "THEA Backend Docker Management"
    echo ""
    echo "Usage: $0 [COMMAND]"
    echo ""
    echo "Commands:"
    echo "  start         Start all services"
    echo "  stop          Stop all services"
    echo "  restart       Restart all services"
    echo "  build         Build the application image"
    echo "  rebuild       Rebuild and start all services"
    echo "  logs          Show logs for all services"
    echo "  status        Show status of all services"
    echo "  clean         Clean up containers and volumes"
    echo "  shell         Access the application container shell"
    echo "  db-migrate    Run database migrations"
    echo "  db-seed       Seed the database"
    echo "  test          Run tests in container"
    echo "  help          Show this help message"
}

# Start services
start_services() {
    print_status "Starting THEA Backend services..."
    docker compose up -d
    print_success "Services started successfully!"
    show_status
}

# Stop services
stop_services() {
    print_status "Stopping THEA Backend services..."
    docker compose down
    print_success "Services stopped successfully!"
}

# Restart services
restart_services() {
    print_status "Restarting THEA Backend services..."
    docker compose restart
    print_success "Services restarted successfully!"
}

# Build image
build_image() {
    print_status "Building THEA Backend application image..."
    docker compose build --no-cache
    print_success "Image built successfully!"
}

# Rebuild and start
rebuild_services() {
    print_status "Rebuilding and starting THEA Backend services..."
    docker compose down
    docker compose build --no-cache
    docker compose up -d
    print_success "Services rebuilt and started successfully!"
    show_status
}

# Show logs
show_logs() {
    if [ -n "$2" ]; then
        docker compose logs -f "$2"
    else
        docker compose logs -f
    fi
}

# Show status
show_status() {
    print_status "THEA Backend Services Status:"
    docker compose ps
    echo ""
    print_status "Resource Usage:"
    docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
}

# Clean up
clean_up() {
    print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
    read -r response
    if [[ "$response" =~ ^([yY][eE][sS]|[yY])+$ ]]; then
        print_status "Cleaning up containers and volumes..."
        docker compose down -v --remove-orphans
        docker system prune -f
        print_success "Cleanup completed!"
    else
        print_status "Cleanup cancelled."
    fi
}

# Access shell
access_shell() {
    print_status "Accessing THEA Backend application shell..."
    docker compose exec thea-backend /bin/sh
}

# Database migrations
run_migrations() {
    print_status "Running database migrations..."
    docker compose exec thea-backend npm run db:migrate
    print_success "Migrations completed!"
}

# Database seeding
seed_database() {
    print_status "Seeding database..."
    docker compose exec thea-backend npm run db:seed
    print_success "Database seeded!"
}

# Run tests
run_tests() {
    print_status "Running tests in container..."
    docker compose exec thea-backend npm test
}

# Main script logic
case "$1" in
    start)
        start_services
        ;;
    stop)
        stop_services
        ;;
    restart)
        restart_services
        ;;
    build)
        build_image
        ;;
    rebuild)
        rebuild_services
        ;;
    logs)
        show_logs "$@"
        ;;
    status)
        show_status
        ;;
    clean)
        clean_up
        ;;
    shell)
        access_shell
        ;;
    db-migrate)
        run_migrations
        ;;
    db-seed)
        seed_database
        ;;
    test)
        run_tests
        ;;
    help|--help|-h)
        show_help
        ;;
    *)
        print_error "Unknown command: $1"
        echo ""
        show_help
        exit 1
        ;;
esac
