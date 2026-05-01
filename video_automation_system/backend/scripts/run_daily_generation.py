#!/usr/bin/env python3
"""
Обёртка для ежедневного запуска генерации контента для всех активных пользователей.
Функция run_daily_generation() — точка входа для scheduled task.
"""

import os
import sys
import json
import logging
from datetime import datetime

# Добавляем путь к скриптам
SCRIPTS_DIR = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, SCRIPTS_DIR)

import psycopg2
from psycopg2.extras import RealDictCursor

# Настройка логирования
LOG_DIR = '/home/ubuntu/video_automation_system/logs'
os.makedirs(LOG_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f'daily_generation_{datetime.now().strftime("%Y%m%d")}.log')

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('run_daily_generation')


def get_database_url():
    """Получить DATABASE_URL из переменных окружения или .env файлов"""
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        return db_url
    
    # Попробовать из shared/.env
    env_paths = [
        '/home/ubuntu/shared/.env',
        '/home/ubuntu/video_automation_system/nextjs_space/.env',
    ]
    for env_path in env_paths:
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        val = line.split('=', 1)[1].strip().strip('"').strip("'")
                        return val
    return None


def get_active_users(conn):
    """Получить всех пользователей с autopilot_enabled=true"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT u.id, u.name, u.email,
               us.niche, us.language, us.platforms, us.videos_per_day,
               us.content_strategy, us.schedule_time
        FROM users u
        JOIN user_settings us ON u.id = us.user_id
        WHERE us.autopilot_enabled = true
    """)
    users = cursor.fetchall()
    cursor.close()
    return users


def get_user_successful_scripts(conn, user_id, limit=10):
    """Получить историю успешных сценариев пользователя"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    cursor.execute("""
        SELECT title, hook, content_type, emotion, platform, full_script
        FROM video_scripts
        WHERE user_id = %s AND status IN ('published', 'approved')
        ORDER BY created_at DESC
        LIMIT %s
    """, (user_id, limit))
    scripts = cursor.fetchall()
    cursor.close()
    return scripts


def get_recent_trends(conn, platform=None, limit=20):
    """Получить последние тренды"""
    cursor = conn.cursor(cursor_factory=RealDictCursor)
    if platform:
        cursor.execute("""
            SELECT title, hook_type, emotion, views, engagement_rate, platform
            FROM trends
            WHERE platform = %s
            ORDER BY analyzed_at DESC
            LIMIT %s
        """, (platform, limit))
    else:
        cursor.execute("""
            SELECT title, hook_type, emotion, views, engagement_rate, platform
            FROM trends
            ORDER BY analyzed_at DESC
            LIMIT %s
        """, (limit,))
    trends = cursor.fetchall()
    cursor.close()
    return trends


def check_today_content_exists(conn, user_id):
    """Проверить, есть ли уже сгенерированный контент на сегодня"""
    cursor = conn.cursor()
    cursor.execute("""
        SELECT COUNT(*) FROM video_scripts
        WHERE user_id = %s AND DATE(created_at) = CURRENT_DATE
    """, (user_id,))
    count = cursor.fetchone()[0]
    cursor.close()
    return count > 0


def save_script_to_db(conn, user_id, script_data):
    """Сохранить сценарий в базу данных"""
    import uuid
    script_id = str(uuid.uuid4()).replace('-', '')[:25]
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO video_scripts (id, user_id, platform, title, hook, content_type, emotion, full_script, status, created_at, updated_at)
        VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, 'draft', NOW(), NOW())
    """, (
        script_id,
        user_id,
        script_data.get('platform', 'TikTok'),
        script_data.get('title', 'Без названия'),
        script_data.get('hook', ''),
        script_data.get('content_type', 'educational'),
        script_data.get('emotion', 'inspiring'),
        json.dumps(script_data.get('full_script', {}), ensure_ascii=False)
    ))
    conn.commit()
    logger.info(f"  Сценарий '{script_data.get('title')}' сохранён в БД (id={script_id})")
    cursor.close()
    return script_id


