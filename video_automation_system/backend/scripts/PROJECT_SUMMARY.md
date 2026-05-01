# 📊 AI Content Generator - Итоговая документация

## 🎯 Описание проекта

**AI Content Generator** - это полнофункциональная система автоматической генерации профессиональных видео-сценариев для социальных сетей (TikTok, YouTube Shorts, Instagram Reels). Система анализирует актуальные тренды на YouTube и использует Abacus AI LLM для создания вирусного контента.

---

## 📁 Структура проекта

```
/home/ubuntu/video_automation_system/backend/scripts/
│
├── 📄 config.py                  # Центральная конфигурация системы
├── 🔍 trend_analyzer.py          # Анализатор трендов YouTube
├── 🤖 script_generator.py        # Генератор сценариев через AI
├── 🎬 content_engine.py          # Главный оркестратор
│
├── 📦 __init__.py                # Python пакет
├── 📋 requirements.txt           # Зависимости Python
├── 🗄️ database_setup.sql        # SQL скрипт инициализации БД
├── 🔧 setup.sh                   # Автоматический установщик
│
├── 📖 README.md                  # Полная документация
├── 🚀 QUICKSTART.md              # Быстрый старт гайд
├── 📝 example_usage.py           # Примеры использования
├── 🔐 .env.example               # Шаблон переменных окружения
│
└── 📊 PROJECT_SUMMARY.md         # Этот файл
```

---

## 🏗️ Архитектура системы

```
┌─────────────────────────────────────────────────────────────┐
│                     AI CONTENT GENERATOR                     │
└─────────────────────────────────────────────────────────────┘
                              │
                ┌─────────────┴─────────────┐
                │                           │
        ┌───────▼───────┐          ┌────────▼────────┐
        │ Content Engine │          │  Configuration  │
        │  (Orchestrator)│          │    (config.py)  │
        └───────┬───────┘          └─────────────────┘
                │
        ┌───────┴───────┐
        │               │
┌───────▼────────┐  ┌──▼──────────────┐
│ Trend Analyzer │  │ Script Generator │
│  (YouTube API) │  │   (Abacus AI)   │
└────────────────┘  └─────────────────┘
        │                    │
        └──────────┬─────────┘
                   │
        ┌──────────▼──────────┐
        │   PostgreSQL DB     │
        │  (users, scripts,   │
        │   trends, logs)     │
        └─────────────────────┘
```

---

## 🔑 Ключевые компоненты

### 1. **config.py** - Центр конфигурации
**Функции:**
- Хранение API ключей (YouTube, Abacus AI)
- Параметры поиска и анализа
- Настройки генерации контента
- Конфигурация базы данных
- Настройки логирования

**Ключевые настройки:**
```python
YOUTUBE_CONFIG = {
    'max_results': 20,
    'search_order': 'viewCount',
    'min_views': 10000,
    'engagement_threshold': 0.03
}

SCRIPT_CONFIG = {
    'hooks_per_idea': 5,
    'scenes_per_script': 5,
    'total_duration_target': 15
}
```

### 2. **trend_analyzer.py** - Анализ YouTube трендов
**Возможности:**
- Поиск популярных Shorts через YouTube Data API v3
- Фильтрация по метрикам вовлеченности
- Анализ паттернов в заголовках и описаниях
- Выявление успешных формул контента
- Генерация рекомендаций

**Класс:** `YouTubeTrendAnalyzer`

**Главная функция:**
```python
analyze_youtube_trends(niche, language) -> List[Dict]
```

**Выходные данные:**
```python
{
    'niche': 'мотивация',
    'videos_analyzed': 20,
    'avg_views': 150000,
    'avg_engagement_rate': 0.045,
    'hook_patterns': {...},
    'top_performing_videos': [...],
    'recommendations': [...]
}
```

### 3. **script_generator.py** - AI генерация сценариев
**Возможности:**
- Генерация идей на основе трендов
- Создание 5 вариантов хуков с автовыбором лучшего
- Детальные сценарии с разбивкой на сцены
- Платформо-специфичная оптимизация
- CTA и элементы монетизации

**Класс:** `ScriptGenerator`

