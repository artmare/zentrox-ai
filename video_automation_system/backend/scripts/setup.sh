#!/bin/bash

# =============================================================================
# AI Content Generator - Automatic Setup Script
# =============================================================================

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
log_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# Header
echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║            AI CONTENT GENERATOR - AUTOMATIC SETUP                ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

# =============================================================================
# Step 1: Check Python version
# =============================================================================

log_info "Проверка версии Python..."

PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
REQUIRED_VERSION="3.8"

if [ "$(printf '%s\n' "$REQUIRED_VERSION" "$PYTHON_VERSION" | sort -V | head -n1)" = "$REQUIRED_VERSION" ]; then
    log_success "Python $PYTHON_VERSION найден"
else
    log_error "Требуется Python $REQUIRED_VERSION или выше. Установлено: $PYTHON_VERSION"
    exit 1
fi

# =============================================================================
# Step 2: Install Python dependencies
# =============================================================================

log_info "Установка Python зависимостей..."

if pip3 install -r requirements.txt --quiet; then
    log_success "Python зависимости установлены"
else
    log_error "Ошибка установки зависимостей"
    exit 1
fi

# =============================================================================
# Step 3: Check PostgreSQL
# =============================================================================

log_info "Проверка PostgreSQL..."

if command -v psql &> /dev/null; then
    PSQL_VERSION=$(psql --version | awk '{print $3}')
    log_success "PostgreSQL $PSQL_VERSION найден"
    
    # Check if PostgreSQL is running
    if systemctl is-active --quiet postgresql; then
        log_success "PostgreSQL запущен"
    else
        log_warning "PostgreSQL не запущен. Попытка запуска..."
        sudo systemctl start postgresql
        if systemctl is-active --quiet postgresql; then
            log_success "PostgreSQL успешно запущен"
        else
            log_error "Не удалось запустить PostgreSQL"
            exit 1
        fi
    fi
else
    log_error "PostgreSQL не установлен"
    log_info "Установите PostgreSQL: sudo apt-get install postgresql postgresql-contrib"
    exit 1
fi

# =============================================================================
# Step 4: Setup environment variables
# =============================================================================

log_info "Настройка переменных окружения..."

if [ ! -f .env ]; then
    if [ -f .env.example ]; then
        cp .env.example .env
        log_success "Файл .env создан из .env.example"
        log_warning "ВАЖНО: Отредактируйте .env и добавьте ваши API ключи!"
        log_warning "nano .env"
    else
        log_error ".env.example не найден"
        exit 1
    fi
else
    log_success "Файл .env уже существует"
fi

# =============================================================================
# Step 5: Create directories
# =============================================================================

log_info "Создание необходимых директорий..."

mkdir -p /home/ubuntu/video_automation_system/logs
mkdir -p /home/ubuntu/video_automation_system/exports
mkdir -p /home/ubuntu/video_automation_system/backups

log_success "Директории созданы"

# =============================================================================
# Step 6: Database setup
# =============================================================================

log_info "Настройка базы данных..."

# Ask for database credentials
read -p "Имя пользователя PostgreSQL (по умолчанию: postgres): " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "Пароль PostgreSQL: " DB_PASSWORD
echo ""

read -p "Имя базы данных (по умолчанию: video_automation): " DB_NAME
DB_NAME=${DB_NAME:-video_automation}

# Create database if not exists
log_info "Создание базы данных..."

PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -c "CREATE DATABASE $DB_NAME"

if [ $? -eq 0 ]; then
    log_success "База данных '$DB_NAME' готова"
else
    log_error "Ошибка создания базы данных"
    exit 1
fi

# Run database setup script
log_info "Инициализация таблиц и структуры..."

if PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -f database_setup.sql > /dev/null 2>&1; then
    log_success "База данных инициализирована"
else
    log_error "Ошибка инициализации базы данных"
    exit 1
fi

# Update .env with database credentials
log_info "Обновление .env с параметрами БД..."

sed -i "s/DB_USER=.*/DB_USER=$DB_USER/" .env
sed -i "s/DB_PASSWORD=.*/DB_PASSWORD=$DB_PASSWORD/" .env
sed -i "s/DB_NAME=.*/DB_NAME=$DB_NAME/" .env

log_success ".env обновлён"

# =============================================================================
# Step 7: Configuration validation
# =============================================================================

log_info "Проверка конфигурации..."

if python3 config.py > /dev/null 2>&1; then
    log_success "Конфигурация валидна"
else
    log_warning "Конфигурация не полностью настроена"
    log_warning "Убедитесь, что вы добавили YouTube API и Abacus AI ключи в .env"
fi

# =============================================================================
# Step 8: Create test user
# =============================================================================

log_info "Создание тестового пользователя..."

read -p "Создать тестового пользователя? (y/n): " CREATE_USER

if [ "$CREATE_USER" = "y" ] || [ "$CREATE_USER" = "Y" ]; then
    read -p "Username (по умолчанию: test_user): " USERNAME
    USERNAME=${USERNAME:-test_user}
    
    read -p "Email (по умолчанию: test@example.com): " EMAIL
    EMAIL=${EMAIL:-test@example.com}
    
    read -p "Ниша (по умолчанию: мотивация): " NICHE
    NICHE=${NICHE:-мотивация}
    
    PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -c \
    "INSERT INTO users (username, email, niche, language, platform, scripts_per_day) 
     VALUES ('$USERNAME', '$EMAIL', '$NICHE', 'ru', 'TikTok', 3)
     ON CONFLICT (username) DO NOTHING;"
    
    # Get user ID
    USER_ID=$(PGPASSWORD=$DB_PASSWORD psql -U $DB_USER -d $DB_NAME -t -c \
    "SELECT id FROM users WHERE username = '$USERNAME';")
    
    log_success "Пользователь '$USERNAME' создан (ID: $USER_ID)"
fi

# =============================================================================
# Step 9: File permissions
# =============================================================================

log_info "Настройка прав доступа..."

chmod +x content_engine.py
chmod +x example_usage.py
chmod 600 .env  # Only owner can read/write

log_success "Права доступа настроены"

# =============================================================================
# Completion
# =============================================================================

echo ""
echo "╔══════════════════════════════════════════════════════════════════╗"
echo "║                                                                  ║"
echo "║                    ✓ УСТАНОВКА ЗАВЕРШЕНА!                       ║"
echo "║                                                                  ║"
echo "╚══════════════════════════════════════════════════════════════════╝"
echo ""

log_success "Система готова к использованию!"

echo ""
echo "Следующие шаги:"
echo "1. Отредактируйте .env и добавьте API ключи:"
echo "   ${YELLOW}nano .env${NC}"
echo ""
echo "2. Проверьте конфигурацию:"
echo "   ${YELLOW}python3 config.py${NC}"
echo ""
echo "3. Запустите примеры:"
echo "   ${YELLOW}python3 example_usage.py${NC}"
echo ""
echo "4. Или запустите генерацию контента:"
if [ ! -z "$USER_ID" ]; then
    echo "   ${YELLOW}python3 content_engine.py --user-id $USER_ID${NC}"
else
    echo "   ${YELLOW}python3 content_engine.py --user-id 1${NC}"
fi
echo ""

log_info "Документация:"
echo "   - Быстрый старт: ${YELLOW}QUICKSTART.md${NC}"
echo "   - Полная документация: ${YELLOW}README.md${NC}"
echo ""

log_success "Готово!"