def save_trend_to_db(conn, trend_data):
    """Сохранить тренд в базу данных"""
    import uuid
    trend_id = str(uuid.uuid4()).replace('-', '')[:25]
    
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO trends (id, platform, title, hook_type, emotion, views, engagement_rate, analyzed_at, video_url)
        VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s)
    """, (
        trend_id,
        trend_data.get('platform', 'YouTube'),
        trend_data.get('title', ''),
        trend_data.get('hook_type', 'question'),
        trend_data.get('emotion', 'neutral'),
        trend_data.get('views', 0),
        trend_data.get('engagement_rate', 0.0),
        trend_data.get('video_url', None)
    ))
    conn.commit()
    cursor.close()
    return trend_id


def generate_content_for_user(conn, user, abacus_api_key):
    """
    Генерация контента для одного пользователя с использованием Abacus AI LLM.
    
    Шаги:
    1. Анализ трендов YouTube в нише пользователя
    2. Генерация идей на основе трендов и истории
    3. Создание сценариев с хуками и 5 сценами
    4. Адаптация под платформы (YouTube Shorts, TikTok)
    5. Сохранение в БД
    6. Генерация инструкций по публикации
    """
    from abacusai import ApiClient
    
    user_id = user['id']
    niche = user.get('niche', 'motivation')
    language = user.get('language', 'russian')
    platforms = user.get('platforms', ['TikTok'])
    if isinstance(platforms, str):
        try:
            platforms = json.loads(platforms)
        except:
            platforms = ['TikTok']
    videos_per_day = user.get('videos_per_day', 3)
    content_strategy = user.get('content_strategy', 'mixed')
    
    logger.info(f"  Ниша: {niche}, Язык: {language}, Платформы: {platforms}, Видео/день: {videos_per_day}")
    
    # Проверка — уже есть контент на сегодня?
    if check_today_content_exists(conn, user_id):
        logger.info(f"  Контент на сегодня уже сгенерирован. Пропуск.")
        return {'status': 'skipped', 'reason': 'content_already_exists'}
    
    # Инициализация Abacus AI клиента
    client = ApiClient(api_key=abacus_api_key)
    
    # 1. Получение истории успешных сценариев
    past_scripts = get_user_successful_scripts(conn, user_id)
    past_scripts_summary = ""
    if past_scripts:
        past_scripts_summary = "\n".join([
            f"- Название: {s['title']}, Платформа: {s['platform']}, Тип: {s['content_type']}, Эмоция: {s['emotion']}"
            for s in past_scripts[:5]
        ])
    
    # 2. Получение существующих трендов из БД
    existing_trends = get_recent_trends(conn, limit=10)
    trends_summary = ""
    if existing_trends:
        trends_summary = "\n".join([
            f"- {t['title']} (просмотры: {t['views']}, вовлечённость: {t['engagement_rate']:.2%})"
            for t in existing_trends
        ])
    
    # 3. Анализ трендов YouTube в нише через LLM
    logger.info(f"  Анализ трендов YouTube для ниши '{niche}'...")
    
    trends_prompt = f"""Ты — эксперт по YouTube трендам и вирусному контенту.

Проанализируй текущие тренды на YouTube в нише "{niche}" (язык контента: {language}).

Существующие тренды в базе данных:
{trends_summary if trends_summary else "Нет данных о предыдущих трендах."}

Определи 5 актуальных трендов. Для каждого тренда укажи:
1. Название тренда
2. Тип хука (question/shock/story/fact/challenge)
3. Преобладающая эмоция
4. Примерное количество просмотров у популярных видео
5. Коэффициент вовлечённости (0.01-0.15)

