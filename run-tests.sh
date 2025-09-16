#!/bin/bash
# THEA Backend Test Runner
# Runs Jest tests with proper Docker environment setup

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
DOCKER_COMPOSE_TEST="$PROJECT_ROOT/docker-compose.test.yml"
ENV_TEST="$PROJECT_ROOT/.env.test"

print_header() {
    echo -e "${BLUE}================================================${NC}"
    echo -e "${BLUE}  THEA Backend - Jest Test Runner${NC}"
    echo -e "${BLUE}================================================${NC}"
    echo ""
}

check_dependencies() {
    echo -e "${YELLOW}Checking dependencies...${NC}"

    # Check if Docker is running
    if ! docker info > /dev/null 2>&1; then
        echo -e "${RED}❌ Docker is not running. Please start Docker first.${NC}"
        exit 1
    fi

    # Check if docker-compose is available
    if ! command -v docker-compose > /dev/null 2>&1; then
        echo -e "${RED}❌ docker-compose is not installed.${NC}"
        exit 1
    fi

    # Check if test environment file exists
    if [ ! -f "$ENV_TEST" ]; then
        echo -e "${RED}❌ Test environment file not found: $ENV_TEST${NC}"
        exit 1
    fi

    echo -e "${GREEN}✅ Dependencies check passed${NC}"
}

start_test_services() {
    echo -e "${YELLOW}Starting test services...${NC}"

    # Start test services
    docker-compose -f "$DOCKER_COMPOSE_TEST" up -d mysql-test redis-test minio-test rabbitmq-test

    # Wait for services to be ready
    echo -e "${YELLOW}Waiting for services to be healthy...${NC}"

    # Wait for MySQL
    echo "Waiting for MySQL..."
    for i in {1..30}; do
        if docker-compose -f "$DOCKER_COMPOSE_TEST" exec -T mysql-test mysqladmin ping -h localhost --silent; then
            echo -e "${GREEN}✅ MySQL is ready${NC}"
            break
        fi
        sleep 2
    done

    # Wait for Redis
    echo "Waiting for Redis..."
    for i in {1..15}; do
        if docker-compose -f "$DOCKER_COMPOSE_TEST" exec -T redis-test redis-cli ping | grep -q PONG; then
            echo -e "${GREEN}✅ Redis is ready${NC}"
            break
        fi
        sleep 1
    done

    echo -e "${GREEN}✅ All test services are ready${NC}"
}

run_tests() {
    local test_type=$1
    local extra_args=$2

    echo -e "${YELLOW}Running Jest tests ($test_type)...${NC}"

    # Set test environment
    export NODE_ENV=test
    export DOTENV_CONFIG_PATH="$ENV_TEST"

    case $test_type in
        "unit")
            npm run test:unit $extra_args
            ;;
        "integration")
            npm run test:integration $extra_args
            ;;
        "coverage")
            npm run test:coverage $extra_args
            ;;
        "watch")
            npm run test:watch $extra_args
            ;;
        "ci")
            npm run test:ci $extra_args
            ;;
        *)
            npm test $extra_args
            ;;
    esac
}

stop_test_services() {
    echo -e "${YELLOW}Stopping test services...${NC}"
    docker-compose -f "$DOCKER_COMPOSE_TEST" down -v
    echo -e "${GREEN}✅ Test services stopped${NC}"
}

cleanup() {
    echo -e "${YELLOW}Cleaning up...${NC}"
    # Stop services if script is interrupted
    if [ -f "$DOCKER_COMPOSE_TEST" ]; then
        docker-compose -f "$DOCKER_COMPOSE_TEST" down -v 2>/dev/null || true
    fi
}

show_usage() {
    echo "Usage: $0 [COMMAND] [OPTIONS]"
    echo ""
    echo "Commands:"
    echo "  all              Run all tests with coverage (default)"
    echo "  unit             Run unit tests only"
    echo "  integration      Run integration tests only"
    echo "  coverage         Run tests with coverage report"
    echo "  watch            Run tests in watch mode"
    echo "  ci               Run tests for CI/CD pipeline"
    echo "  services         Start test services only"
    echo "  stop             Stop test services"
    echo "  clean            Clean up test environment"
    echo ""
    echo "Options:"
    echo "  --no-services    Don't start/stop Docker services"
    echo "  --verbose        Verbose output"
    echo ""
    echo "Examples:"
    echo "  $0 all                    # Run all tests with services"
    echo "  $0 coverage               # Run with coverage report"
    echo "  $0 unit --no-services     # Run unit tests without Docker"
    echo "  $0 watch                  # Run in watch mode"
    echo "  $0 services               # Start services only"
    echo "  $0 stop                   # Stop services"
}

# Main script logic
main() {
    print_header

    local command=${1:-all}
    local no_services=false
    local verbose=false

    # Parse arguments
    shift
    while [[ $# -gt 0 ]]; do
        case $1 in
            --no-services)
                no_services=true
                shift
                ;;
            --verbose)
                verbose=true
                shift
                ;;
            *)
                echo -e "${RED}Unknown option: $1${NC}"
                show_usage
                exit 1
                ;;
        esac
    done

    case $command in
        all|unit|integration|coverage|watch|ci)
            if [ "$no_services" = false ]; then
                check_dependencies
                start_test_services
                trap cleanup EXIT
            fi

            run_tests "$command"

            if [ "$no_services" = false ]; then
                stop_test_services
            fi
            ;;

        services)
            check_dependencies
            start_test_services
            echo -e "${GREEN}Test services are running. Press Ctrl+C to stop.${NC}"
            trap stop_test_services EXIT
            wait
            ;;

        stop)
            stop_test_services
            ;;

        clean)
            cleanup
            echo -e "${GREEN}✅ Cleanup completed${NC}"
            ;;

        *)
            echo -e "${RED}Unknown command: $command${NC}"
            show_usage
            exit 1
            ;;
    esac
}

# Run main function
main "$@"