**Основные методы:**
```python
generate_video_ideas(niche, language, trends) -> List[Dict]
generate_hooks(idea) -> (List[Dict], Dict)
generate_script(idea, hook, platform, language) -> Dict
```

**Структура сценария:**
```python
{
    'title': 'Название',
    'description': 'Описание',
    'hashtags': [...],
    'scenes': [
        {
            'scene_number': 1,
            'voiceover_text': '...',
            'visual_description': '...',
            'duration': 2.5,
            'video_prompt': '...'
        }
    ],
    'cta': {...},
    'monetization': {...}
}
```

### 4. **content_engine.py** - Главный оркестратор
**Возможности:**
- Координация всего процесса генерации
- Получение настроек пользователя из БД
- Управление историей успешных сценариев
- Сохранение результатов в БД
- Детальное логирование

**Класс:** `ContentEngine`

**Главная функция:**
```python
generate_daily_content(user_id, force_regenerate) -> Dict
```

**Рабочий процесс:**
1. Загрузка настроек пользователя
2. Проверка кэша (если не force)
3. Анализ трендов YouTube
4. Получение истории успешных сценариев
5. Генерация идей → хуков → сценариев
6. Сохранение в БД
7. Логирование метрик

---

## 🗄️ База данных

### Схема таблиц

#### **users** - Пользователи системы
```sql
- id (SERIAL PRIMARY KEY)
- username (VARCHAR)
- email (VARCHAR)
- niche (VARCHAR)         # Ниша контента
- language (VARCHAR)      # Язык контента
- platform (VARCHAR)      # Целевая платформа
- scripts_per_day (INT)   # Количество сценариев/день
- settings (JSONB)        # Дополнительные настройки
- created_at (TIMESTAMP)
```

#### **video_scripts** - Сгенерированные сценарии
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- title (VARCHAR)
- description (TEXT)
- script_data (JSONB)     # Полный сценарий
- platform (VARCHAR)
- status (VARCHAR)        # draft, ready, published
- views (INTEGER)
- likes (INTEGER)
- engagement_rate (DECIMAL)
- created_at (TIMESTAMP)
```

#### **youtube_trends** - Анализ трендов
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- niche (VARCHAR)
- trend_data (JSONB)      # Детальные данные
- videos_analyzed (INT)
- avg_views (INTEGER)
- avg_engagement_rate (DECIMAL)
- analyzed_at (TIMESTAMP)
```

#### **generation_logs** - Логи генерации
```sql
- id (SERIAL PRIMARY KEY)
- user_id (INTEGER FK)
- status (VARCHAR)        # success, error, skipped
- execution_time_seconds (DECIMAL)
- scripts_generated (INT)
- scripts_saved (INT)
- error_message (TEXT)
- created_at (TIMESTAMP)
```

---

## 🚀 Установка и запуск

### Автоматическая установка (рекомендуется)

```bash
cd /home/ubuntu/video_automation_system/backend/scripts/
chmod +x setup.sh
./setup.sh
```

Скрипт автоматически:
- ✓ Проверит версию Python
- ✓ Установит зависимости
- ✓ Проверит PostgreSQL
- ✓ Создаст .env файл
- ✓ Инициализирует базу данных
- ✓ Создаст тестового пользователя
- ✓ Настроит права доступа

### Ручная установка

```bash
# 1. Установка зависимостей
pip install -r requirements.txt

# 2. Настройка окружения
cp .env.example .env
nano .env  # Добавьте API ключи

# 3. Инициализация БД
psql -U postgres -f database_setup.sql

# 4. Проверка
python config.py
```

---

## 💻 Примеры использования

### 1. Базовый анализ трендов

```python
from trend_analyzer import analyze_youtube_trends

trends = analyze_youtube_trends('мотивация', 'ru')
print(f"Найдено трендов: {len(trends)}")
print(f"Средние просмотры: {trends[0]['avg_views']:,}")
```

### 2. Полная генерация сценария

```python
from script_generator import ScriptGenerator

generator = ScriptGenerator()

# Генерация идей
ideas = generator.generate_video_ideas('мотивация', 'ru', trends)

# Генерация хуков
hooks, best_hook = generator.generate_hooks(ideas[0])

# Полный сценарий
script = generator.generate_script(
    idea=ideas[0],
    hook=best_hook,
    platform='TikTok',
    language='ru'
)
```