Ответ строго в JSON формате:
[
  {{
    "title": "...",
    "hook_type": "question|shock|story|fact|challenge",
    "emotion": "inspiring|funny|shocking|educational|motivating",
    "views": 100000,
    "engagement_rate": 0.05,
    "platform": "YouTube"
  }}
]"""

    try:
        trends_response = client.evaluate_prompt(
            prompt=trends_prompt,
            system_message="Ты аналитик YouTube трендов. Отвечай только в JSON формате.",
            llm_name="CLAUDE_V3_5_SONNET"
        )
        trends_text = trends_response.content if hasattr(trends_response, 'content') else str(trends_response)
        
        # Извлекаем JSON из ответа
        import re
        json_match = re.search(r'\[.*\]', trends_text, re.DOTALL)
        if json_match:
            new_trends = json.loads(json_match.group())
        else:
            new_trends = []
            logger.warning("  Не удалось извлечь тренды из ответа LLM")
    except Exception as e:
        logger.error(f"  Ошибка анализа трендов: {e}")
        new_trends = []
    
    # Сохранение новых трендов в БД
    for trend in new_trends:
        try:
            save_trend_to_db(conn, trend)
        except Exception as e:
            logger.warning(f"  Ошибка сохранения тренда: {e}")
            conn.rollback()
    
    logger.info(f"  Найдено {len(new_trends)} новых трендов")
    
    # 4. Генерация идей для видео
    logger.info(f"  Генерация {videos_per_day} идей для видео...")
    
    all_trends_text = "\n".join([
        f"- {t.get('title', 'N/A')} (тип хука: {t.get('hook_type', 'N/A')}, эмоция: {t.get('emotion', 'N/A')})"
        for t in (new_trends + [dict(t) for t in existing_trends])[:10]
    ])
    
    ideas_prompt = f"""Ты — креативный продюсер вирусного видео-контента.

Ниша: {niche}
Язык контента: {language}
Стратегия контента: {content_strategy}
Целевые платформы: {', '.join(platforms) if isinstance(platforms, list) else platforms}

Актуальные тренды:
{all_trends_text if all_trends_text else "Нет данных о трендах."}

История успешных сценариев пользователя:
{past_scripts_summary if past_scripts_summary else "Нет истории сценариев. Это новый пользователь."}

Сгенерируй {videos_per_day} уникальных идей для коротких видео. Каждая идея должна:
- Быть актуальной и трендовой
- Учитывать успешный опыт пользователя
- Иметь вирусный потенциал

Для каждой идеи укажи:
1. Рабочее название
2. Тип контента (educational/entertaining/motivational/storytelling/how-to)
3. Эмоцию (inspiring/funny/shocking/educational/motivating)
4. Краткое описание концепции
5. Целевой хук (первые 1-3 секунды)

Ответ строго в JSON:
[
  {{
    "title": "...",
    "content_type": "...",
    "emotion": "...",
    "concept": "...",
    "hook": "..."
  }}
]"""

    try:
        ideas_response = client.evaluate_prompt(
            prompt=ideas_prompt,
            system_message="Ты креативный продюсер вирусного контента. Отвечай только в JSON формате.",
            llm_name="CLAUDE_V3_5_SONNET"
        )
        ideas_text = ideas_response.content if hasattr(ideas_response, 'content') else str(ideas_response)
        
        json_match = re.search(r'\[.*\]', ideas_text, re.DOTALL)
        if json_match:
            ideas = json.loads(json_match.group())
        else:
            ideas = []
            logger.warning("  Не удалось извлечь идеи из ответа LLM")
    except Exception as e:
        logger.error(f"  Ошибка генерации идей: {e}")
        ideas = []
    
    logger.info(f"  Сгенерировано {len(ideas)} идей")
    
    # 5. Создание детальных сценариев для каждой идеи
    generated_scripts = []
    target_platforms = platforms if isinstance(platforms, list) else [platforms]
    # Убедимся что есть YouTube Shorts и TikTok
    if not target_platforms:
        target_platforms = ['YouTube Shorts', 'TikTok']
    
    for idx, idea in enumerate(ideas, 1):
        for platform in target_platforms:
            logger.info(f"  Генерация сценария {idx}/{len(ideas)} для {platform}...")
            
            script_prompt = f"""Ты — профессиональный сценарист коротких вирусных видео для платформы {platform}.

Создай детальный видео-сценарий на основе следующей идеи:
- Название: {idea.get('title', 'Без названия')}
- Тип контента: {idea.get('content_type', 'educational')}
- Эмоция: {idea.get('emotion', 'inspiring')}
- Концепция: {idea.get('concept', '')}
- Хук: {idea.get('hook', '')}
- Язык: {language}
- Платформа: {platform}

