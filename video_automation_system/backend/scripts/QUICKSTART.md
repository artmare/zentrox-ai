# 🚀 Быстрый старт - AI Content Generator

Это руководство поможет вам запустить AI Content Generator за 5 минут.

---

## ⚡ Минимальная установка

### Шаг 1: Установка зависимостей

```bash
cd /home/ubuntu/video_automation_system/backend/scripts/
pip install -r requirements.txt
```

### Шаг 2: Настройка переменных окружения

```bash
# Копируем шаблон
cp .env.example .env

# Редактируем файл .env
nano .env
```

**Минимально необходимые переменные:**
```env
YOUTUBE_API_KEY=ваш_youtube_api_ключ
ABACUS_API_KEY=ваш_abacus_api_ключ
DB_PASSWORD=ваш_пароль_от_базы
```

### Шаг 3: Инициализация базы данных

```bash
# Подключиться к PostgreSQL
psql -U postgres

# Выполнить SQL скрипт
\i database_setup.sql

# Выйти
\q
```

### Шаг 4: Проверка конфигурации

```bash
python config.py
```

**Ожидаемый результат:**
```
✓ youtube_api_key: Настроено
✓ abacus_api_key: Настроено
✓ database_config: Настроено
✓ Конфигурация полная и готова к использованию
```

---

## 🎬 Первый запуск

### Вариант A: Интерактивные примеры

```bash
python example_usage.py
```

Выберите пример из меню:
- **1** - Анализ трендов YouTube
- **2** - Генерация идей для видео
- **3** - Полная генерация сценария
- **4** - Автоматическая генерация контента
- **5** - Расширенный анализ трендов

### Вариант B: Прямой вызов функций

```python
from trend_analyzer import analyze_youtube_trends
from script_generator import ScriptGenerator

# 1. Анализ трендов
trends = analyze_youtube_trends('мотивация', 'ru')
print(f"Найдено трендов: {len(trends)}")

# 2. Генерация сценария
generator = ScriptGenerator()
ideas = generator.generate_video_ideas('мотивация', 'ru', trends)
hooks, best_hook = generator.generate_hooks(ideas[0])
script = generator.generate_script(ideas[0], best_hook, 'TikTok', 'ru')

print(f"Сценарий: {script['title']}")
print(f"Сцен: {len(script['scenes'])}")
```

### Вариант C: Автоматическая генерация ежедневного контента

```bash
# Для пользователя с ID=1
python content_engine.py --user-id 1

# С экспортом результата
python content_engine.py --user-id 1 --export result.json

# Принудительная регенерация
python content_engine.py --user-id 1 --force
```

---

## 📊 Тестирование отдельных модулей

### Тест анализатора трендов

```bash
python trend_analyzer.py
```

### Тест генератора сценариев

```bash
python script_generator.py
```

---

## 🔑 Получение API ключей

### YouTube Data API v3

1. Перейдите на https://console.cloud.google.com/
2. Создайте проект или выберите существующий
3. **APIs & Services** → **Library** → Найдите "YouTube Data API v3" → **Enable**
4. **APIs & Services** → **Credentials** → **Create Credentials** → **API Key**
5. Скопируйте ключ в `.env` файл

**Важно:** У бесплатного аккаунта квота = 10,000 единиц/день (100 поисковых запросов)

### Abacus AI API

API ключ автоматически подтягивается из переменной окружения `ABACUS_API_KEY`.

---

## 🗄️ Создание тестового пользователя

```sql
-- Подключиться к базе
psql -U postgres -d video_automation

-- Создать пользователя
INSERT INTO users (username, email, niche, language, platform, scripts_per_day)
VALUES ('your_username', 'your@email.com', 'мотивация', 'ru', 'TikTok', 3);

-- Проверить ID
SELECT id, username FROM users;
```

Запомните ID - он понадобится для генерации контента.

---

## ⚙️ Настройка автоматизации (Cron)

```bash
# Открыть crontab
crontab -e

# Добавить задачу (ежедневно в 09:00)
0 9 * * * cd /home/ubuntu/video_automation_system/backend/scripts && python content_engine.py --user-id 1 >> /home/ubuntu/video_automation_system/logs/cron.log 2>&1
```

---

## 🔍 Проверка результатов

### Проверка в базе данных