### 3. Автоматическая генерация

```bash
# CLI
python content_engine.py --user-id 1 --export result.json

# Или в Python
from content_engine import generate_daily_content
result = generate_daily_content(user_id=1)
```

### 4. Интерактивные примеры

```bash
python example_usage.py
```

---

## 🔧 API и интеграции

### YouTube Data API v3

**Требования:**
- API ключ из Google Cloud Console
- Квота: 10,000 единиц/день (бесплатно)
- 1 поисковый запрос = 100 единиц

**Использование:**
```python
from trend_analyzer import YouTubeTrendAnalyzer

analyzer = YouTubeTrendAnalyzer(api_key='YOUR_KEY')
trends = analyzer.analyze_youtube_trends('финансы', 'ru')
```

### Abacus AI LLM API

**Требования:**
- Abacus AI аккаунт
- API ключ в переменной окружения

**Использование:**
```python
from script_generator import ScriptGenerator

generator = ScriptGenerator()
# API ключ подтягивается автоматически
```

---

## 📊 Метрики и мониторинг

### Логирование

**Файл логов:**
```
/home/ubuntu/video_automation_system/logs/content_generator.log
```

**Формат:**
```
2024-04-29 10:00:00 - content_engine - INFO - Запуск генерации контента
2024-04-29 10:00:05 - trend_analyzer - INFO - Найдено 20 видео
2024-04-29 10:00:15 - script_generator - INFO - Сгенерировано 3 сценария
```

### Мониторинг через БД

```sql
-- Статистика генерации за неделю
SELECT * FROM daily_generation_stats LIMIT 7;

-- Топ сценарии
SELECT * FROM top_scripts_by_views LIMIT 10;

-- Статистика пользователей
SELECT * FROM user_statistics;
```

---

## 🔄 Автоматизация

### Cron Job для ежедневной генерации

```bash
# Открыть crontab
crontab -e

# Добавить задачу (каждый день в 09:00)
0 9 * * * cd /home/ubuntu/video_automation_system/backend/scripts && \
python content_engine.py --user-id 1 >> /home/ubuntu/video_automation_system/logs/cron.log 2>&1
```

### Systemd Service (опционально)

```bash
# /etc/systemd/system/content-generator.service
[Unit]
Description=AI Content Generator Daily Task
After=network.target postgresql.service

[Service]
Type=oneshot
User=ubuntu
WorkingDirectory=/home/ubuntu/video_automation_system/backend/scripts
ExecStart=/usr/bin/python3 content_engine.py --user-id 1

[Install]
WantedBy=multi-user.target
```

---

## 🛠️ Конфигурация и тонкая настройка

### Параметры генерации (config.py)

```python
# Количество вариантов хуков
SCRIPT_CONFIG['hooks_per_idea'] = 5

# Количество сцен в сценарии
SCRIPT_CONFIG['scenes_per_script'] = 5

# Креативность для разных этапов
ABACUS_CONFIG['temperature_ideas'] = 0.8
ABACUS_CONFIG['temperature_hooks'] = 0.9
ABACUS_CONFIG['temperature_scripts'] = 0.7
```

### Настройки по платформам

```python
SCRIPT_CONFIG['platform_settings'] = {
    'TikTok': {
        'style': 'aggressive',
        'pace': 'fast',
        'emotion_level': 'high'
    },
    'YouTube': {
        'style': 'value-driven',
        'pace': 'moderate',
        'emotion_level': 'medium'
    }
}
```

---

## 🧪 Тестирование

### Запуск тестов отдельных модулей

```bash
# Тест анализатора трендов
python trend_analyzer.py

# Тест генератора сценариев
python script_generator.py

# Проверка конфигурации
python config.py
```

### Интеграционные тесты

```bash
# Запуск всех примеров
python example_usage.py
# Выберите опцию 'A' для запуска всех
```

---

## 📈 Производительность

### Время выполнения

