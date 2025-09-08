#!/bin/bash
# MySQL initialization script for THEA Backend

echo "🚀 Initializing THEA Database..."

# Create database if it doesn't exist
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS thea_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Create additional databases for different environments
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS thea_db_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "CREATE DATABASE IF NOT EXISTS thea_db_dev CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"

# Grant permissions
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON thea_db.* TO '$MYSQL_USER'@'%';"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON thea_db_test.* TO '$MYSQL_USER'@'%';"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "GRANT ALL PRIVILEGES ON thea_db_dev.* TO '$MYSQL_USER'@'%';"
mysql -u root -p"$MYSQL_ROOT_PASSWORD" -e "FLUSH PRIVILEGES;"

echo "✅ THEA Database initialization completed!"
