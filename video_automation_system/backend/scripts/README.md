# 🎬 AI Content Generator

**Автоматическая система генерации видео-сценариев для социальных сетей**

Модуль для автоматической генерации высококачественных сценариев для коротких видео (TikTok, YouTube Shorts, Instagram Reels) на основе анализа трендов YouTube и AI-генерации контента через Abacus AI.

---

## 📋 Оглавление

- [Возможности](#-возможности)
- [Архитектура](#-архитектура)
- [Установка](#-установка)
- [Настройка](#-настройка)
- [Использование](#-использование)
- [API Документация](#-api-документация)
- [База данных](#-база-данных)
- [Примеры](#-примеры)
- [Troubleshooting](#-troubleshooting)

---

## ✨ Возможности

### 🔍 Анализ трендов YouTube
- Поиск популярных Shorts по ключевым словам ниши (до 20 видео за запрос)
- Получение метрик: просмотры, лайки, комментарии
- Анализ заголовков и описаний для выявления паттернов хуков
- Расчёт коэффициента вовлеченности
- Выявление успешных формул контента

### 🤖 AI-генерация сценариев
- Генерация идей на основе трендов и истории успешных сценариев
- Создание 5 вариантов хуков с автоматическим выбором лучшего
- Детальные сценарии из 5 сцен для каждого видео
- Каждая сцена содержит:
  - Текст для озвучки
  - Визуальное описание
  - Длительность 2-3 секунды
  - Промпт для AI-генерации видео

### 🎯 Платформо-специфичная оптимизация
- **TikTok**: Агрессивный хук, быстрый темп, высокая эмоциональность
- **YouTube Shorts**: Ценность, логика, удержание внимания
- **Instagram Reels**: Визуальный приоритет, быстрый темп

### 📊 Автоматизация
- Ежедневная генерация контента по расписанию
- Сохранение в базу данных PostgreSQL
- Полное логирование всех операций
- Экспорт результатов в JSON

---

## 🏗 Архитектура

```
video_automation_system/
└── backend/
    └── scripts/
        ├── config.py              # Конфигурация и настройки
        ├── trend_analyzer.py      # Анализатор трендов YouTube
        ├── script_generator.py    # Генератор сценариев (Abacus AI)
        ├── content_engine.py      # Главный оркестратор
        ├── requirements.txt       # Python зависимости
        └── README.md             # Документация
```

### Компоненты

#### 1. **config.py**
Центральный конфигурационный файл:
- API ключи (YouTube, Abacus AI)
- Параметры поиска и анализа
- Настройки генерации контента
- Конфигурация базы данных
- Настройки логирования

#### 2. **trend_analyzer.py**
Анализатор трендов YouTube:
- `analyze_youtube_trends(niche, language)` - главная функция
- Поиск Shorts через YouTube Data API v3
- Фильтрация по метрикам вовлеченности
- Извлечение паттернов хуков
- Генерация рекомендаций

#### 3. **script_generator.py**
Генератор сценариев через Abacus AI:
- `generate_video_ideas()` - генерация идей
- `generate_hooks()` - создание хуков
- `generate_script()` - полный сценарий
- Платформо-специфичные промпты
- JSON-структурированный вывод

#### 4. **content_engine.py**
Главный оркестратор:
- `generate_daily_content(user_id)` - основная функция
- Получение настроек пользователя из БД
- Координация всех компонентов
- Сохранение результатов
- Логирование метрик

---

## 🚀 Установка

### Требования
- Python 3.8+
- PostgreSQL 12+
- YouTube Data API v3 ключ
- Abacus AI аккаунт

### Шаг 1: Клонирование и установка зависимостей

```bash
cd /home/ubuntu/video_automation_system/backend/scripts/
pip install -r requirements.txt
```

### Шаг 2: Настройка переменных окружения

Создайте файл `.env` в директории проекта:

```bash
# YouTube Data API
YOUTUBE_API_KEY=your_youtube_api_key_here

# Abacus AI API (автоматически подтягивается)
ABACUS_API_KEY=your_abacus_api_key_here

# Database
DB_HOST=localhost
DB_PORT=5432
DB_NAME=video_automation
DB_USER=postgres
DB_PASSWORD=your_password_here
```

---

## ⚙️ Настройка

### 1. Получение YouTube Data API ключа

1. Перейдите в [Google Cloud Console](https://console.cloud.google.com/)
2. Создайте новый проект или выберите существующий
3. Включите **YouTube Data API v3**:
   - APIs & Services → Library
   - Найдите "YouTube Data API v3"
   - Нажмите "Enable"
4. Создайте API ключ:
   - APIs & Services → Credentials
   - Create Credentials → API Key
   - Скопируйте ключ в `.env`

### 2. Настройка Abacus AI

Abacus AI API ключ автоматически подтягивается из переменной окружения `ABACUS_API_KEY`.

### 3. Настройка базы данных PostgreSQL

#### Создание базы данных:

```sql
CREATE DATABASE video_automation;
```

#### Создание таблиц:

```sql
-- Таблица пользователей
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    niche VARCHAR(100) NOT NULL,
    language VARCHAR(10) DEFAULT 'ru',
    platform VARCHAR(50) DEFAULT 'TikTok',
    scripts_per_day INTEGER DEFAULT 3,
    settings JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица сценариев
CREATE TABLE video_scripts (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    title VARCHAR(255),
    description TEXT,
    script_data JSONB NOT NULL,
    platform VARCHAR(50),
    status VARCHAR(50) DEFAULT 'draft',
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Таблица трендов
CREATE TABLE youtube_trends (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id),
    niche VARCHAR(100),
    trend_data JSONB NOT NULL,
    analyzed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Индексы для оптимизации
CREATE INDEX idx_scripts_user_id ON video_scripts(user_id);
CREATE INDEX idx_scripts_created_at ON video_scripts(created_at);
CREATE INDEX idx_trends_user_id ON youtube_trends(user_id);
```

#### Пример вставки тестового пользователя:

```sql
INSERT INTO users (niche, language, platform, scripts_per_day, settings)
VALUES (
    'мотивация',
    'ru',
    'TikTok',
    3,
    '{"target_audience": "18-35", "tone": "energetic"}'::jsonb
);
```

### 4. Проверка конфигурации

```bash
python config.py
```

Вывод должен показать:
```
✓ youtube_api_key: Настроено
✓ abacus_api_key: Настроено
✓ database_config: Настроено
✓ Конфигурация полная и готова к использованию
```

---

## 📖 Использование

### Базовое использование

#### 1. Анализ трендов

```python
from trend_analyzer import analyze_youtube_trends

trends = analyze_youtube_trends(
    niche='мотивация',
    language='ru'
)

print(f"Найдено трендов: {len(trends)}")
print(f"Проанализировано видео: {trends[0]['videos_analyzed']}")
```

#### 2. Генерация сценариев

```python
from script_generator import ScriptGenerator

generator = ScriptGenerator()

# Генерация идей
ideas = generator.generate_video_ideas(
    niche='мотивация',
    language='ru',
    trends=trends
)

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

#### 3. Автоматическая генерация ежедневного контента

```python
from content_engine import generate_daily_content

result = generate_daily_content(user_id=1)

print(f"Статус: {result['status']}")
print(f"Сгенерировано сценариев: {result['metrics']['scripts_generated']}")
```

### Командная строка (CLI)

```bash
# Генерация контента для пользователя
python content_engine.py --user-id 1

# Принудительная регенерация (игнорировать кэш)
python content_engine.py --user-id 1 --force

# Экспорт результата в JSON
python content_engine.py --user-id 1 --export results.json
```

### Автоматизация через Cron

Добавьте в crontab для ежедневной генерации:

```bash
# Открыть crontab
crontab -e

# Добавить строку (генерация каждый день в 09:00)
0 9 * * * cd /home/ubuntu/video_automation_system/backend/scripts && python content_engine.py --user-id 1 >> /home/ubuntu/video_automation_system/logs/cron.log 2>&1
```

---

## 🔌 API Документация

### trend_analyzer.py

#### `analyze_youtube_trends(niche, language, api_key=None)`

Анализирует тренды YouTube для заданной ниши.

**Параметры:**
- `niche` (str): Ниша для анализа (например, "мотивация", "финансы")
- `language` (str): Код языка ("ru", "en", "es", etc.)
- `api_key` (str, optional): YouTube API ключ

**Возвращает:**
```python
[
    {
        'niche': 'мотивация',
        'analyzed_at': '2024-04-29T10:00:00',
        'videos_analyzed': 20,
        'avg_views': 150000,
        'avg_engagement_rate': 0.045,
        'hook_patterns': {
            'title_patterns': [...],
            'common_words': [...],
            'question_usage': {...},
            'number_usage': {...}
        },
        'top_performing_videos': [...],
        'recommendations': [...]
    }
]
```

### script_generator.py

#### `generate_video_ideas(niche, language, trends, past_successful_scripts=None)`

Генерирует идеи для видео.

**Параметры:**
- `niche` (str): Ниша контента
- `language` (str): Код языка
- `trends` (list): Список трендов из trend_analyzer
- `past_successful_scripts` (list, optional): История успешных сценариев

**Возвращает:**
```python
[
    {
        'title': 'Название идеи',
        'description': 'Описание',
        'target_audience': 'Целевая аудитория',
        'viral_potential': 'high',
        'emotion': 'любопытство',
        'key_message': 'Ключевое сообщение'
    }
]
```

#### `generate_hooks(idea)`

Генерирует варианты хуков.

**Возвращает:**
```python
hooks = [
    {
        'text': 'Текст хука',
        'type': 'question',
        'emotion_trigger': 'curiosity',
        'score': 8.5,
        'reasoning': 'Объяснение'
    }
]

best_hook = {...}  # Хук с наивысшим score
```

#### `generate_script(idea, hook, platform='TikTok', language='ru')`

Генерирует полный сценарий.

**Возвращает:**
```python
{
    'title': 'Название видео',
    'description': 'Описание',
    'hashtags': ['#хэштег1', '#хэштег2'],
    'total_duration': 15,
    'scenes': [
        {
            'scene_number': 1,
            'voiceover_text': 'Текст озвучки',
            'visual_description': 'Визуальное описание',
            'duration': 2.5,
            'video_prompt': 'AI промпт для видео',
            'notes': 'Заметки'
        }
    ],
    'cta': {
        'text': 'Призыв к действию',
        'position': 'end',
        'action': 'subscribe'
    },
    'monetization': {
        'type': 'product',
        'description': 'Описание'
    },
    'metadata': {...}
}
```

### content_engine.py

#### `generate_daily_content(user_id, force_regenerate=False)`

Главная функция для генерации ежедневного контента.

**Параметры:**
- `user_id` (int): ID пользователя
- `force_regenerate` (bool): Игнорировать кэш

**Возвращает:**
```python
{
    'status': 'success',
    'user_id': 1,
    'generated_at': '2024-04-29T10:00:00',
    'execution_time_seconds': 45.2,
    'metrics': {
        'trends_analyzed': 1,
        'scripts_generated': 3,
        'scripts_saved': 3,
        'past_scripts_used': 5
    },
    'scripts': [...]
}
```

---

## 💾 База данных

### Схема

```sql
users                      video_scripts              youtube_trends
┌──────────────┐          ┌──────────────┐          ┌──────────────┐
│ id           │◄─────┐   │ id           │          │ id           │
│ niche        │      │   │ user_id      │          │ user_id      │
│ language     │      └───┤ title        │          │ niche        │
│ platform     │          │ description  │          │ trend_data   │
│ scripts_per  │          │ script_data  │          │ analyzed_at  │
│ settings     │          │ platform     │          └──────────────┘
│ created_at   │          │ status       │
└──────────────┘          │ views        │
                          │ likes        │
                          │ created_at   │
                          └──────────────┘
```

### Примеры запросов

```sql
-- Получить все сценарии пользователя за сегодня
SELECT * FROM video_scripts 
WHERE user_id = 1 
AND DATE(created_at) = CURRENT_DATE;

-- Топ-5 успешных сценариев
SELECT * FROM video_scripts 
WHERE user_id = 1 
ORDER BY views DESC 
LIMIT 5;

-- Статистика генерации за месяц
SELECT 
    DATE(created_at) as date,
    COUNT(*) as scripts_count
FROM video_scripts
WHERE user_id = 1
AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

---

## 📚 Примеры

### Пример 1: Полный цикл генерации

```python
#!/usr/bin/env python3
"""
Пример полного цикла генерации контента
"""

from trend_analyzer import analyze_youtube_trends
from script_generator import ScriptGenerator
import json

# 1. Анализ трендов
print("🔍 Анализ трендов YouTube...")
trends = analyze_youtube_trends(
    niche='мотивация',
    language='ru'
)

print(f"✓ Найдено трендов: {len(trends)}")

# 2. Генерация контента
print("\n🤖 Генерация сценариев...")
generator = ScriptGenerator()

# Генерация идей
ideas = generator.generate_video_ideas(
    niche='мотивация',
    language='ru',
    trends=trends,
    num_ideas=3
)

print(f"✓ Сгенерировано идей: {len(ideas)}")

# Обработка каждой идеи
for i, idea in enumerate(ideas, 1):
    print(f"\n📝 Идея {i}: {idea['title']}")
    
    # Генерация хуков
    hooks, best_hook = generator.generate_hooks(idea)
    print(f"   Лучший хук: {best_hook['text']}")
    
    # Генерация сценария
    script = generator.generate_script(
        idea=idea,
        hook=best_hook,
        platform='TikTok',
        language='ru'
    )
    
    # Сохранение в файл
    filename = f"script_{i}.json"
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(script, f, ensure_ascii=False, indent=2)
    
    print(f"   ✓ Сценарий сохранён: {filename}")
    print(f"   Сцен: {len(script['scenes'])}, Длительность: {script['total_duration']}с")

print("\n✅ Генерация завершена!")
```

### Пример 2: Анализ конкретного тренда

```python
from trend_analyzer import YouTubeTrendAnalyzer

analyzer = YouTubeTrendAnalyzer()
trends = analyzer.analyze_youtube_trends(
    niche='финансы',
    language='ru',
    max_results=20
)

if trends:
    trend = trends[0]
    
    print("📊 ОТЧЁТ ПО ТРЕНДАМ")
    print("=" * 50)
    print(f"Ниша: {trend['niche']}")
    print(f"Проанализировано: {trend['videos_analyzed']} видео")
    print(f"Средние просмотры: {trend['avg_views']:,}")
    print(f"Вовлеченность: {trend['avg_engagement_rate']:.2%}")
    
    print("\n🎯 Топ паттерны хуков:")
    for pattern in trend['hook_patterns']['title_patterns'][:5]:
        print(f"  • {pattern['pattern']}: {pattern['usage_percentage']}%")
    
    print("\n💡 Рекомендации:")
    for rec in trend['recommendations']:
        print(f"  • {rec}")
```

---

## 🔧 Troubleshooting

### Проблема: YouTube API квота исчерпана

**Решение:**
- YouTube Data API имеет дневную квоту (10,000 единиц по умолчанию)
- Один поисковый запрос = 100 единиц
- Запрос статистики = 1 единица
- Уменьшите `max_results` в `config.py`
- Запросите увеличение квоты в Google Cloud Console

### Проблема: Ошибка подключения к БД

**Решение:**
```bash
# Проверка статуса PostgreSQL
sudo systemctl status postgresql

# Запуск PostgreSQL
sudo systemctl start postgresql

# Проверка подключения
psql -U postgres -d video_automation
```

### Проблема: Abacus AI API ошибка

**Решение:**
- Проверьте наличие `ABACUS_API_KEY` в переменных окружения
- Убедитесь, что баланс аккаунта положительный
- Проверьте лимиты API

### Проблема: LLM возвращает невалидный JSON

**Решение:**
Модуль автоматически пытается извлечь JSON из ответа. Если это не помогает:
- Увеличьте `max_tokens` в `config.py`
- Попробуйте снизить `temperature`
- Проверьте промпты в `script_generator.py`

---

## 📝 Логи

Логи сохраняются в:
```
/home/ubuntu/video_automation_system/logs/content_generator.log
```

Формат лога:
```
2024-04-29 10:00:00 - content_engine - INFO - Запуск генерации контента для пользователя 1
2024-04-29 10:00:05 - trend_analyzer - INFO - YouTube API клиент успешно инициализирован
2024-04-29 10:00:15 - trend_analyzer - INFO - Найдено 20 видео для анализа
...
```

---

## 🚀 Дальнейшее развитие

- [ ] Поддержка других платформ (Pinterest, LinkedIn)
- [ ] Интеграция с AI видео-генераторами
- [ ] A/B тестирование хуков
- [ ] Автоматическая публикация в соцсети
- [ ] Расширенная аналитика эффективности
- [ ] REST API для интеграции
- [ ] Web интерфейс для управления

---

## 📄 Лицензия

MIT License

---

## 👥 Поддержка

При возникновении проблем:
1. Проверьте логи
2. Запустите тесты: `pytest`
3. Проверьте конфигурацию: `python config.py`

---

**Создано с ❤️ для автоматизации контент-креации**