**Типичные показатели:**
- Анализ трендов: 5-10 секунд
- Генерация 1 идеи: 3-5 секунд
- Генерация 5 хуков: 5-8 секунд
- Полный сценарий: 10-15 секунд
- **Полный цикл (3 сценария): 40-60 секунд**

### Оптимизация

```python
# Уменьшение количества запросов к YouTube
YOUTUBE_CONFIG['max_results'] = 10  # вместо 20

# Уменьшение количества генерируемых элементов
SCRIPT_CONFIG['hooks_per_idea'] = 3  # вместо 5
SCRIPT_CONFIG['ideas_per_generation'] = 2  # вместо 3
```

---

## 🔒 Безопасность

### Защита API ключей

```bash
# Права доступа к .env
chmod 600 .env

# Никогда не коммитьте .env в git
echo ".env" >> .gitignore
```

### Ограничение доступа к БД

```sql
-- Создать отдельного пользователя для приложения
CREATE USER content_app WITH PASSWORD 'strong_password';
GRANT SELECT, INSERT, UPDATE ON ALL TABLES IN SCHEMA public TO content_app;
```

---

## 📚 Документация

### Доступные файлы

1. **README.md** - Полная техническая документация
2. **QUICKSTART.md** - Быстрый старт гайд
3. **PROJECT_SUMMARY.md** - Этот файл (обзор проекта)
4. **example_usage.py** - Интерактивные примеры

### Внутренняя документация

Все модули содержат подробные docstrings:

```python
help(YouTubeTrendAnalyzer)
help(ScriptGenerator)
help(ContentEngine)
```

---

## 🐛 Troubleshooting

### Частые проблемы

#### 1. YouTube API квота исчерпана
**Решение:** Уменьшите `max_results` или увеличьте квоту

#### 2. Database connection failed
**Решение:** 
```bash
sudo systemctl start postgresql
```

#### 3. Invalid JSON from LLM
**Решение:** Увеличьте `max_tokens` в config

#### 4. Import errors
**Решение:**
```bash
pip install -r requirements.txt --upgrade
```

---

## 🚀 Дальнейшее развитие

### Планируемые функции

- [ ] REST API для внешней интеграции
- [ ] Web интерфейс для управления
- [ ] Автоматическая публикация в соцсети
- [ ] A/B тестирование хуков
- [ ] Интеграция с AI видео-генераторами
- [ ] Расширенная аналитика эффективности
- [ ] Поддержка дополнительных платформ

---

## 📞 Поддержка

### При возникновении проблем:

1. Проверьте логи: `tail -f logs/content_generator.log`
2. Проверьте конфигурацию: `python config.py`
3. Запустите тесты: `python example_usage.py`
4. Проверьте БД: `psql -U postgres -d video_automation`

---

## 📄 Лицензия

MIT License

---

## ✅ Чек-лист завершения проекта

### Созданные файлы:

- [x] **config.py** - Конфигурация (9 KB)
- [x] **trend_analyzer.py** - Анализатор трендов (20 KB)
- [x] **script_generator.py** - Генератор сценариев (22 KB)
- [x] **content_engine.py** - Главный оркестратор (23 KB)
- [x] **requirements.txt** - Зависимости
- [x] **database_setup.sql** - SQL скрипт (11 KB)
- [x] **setup.sh** - Автоматический установщик (10 KB)
- [x] **README.md** - Полная документация (21 KB)
- [x] **QUICKSTART.md** - Быстрый старт (10 KB)
- [x] **example_usage.py** - Примеры использования (12 KB)
- [x] **.env.example** - Шаблон переменных
- [x] **__init__.py** - Python пакет
- [x] **PROJECT_SUMMARY.md** - Этот файл

### Функциональность:

- [x] Анализ трендов YouTube через API v3
- [x] Генерация идей через Abacus AI LLM
- [x] Генерация хуков (5 вариантов + автовыбор)
- [x] Генерация детальных сценариев (5 сцен)
- [x] Платформо-специфичная оптимизация
- [x] Интеграция с PostgreSQL
- [x] Логирование всех операций
- [x] CLI интерфейс
- [x] Автоматический установщик
- [x] Полная документация

---

**🎉 Проект полностью завершён и готов к использованию!**

**Последнее обновление:** 29 апреля 2026
**Версия:** 1.0.0