```sql
-- Последние сгенерированные сценарии
SELECT id, title, platform, created_at 
FROM video_scripts 
ORDER BY created_at DESC 
LIMIT 5;

-- Статистика трендов
SELECT niche, videos_analyzed, avg_views 
FROM youtube_trends 
ORDER BY analyzed_at DESC 
LIMIT 5;

-- Логи генерации
SELECT status, scripts_generated, execution_time_seconds, created_at
FROM generation_logs
ORDER BY created_at DESC
LIMIT 10;
```

### Проверка логов

```bash
# Просмотр последних логов
tail -f /home/ubuntu/video_automation_system/logs/content_generator.log

# Поиск ошибок
grep ERROR /home/ubuntu/video_automation_system/logs/content_generator.log
```

---

## 🎯 Типичные сценарии использования

### 1. Ежедневная генерация для блогера

```python
# Автоматически каждое утро
from content_engine import generate_daily_content

result = generate_daily_content(user_id=1)
# Результат сохраняется в БД автоматически
```

### 2. Анализ конкурентов

```python
from trend_analyzer import analyze_youtube_trends

# Анализировать несколько ниш
niches = ['мотивация', 'финансы', 'здоровье']

for niche in niches:
    trends = analyze_youtube_trends(niche, 'ru')
    # Сохранить в файл для анализа
    with open(f'trends_{niche}.json', 'w') as f:
        json.dump(trends, f, ensure_ascii=False, indent=2)
```

### 3. Массовая генерация контента

```python
from script_generator import ScriptGenerator

generator = ScriptGenerator()

# Генерация 10 сценариев
for i in range(10):
    ideas = generator.generate_video_ideas('мотивация', 'ru', trends, num_ideas=1)
    hooks, best_hook = generator.generate_hooks(ideas[0])
    script = generator.generate_script(ideas[0], best_hook, 'TikTok', 'ru')
    
    # Сохранить
    with open(f'script_{i+1}.json', 'w') as f:
        json.dump(script, f, ensure_ascii=False, indent=2)
```

---

## ❓ Частые вопросы

### Q: Сколько стоит использование API?

**YouTube Data API:**
- Бесплатная квота: 10,000 единиц/день
- 1 поисковый запрос = 100 единиц
- 1 запрос статистики = 1 единица

**Abacus AI:**
- Зависит от вашего тарифа
- Проверьте баланс в личном кабинете

### Q: Как часто обновлять тренды?

Рекомендуется:
- **Ежедневно** для быстроменяющихся ниш (новости, тренды)
- **1-2 раза в неделю** для стабильных ниш (образование, финансы)

### Q: Можно ли использовать без базы данных?

Да, можно использовать отдельные модули:
```python
# Только анализ трендов
from trend_analyzer import analyze_youtube_trends
trends = analyze_youtube_trends('мотивация', 'ru')

# Только генерация сценариев
from script_generator import ScriptGenerator
generator = ScriptGenerator()
# ... используйте методы генератора
```

### Q: Как изменить количество генерируемых сценариев?

В базе данных:
```sql
UPDATE users SET scripts_per_day = 5 WHERE id = 1;
```

Или в коде:
```python
user_settings['scripts_per_day'] = 5
```

---

## 🐛 Решение проблем

### Ошибка: "YouTube API quota exceeded"

**Решение:** Уменьшите `max_results` в `config.py` или увеличьте квоту в Google Cloud Console.

### Ошибка: "Database connection failed"

**Решение:**
```bash
# Проверить статус PostgreSQL
sudo systemctl status postgresql

# Запустить PostgreSQL
sudo systemctl start postgresql
```

### Ошибка: "Invalid JSON response from LLM"

**Решение:** Увеличьте `max_tokens` в `config.py` (ABACUS_CONFIG).

---

## 📚 Дополнительная документация

- **Полная документация:** [README.md](README.md)
- **Примеры использования:** `python example_usage.py`
- **API Reference:** См. docstrings в модулях

---

## ✅ Чек-лист готовности

- [ ] Python 3.8+ установлен
- [ ] PostgreSQL 12+ установлен и запущен
- [ ] Зависимости установлены (`pip install -r requirements.txt`)
- [ ] YouTube API ключ получен и настроен
- [ ] Abacus AI API ключ настроен
- [ ] База данных инициализирована (`database_setup.sql`)
- [ ] Тестовый пользователь создан
- [ ] Конфигурация проверена (`python config.py`)
- [ ] Первый тест пройден (`python example_usage.py`)

---

**🎉 Готово! Теперь вы можете генерировать вирусный контент автоматически!**