Требования к сценарию:
1. Мощный хук в первые 1-3 секунды (для {platform})
2. Структура из ровно 5 сцен
3. Для каждой сцены: текст озвучки, визуальное описание, тайминг
4. Общая длительность: {"15-60 секунд" if "TikTok" in platform else "15-60 секунд для Shorts"}
5. Призыв к действию в конце

Ответ строго в JSON:
{{
  "title": "...",
  "platform": "{platform}",
  "hook": "Текст хука для первых секунд",
  "content_type": "{idea.get('content_type', 'educational')}",
  "emotion": "{idea.get('emotion', 'inspiring')}",
  "total_duration_seconds": 30,
  "full_script": {{
    "hook": {{
      "text": "Текст хука для озвучки",
      "visual": "Описание визуала для хука",
      "duration_seconds": 3
    }},
    "scenes": [
      {{
        "scene_number": 1,
        "text": "Текст озвучки сцены 1",
        "visual": "Описание визуала сцены 1",
        "duration_seconds": 5,
        "transition": "cut/fade/zoom"
      }},
      {{
        "scene_number": 2,
        "text": "Текст озвучки сцены 2",
        "visual": "Описание визуала сцены 2",
        "duration_seconds": 5,
        "transition": "cut"
      }},
      {{
        "scene_number": 3,
        "text": "...",
        "visual": "...",
        "duration_seconds": 5,
        "transition": "..."
      }},
      {{
        "scene_number": 4,
        "text": "...",
        "visual": "...",
        "duration_seconds": 5,
        "transition": "..."
      }},
      {{
        "scene_number": 5,
        "text": "...",
        "visual": "...",
        "duration_seconds": 5,
        "transition": "..."
      }}
    ],
    "cta": {{
      "text": "Призыв к действию",
      "visual": "Описание визуала CTA",
      "duration_seconds": 2
    }}
  }},
  "publishing_instructions": {{
    "best_posting_time": "...",
    "hashtags": ["..."],
    "caption": "...",
    "music_suggestion": "...",
    "thumbnail_description": "..."
  }}
}}"""

            try:
                script_response = client.evaluate_prompt(
                    prompt=script_prompt,
                    system_message="Ты профессиональный сценарист вирусных видео. Отвечай строго в JSON формате.",
                    llm_name="CLAUDE_V3_5_SONNET"
                )
                script_text = script_response.content if hasattr(script_response, 'content') else str(script_response)
                
                json_match = re.search(r'\{.*\}', script_text, re.DOTALL)
                if json_match:
                    script_data = json.loads(json_match.group())
                    
                    # Сохранение в БД
                    script_id = save_script_to_db(conn, user_id, script_data)
                    script_data['db_id'] = script_id
                    generated_scripts.append(script_data)
                    logger.info(f"  ✓ Сценарий '{script_data.get('title', 'N/A')}' для {platform} сохранён")
                else:
                    logger.warning(f"  Не удалось извлечь JSON сценария из ответа LLM")
                    
            except Exception as e:
                logger.error(f"  Ошибка генерации сценария для идеи '{idea.get('title')}' ({platform}): {e}")
                continue
    
    return {
        'status': 'success',
        'user_id': user_id,
        'user_name': user.get('name', 'N/A'),
        'trends_found': len(new_trends),
        'ideas_generated': len(ideas),
        'scripts_generated': len(generated_scripts),
        'platforms': target_platforms,
        'generated_at': datetime.now().isoformat()
    }


def run_daily_generation():
    """
    Главная функция ежедневной генерации контента.
    Итерирует по всем активным пользователям (autopilot_enabled=true)
    и генерирует контент для каждого.
    """
    start_time = datetime.now()
    logger.info("=" * 70)
    logger.info("ЗАПУСК ЕЖЕДНЕВНОЙ ГЕНЕРАЦИИ КОНТЕНТА")
    logger.info(f"Время запуска: {start_time.isoformat()}")
    logger.info("=" * 70)
    
    # Получение DATABASE_URL
    db_url = get_database_url()
    if not db_url:
        logger.error("DATABASE_URL не найден! Генерация невозможна.")
        return {
            'status': 'error',
            'error': 'DATABASE_URL not found',
            'started_at': start_time.isoformat()
        }
    
    # Получение ABACUS_API_KEY
    abacus_api_key = os.environ.get('ABACUS_API_KEY', '')
    if not abacus_api_key:
        logger.error("ABACUS_API_KEY не найден! Генерация невозможна.")
        return {
            'status': 'error',
            'error': 'ABACUS_API_KEY not found',
            'started_at': start_time.isoformat()
        }
    
    # Подключение к БД
    try:
        conn = psycopg2.connect(db_url)
        logger.info("Подключение к БД установлено")
    except Exception as e:
        logger.error(f"Ошибка подключения к БД: {e}")
        return {
            'status': 'error',
            'error': f'DB connection failed: {e}',
            'started_at': start_time.isoformat()
        }
    
    # Получение активных пользователей
    try:
        active_users = get_active_users(conn)
        logger.info(f"Найдено {len(active_users)} активных пользователей с autopilot_enabled=true")
    except Exception as e:
        logger.error(f"Ошибка получения пользователей: {e}")
        conn.close()
        return {
            'status': 'error',
            'error': f'Failed to fetch users: {e}',
            'started_at': start_time.isoformat()
        }
    
    if not active_users:
        logger.info("Нет активных пользователей для генерации. Завершение.")
        conn.close()
        return {
            'status': 'success',
            'message': 'No active users found',
            'users_processed': 0,
            'started_at': start_time.isoformat(),
            'finished_at': datetime.now().isoformat()
        }
    
    # Генерация контента для каждого пользователя
    results = []
    success_count = 0
    error_count = 0
    
    for user in active_users:
        user_id = user['id']
        user_name = user.get('name', 'N/A')
        logger.info(f"\n{'─' * 50}")
        logger.info(f"Обработка пользователя: {user_name} (ID: {user_id})")
        logger.info(f"{'─' * 50}")
        
        try:
            result = generate_content_for_user(conn, user, abacus_api_key)
            results.append(result)
            
            if result.get('status') == 'success':
                success_count += 1
                logger.info(f"✓ Пользователь {user_name}: сгенерировано {result.get('scripts_generated', 0)} сценариев")
            elif result.get('status') == 'skipped':
                logger.info(f"⊘ Пользователь {user_name}: пропущен ({result.get('reason', 'unknown')})")
            else:
                error_count += 1
                logger.warning(f"✗ Пользователь {user_name}: ошибка")
                
        except Exception as e:
            error_count += 1
            logger.error(f"✗ Ошибка для пользователя {user_name} (ID: {user_id}): {e}")
            results.append({
                'status': 'error',
                'user_id': user_id,
                'user_name': user_name,
                'error': str(e)
            })
            # Продолжаем работу для других пользователей
            try:
                conn.rollback()
            except:
                pass
            continue
    
    # Закрытие подключения к БД
    conn.close()
    
    end_time = datetime.now()
    duration = (end_time - start_time).total_seconds()
    
    # Итоговый отчёт
    summary = {
        'status': 'completed',
        'started_at': start_time.isoformat(),
        'finished_at': end_time.isoformat(),
        'duration_seconds': round(duration, 2),
        'total_users': len(active_users),
        'success_count': success_count,
        'error_count': error_count,
        'results': results
    }
    
    logger.info(f"\n{'=' * 70}")
    logger.info("ИТОГИ ЕЖЕДНЕВНОЙ ГЕНЕРАЦИИ")
    logger.info(f"{'=' * 70}")
    logger.info(f"Всего пользователей: {len(active_users)}")
    logger.info(f"Успешно: {success_count}")
    logger.info(f"Ошибки: {error_count}")
    logger.info(f"Длительность: {duration:.2f} сек")
    logger.info(f"{'=' * 70}")
    
    # Сохранение отчёта
    report_file = os.path.join(LOG_DIR, f'report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
    with open(report_file, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    logger.info(f"Отчёт сохранён: {report_file}")
    
    return summary


if __name__ == '__main__':
    result = run_daily_generation()
    print(json.dumps(result, ensure_ascii=False, indent=2))
