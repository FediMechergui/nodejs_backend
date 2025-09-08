@echo off
REM THEA Backend Docker Management Script for Windows

setlocal enabledelayedexpansion

REM Colors (if supported)
set "GREEN=[92m"
set "YELLOW=[93m"
set "RED=[91m"
set "BLUE=[94m"
set "NC=[0m"

goto :main

:print_status
echo %BLUE%[INFO]%NC% %~1
goto :eof

:print_success
echo %GREEN%[SUCCESS]%NC% %~1
goto :eof

:print_warning
echo %YELLOW%[WARNING]%NC% %~1
goto :eof

:print_error
echo %RED%[ERROR]%NC% %~1
goto :eof

:show_help
echo THEA Backend Docker Management
echo.
echo Usage: %~nx0 [COMMAND]
echo.
echo Commands:
echo   start         Start all services
echo   stop          Stop all services
echo   restart       Restart all services
echo   build         Build the application image
echo   rebuild       Rebuild and start all services
echo   logs          Show logs for all services
echo   status        Show status of all services
echo   clean         Clean up containers and volumes
echo   shell         Access the application container shell
echo   db-migrate    Run database migrations
echo   db-seed       Seed the database
echo   test          Run tests in container
echo   help          Show this help message
goto :eof

:start_services
call :print_status "Starting THEA Backend services..."
docker compose up -d
if !errorlevel! equ 0 (
    call :print_success "Services started successfully!"
    call :show_status
) else (
    call :print_error "Failed to start services!"
    exit /b 1
)
goto :eof

:stop_services
call :print_status "Stopping THEA Backend services..."
docker compose down
if !errorlevel! equ 0 (
    call :print_success "Services stopped successfully!"
) else (
    call :print_error "Failed to stop services!"
    exit /b 1
)
goto :eof

:restart_services
call :print_status "Restarting THEA Backend services..."
docker compose restart
if !errorlevel! equ 0 (
    call :print_success "Services restarted successfully!"
) else (
    call :print_error "Failed to restart services!"
    exit /b 1
)
goto :eof

:build_image
call :print_status "Building THEA Backend application image..."
docker compose build --no-cache
if !errorlevel! equ 0 (
    call :print_success "Image built successfully!"
) else (
    call :print_error "Failed to build image!"
    exit /b 1
)
goto :eof

:rebuild_services
call :print_status "Rebuilding and starting THEA Backend services..."
docker compose down
docker compose build --no-cache
docker compose up -d
if !errorlevel! equ 0 (
    call :print_success "Services rebuilt and started successfully!"
    call :show_status
) else (
    call :print_error "Failed to rebuild services!"
    exit /b 1
)
goto :eof

:show_logs
if "%~2"=="" (
    docker compose logs -f
) else (
    docker compose logs -f %~2
)
goto :eof

:show_status
call :print_status "THEA Backend Services Status:"
docker compose ps
echo.
call :print_status "Resource Usage:"
docker stats --no-stream --format "table {{.Container}}\t{{.CPUPerc}}\t{{.MemUsage}}\t{{.NetIO}}"
goto :eof

:clean_up
call :print_warning "This will remove all containers and volumes. Are you sure? (y/N)"
set /p response="Enter choice: "
if /i "!response!"=="y" (
    call :print_status "Cleaning up containers and volumes..."
    docker compose down -v --remove-orphans
    docker system prune -f
    call :print_success "Cleanup completed!"
) else (
    call :print_status "Cleanup cancelled."
)
goto :eof

:access_shell
call :print_status "Accessing THEA Backend application shell..."
docker compose exec thea-backend /bin/sh
goto :eof

:run_migrations
call :print_status "Running database migrations..."
docker compose exec thea-backend npm run db:migrate
if !errorlevel! equ 0 (
    call :print_success "Migrations completed!"
) else (
    call :print_error "Migrations failed!"
    exit /b 1
)
goto :eof

:seed_database
call :print_status "Seeding database..."
docker compose exec thea-backend npm run db:seed
if !errorlevel! equ 0 (
    call :print_success "Database seeded!"
) else (
    call :print_error "Database seeding failed!"
    exit /b 1
)
goto :eof

:run_tests
call :print_status "Running tests in container..."
docker compose exec thea-backend npm test
goto :eof

:main
if "%~1"=="start" goto :start_services
if "%~1"=="stop" goto :stop_services
if "%~1"=="restart" goto :restart_services
if "%~1"=="build" goto :build_image
if "%~1"=="rebuild" goto :rebuild_services
if "%~1"=="logs" goto :show_logs
if "%~1"=="status" goto :show_status
if "%~1"=="clean" goto :clean_up
if "%~1"=="shell" goto :access_shell
if "%~1"=="db-migrate" goto :run_migrations
if "%~1"=="db-seed" goto :seed_database
if "%~1"=="test" goto :run_tests
if "%~1"=="help" goto :show_help
if "%~1"=="--help" goto :show_help
if "%~1"=="-h" goto :show_help
if "%~1"=="" goto :show_help

call :print_error "Unknown command: %~1"
echo.
call :show_help
exit /b 1
