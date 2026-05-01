#!/usr/bin/env python3
"""
=============================================================================
VIDEO CONTENT AI AGENT — ПОЛНЫЙ АВТОПИЛОТ
=============================================================================
Покрытие блоков:
  БЛОК 1:  Анализ ниши и монетизации
  БЛОК 2:  Стратегия монетизации (партнёрки, CTA)
  БЛОК 3:  Анализ трендов YouTube/TikTok
  БЛОК 4:  Генерация сценариев (5 сцен, хуки, эмоции)
  БЛОК 5:  Визуальные инструкции (cinematic, камера, смена 2-3с)
  БЛОК 6:  Субтитры (короткие, CAPS ключевые, синхронные)
  БЛОК 7:  AI-агент автопилот (полный цикл)
  БЛОК 8:  Multi-platform стратегия (TikTok vs YouTube Shorts)
  БЛОК 9:  Автопостинг инструкции + pipeline
  БЛОК 10: Анти-бан стратегия
  БЛОК 11: Стратегия роста (фазы)
  БЛОК 12: Аналитика
  БЛОК 13: Самообучение AI
  БЛОК 14: Полная архитектура

Инструменты для видео (на отдельном сервере):
  🎬 Stable Video Diffusion / AnimateDiff
  🗣 Edge TTS / Coqui XTTS
  🧩 FFmpeg + Python
  🤖 Abacus AI LLM (сценарии)
=============================================================================
"""

import os
import sys
import json
import uuid
import logging
import re
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional

import psycopg2
from psycopg2.extras import RealDictCursor

# =============================================================================
# КОНФИГУРАЦИЯ
# =============================================================================

LOG_DIR = '/home/ubuntu/video_automation_system/logs'
VIDEO_OUTPUT_DIR = '/home/ubuntu/video_automation_system/output/videos'
AUDIO_OUTPUT_DIR = '/home/ubuntu/video_automation_system/output/audio'
SUBTITLES_OUTPUT_DIR = '/home/ubuntu/video_automation_system/output/subtitles'

os.makedirs(LOG_DIR, exist_ok=True)
os.makedirs(VIDEO_OUTPUT_DIR, exist_ok=True)
os.makedirs(AUDIO_OUTPUT_DIR, exist_ok=True)
os.makedirs(SUBTITLES_OUTPUT_DIR, exist_ok=True)

log_file = os.path.join(LOG_DIR, f'agent_{datetime.now().strftime("%Y%m%d")}.log')
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s [%(levelname)s] %(name)s: %(message)s',
    handlers=[
        logging.FileHandler(log_file, encoding='utf-8'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger('VideoContentAIAgent')

# Платформенные конфиги (БЛОК 8)
PLATFORM_CONFIG = {
    'TikTok': {
        'style': 'aggressive',
        'pace': 'fast',
        'emotion_level': 'high',
        'hook_duration_sec': 1,
        'max_duration_sec': 60,
        'aspect_ratio': '9:16',
        'resolution': '1080x1920',
        'cta_position': 'end',
        'algorithm_focus': 'emotions, engagement, completion_rate',
        'subtitle_style': 'bold, centered, animated',
    },
    'YouTube Shorts': {
        'style': 'value-driven',
        'pace': 'moderate',
        'emotion_level': 'medium',
        'hook_duration_sec': 3,
        'max_duration_sec': 60,
        'aspect_ratio': '9:16',
        'resolution': '1080x1920',
        'cta_position': 'middle_and_end',
        'algorithm_focus': 'watch_time, CTR, retention',
        'subtitle_style': 'clean, readable, synced',
    },
}

# Типы контента и эмоции (БЛОК 4)
CONTENT_TYPES = ['provocation', 'fact', 'story', 'motivation', 'how-to', 'educational']
EMOTIONS = ['fear', 'curiosity', 'greed', 'inspiration', 'shock', 'humor']

# Фазы роста (БЛОК 11)
GROWTH_PHASES = {
    'testing': {'daily_videos': 3, 'strategy': 'test_hooks_and_niches', 'duration_days': 14},
    'scaling': {'daily_videos': 5, 'strategy': 'double_down_on_winners', 'duration_days': 30},
    'serial': {'daily_videos': 7, 'strategy': 'series_and_brands', 'duration_days': -1},
}


# =============================================================================
# УТИЛИТЫ БД
# =============================================================================

def get_database_url():
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        return db_url
    for env_path in ['/home/ubuntu/shared/.env', '/home/ubuntu/video_automation_system/nextjs_space/.env']:
        if os.path.exists(env_path):
            with open(env_path, 'r') as f:
                for line in f:
                    line = line.strip()
                    if line.startswith('DATABASE_URL='):
                        return line.split('=', 1)[1].strip().strip('"').strip("'")
    return None


def gen_id():
    return str(uuid.uuid4()).replace('-', '')[:25]


def llm_call(client, prompt, system_msg, temperature=0.7):
    """Вызов Abacus AI LLM с обработкой ошибок"""
    try:
        resp = client.evaluate_prompt(
            prompt=prompt,
            system_message=system_msg,
            llm_name="CLAUDE_V3_5_SONNET"
        )
        text = resp.content if hasattr(resp, 'content') else str(resp)
        return text
    except Exception as e:
        logger.error(f"LLM call failed: {e}")
        return None


def extract_json(text, is_array=True):
    """Извлечь JSON из текста LLM"""
    if not text:
        return [] if is_array else {}
    try:
        pattern = r'\[.*\]' if is_array else r'\{.*\}'
        match = re.search(pattern, text, re.DOTALL)
        if match:
            return json.loads(match.group())
    except json.JSONDecodeError as e:
        logger.warning(f"JSON parse error: {e}")
    return [] if is_array else {}


# =============================================================================
# БЛОК 1: АНАЛИЗ НИШИ
# =============================================================================

def analyze_niche(client, conn, user_id, niche, language):
    """Анализ ниши: аудитория, боли, вирусный потенциал, монетизация"""
    logger.info(f"  📊 БЛОК 1: Анализ ниши '{niche}'...")

    # Проверяем — есть ли свежий анализ (за последние 7 дней)
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT * FROM niche_analysis 
        WHERE user_id = %s AND niche = %s AND created_at > NOW() - INTERVAL '7 days'
        ORDER BY created_at DESC LIMIT 1
    """, (user_id, niche))
    existing = cur.fetchone()
    cur.close()

    if existing:
        logger.info(f"  ✓ Свежий анализ ниши найден (от {existing['created_at']})")
        return dict(existing)

    prompt = f"""Ты — эксперт по вирусному контенту и монетизации на YouTube Shorts и TikTok.

Проведи глубокий анализ ниши "{niche}" (язык: {language}):

1. АУДИТОРИЯ: кто смотрит, возраст, интересы, платформы
2. БОЛИ И ЖЕЛАНИЯ: топ-5 проблем аудитории и их желания
3. ВИРУСНЫЙ ПОТЕНЦИАЛ: оценка от 0 до 1, почему
4. КОНКУРЕНТЫ: топ-3 канала в нише, их стратегия
5. МОНЕТИЗАЦИЯ:
   - Партнёрские программы для этой ниши
   - Цифровые продукты для продажи
   - Способы привлечения трафика
   - Как встроить CTA в видео
6. ЛУЧШИЕ ТИПЫ КОНТЕНТА: что вирусится в этой нише

Ответ в JSON:
{{
  "audience_profile": {{"age_range": "...", "interests": [...], "platforms": [...], "behavior": "..."}},
  "pain_points": ["...", "...", "...", "...", "..."],
  "desires": ["...", "...", "..."],
  "viral_potential": 0.8,
  "viral_reasons": "...",
  "competitors": [{{"name": "...", "subscribers": "...", "strategy": "..."}}],
  "monetization_methods": [
    {{"type": "affiliate", "details": "...", "potential_revenue": "..."}},
    {{"type": "digital_product", "details": "...", "potential_revenue": "..."}},
    {{"type": "traffic", "details": "...", "potential_revenue": "..."}},
    {{"type": "personal_brand", "details": "...", "potential_revenue": "..."}}
  ],
  "best_content_types": ["provocation", "story", "how-to"],
  "recommended_emotions": ["curiosity", "inspiration"],
  "cta_templates": ["Подпишись чтобы...", "Ссылка в профиле..."]
}}"""

    text = llm_call(client, prompt, "Ты аналитик ниш и монетизации. Отвечай JSON.", temperature=0.6)
    data = extract_json(text, is_array=False)

    if data:
        cur = conn.cursor()
        cur.execute("""
            INSERT INTO niche_analysis (id, user_id, niche, audience_profile, pain_points, 
                viral_potential, monetization_methods, competitor_analysis, created_at)
            VALUES (%s, %s, %s, %s::jsonb, %s::jsonb, %s, %s::jsonb, %s::jsonb, NOW())
        """, (
            gen_id(), user_id, niche,
            json.dumps(data.get('audience_profile', {}), ensure_ascii=False),
            json.dumps(data.get('pain_points', []), ensure_ascii=False),
            data.get('viral_potential', 0.5),
            json.dumps(data.get('monetization_methods', []), ensure_ascii=False),
            json.dumps(data.get('competitors', []), ensure_ascii=False),
        ))
        conn.commit()
        cur.close()
        logger.info(f"  ✓ Анализ ниши сохранён в БД")

    return data


# =============================================================================
# БЛОК 3: АНАЛИЗ ТРЕНДОВ
# =============================================================================

def analyze_trends(client, conn, user_id, niche, language, platforms):
    """Анализ трендов: вирусные видео, хуки, структура, паттерны"""
    logger.info(f"  🔥 БЛОК 3: Анализ трендов для '{niche}'...")

    prompt = f"""Ты — аналитик вирусного контента на TikTok и YouTube Shorts.

Ниша: {niche}
Язык: {language}
Платформы: {', '.join(platforms)}

Проанализируй ТЕКУЩИЕ тренды. Для каждого тренда:

1. Найди 5 вирусных видео-концептов
2. Разбери ХУКИ — что цепляет в первые 1-3 секунды
3. СТРУКТУРА — как строится видео
4. ДЛИТЕЛЬНОСТЬ — оптимальная для виральности
5. СТИЛЬ — визуальный стиль, темп, эмоция
6. ПАТТЕРНЫ — что общего у вирусных видео в этой нише

Ответ в JSON:
[
  {{
    "title": "Название тренда/концепта",
    "platform": "TikTok|YouTube Shorts",
    "hook_type": "question|shock|story|fact|challenge",
    "hook_example": "Текст хука",
    "emotion": "fear|curiosity|greed|inspiration|shock|humor",
    "structure": "hook → problem → solution → cta",
    "optimal_duration_sec": 30,
    "visual_style": "cinematic|talking_head|text_overlay|mixed",
    "views_estimate": 500000,
    "engagement_rate": 0.08,
    "virality_pattern": "Описание паттерна вирусности",
    "video_url": null
  }}
]"""

    text = llm_call(client, prompt, "Ты аналитик трендов. JSON формат.", temperature=0.8)
    trends = extract_json(text, is_array=True)

    # Сохраняем тренды в БД
    saved = 0
    for trend in trends:
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO trends (id, platform, title, hook_type, emotion, views, 
                    engagement_rate, analyzed_at, video_url)
                VALUES (%s, %s, %s, %s, %s, %s, %s, NOW(), %s)
            """, (
                gen_id(),
                trend.get('platform', 'TikTok'),
                trend.get('title', ''),
                trend.get('hook_type', 'question'),
                trend.get('emotion', 'curiosity'),
                trend.get('views_estimate', 0),
                trend.get('engagement_rate', 0.0),
                trend.get('video_url'),
            ))
            conn.commit()
            cur.close()
            saved += 1
        except Exception as e:
            conn.rollback()
            logger.warning(f"  ⚠ Ошибка сохранения тренда: {e}")

    logger.info(f"  ✓ Найдено {len(trends)} трендов, сохранено {saved}")
    return trends


# =============================================================================
# БЛОК 12: АНАЛИТИКА + БЛОК 13: САМООБУЧЕНИЕ
# =============================================================================

def collect_analytics_and_learn(client, conn, user_id, niche):
    """Собираем аналитику + AI анализирует что работает"""
    logger.info(f"  📈 БЛОК 12-13: Аналитика и самообучение...")

    # Получаем все сценарии пользователя за последние 30 дней
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT vs.id, vs.title, vs.platform, vs.hook, vs.content_type, vs.emotion,
               vs.score, vs.created_at,
               va.views, va.likes, va.comments, va.shares, 
               va.watch_time_seconds, va.retention_rate, va.ctr, va.engagement_rate
        FROM video_scripts vs
        LEFT JOIN video_analytics va ON vs.id = va.script_id
        WHERE vs.user_id = %s AND vs.created_at > NOW() - INTERVAL '30 days'
        ORDER BY COALESCE(va.views, 0) DESC
    """, (user_id,))
    scripts = cur.fetchall()
    cur.close()

    if not scripts:
        logger.info("  ℹ Нет данных для аналитики (нет сценариев за 30 дней)")
        return {'top_performers': [], 'weak_performers': [], 'recommendations': []}

    # Формируем данные для AI-анализа
    scripts_data = []
    for s in scripts:
        scripts_data.append({
            'title': s['title'],
            'platform': s['platform'],
            'hook': s['hook'],
            'content_type': s['content_type'],
            'emotion': s['emotion'],
            'views': s.get('views', 0) or 0,
            'likes': s.get('likes', 0) or 0,
            'engagement_rate': s.get('engagement_rate', 0) or 0,
            'retention_rate': s.get('retention_rate', 0) or 0,
            'ctr': s.get('ctr', 0) or 0,
        })

    prompt = f"""Ты — AI-стратег контента. Проанализируй результаты видео пользователя.

Ниша: {niche}
Данные за последние 30 дней:
{json.dumps(scripts_data, ensure_ascii=False, indent=2)}

Проведи глубокий анализ:

1. ТОП УСПЕШНЫЕ: какие видео дали лучший результат и почему
2. СЛАБЫЕ: какие провалились и почему
3. ПАТТЕРНЫ УСПЕХА: что общего у лучших видео (хуки, эмоции, типы)
4. РЕКОМЕНДАЦИИ: конкретные действия для улучшения
5. СТРАТЕГИЯ: усилить успешные паттерны, удалить слабые

Ответ в JSON:
{{
  "top_performers": [{{"title": "...", "reason": "..."}}],
  "weak_performers": [{{"title": "...", "reason": "..."}}],
  "success_patterns": {{
    "best_hook_types": ["..."],
    "best_emotions": ["..."],
    "best_content_types": ["..."],
    "optimal_duration": 30,
    "best_platform": "..."
  }},
  "recommendations": [
    {{"action": "...", "priority": "high|medium|low", "expected_impact": "..."}}
  ],
  "strategy_update": {{
    "content_mix": {{"provocation": 0.3, "story": 0.4, "how-to": 0.3}},
    "emotion_focus": ["curiosity", "inspiration"],
    "hook_style": "...",
    "posting_frequency_change": 0
  }}
}}"""

    text = llm_call(client, prompt, "Ты AI-стратег контента. Отвечай JSON.", temperature=0.5)
    analysis = extract_json(text, is_array=False)

    # Сохраняем стратегию в БД
    if analysis:
        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO strategy_logs (id, user_id, strategy_type, analysis, 
                    recommendations, applied, created_at)
                VALUES (%s, %s, 'daily_learning', %s::jsonb, %s::jsonb, false, NOW())
            """, (
                gen_id(), user_id,
                json.dumps(analysis, ensure_ascii=False),
                json.dumps(analysis.get('recommendations', []), ensure_ascii=False),
            ))
            conn.commit()
            cur.close()
            logger.info(f"  ✓ Стратегия самообучения сохранена")
        except Exception as e:
            conn.rollback()
            logger.warning(f"  ⚠ Ошибка сохранения стратегии: {e}")

    return analysis


# =============================================================================
# БЛОК 11: ОПРЕДЕЛЕНИЕ ФАЗЫ РОСТА
# =============================================================================

def determine_growth_phase(conn, user_id):
    """Определяем фазу роста пользователя"""
    cur = conn.cursor(cursor_factory=RealDictCursor)

    # Считаем дни с первого сценария
    cur.execute("""
        SELECT MIN(created_at) as first_script, COUNT(*) as total_scripts
        FROM video_scripts WHERE user_id = %s
    """, (user_id,))
    stats = cur.fetchone()
    cur.close()

    if not stats or not stats['first_script']:
        return 'testing'

    days_active = (datetime.now() - stats['first_script']).days
    total_scripts = stats['total_scripts'] or 0

    if days_active < 14 or total_scripts < 20:
        return 'testing'
    elif days_active < 44 or total_scripts < 100:
        return 'scaling'
    else:
        return 'serial'


# =============================================================================
# БЛОК 4+5+6+8: ГЕНЕРАЦИЯ СЦЕНАРИЕВ (ПОЛНАЯ)
# =============================================================================

def generate_full_scripts(client, conn, user_id, niche, language, platforms,
                          videos_per_day, trends, niche_data, learning_data,
                          monetization_settings, content_strategy, growth_phase):
    """
    Генерация полных сценариев:
    - 5 вариантов хуков → лучший
    - 5 сцен (хук, завязка, усиление, кульминация, CTA)
    - Визуальные описания (cinematic, камера, смена 2-3с)
    - Субтитры (короткие, CAPS, синхронные)
    - Адаптация: TikTok (агрессивный) vs YouTube Shorts (ценность)
    - Встроенная монетизация и CTA
    """
    logger.info(f"  🎬 БЛОК 4-8: Генерация {videos_per_day} сценариев для {platforms}...")

    # Подготовка контекста
    trends_text = "\n".join([
        f"- {t.get('title', 'N/A')} (хук: {t.get('hook_type', '?')}, эмоция: {t.get('emotion', '?')}, "
        f"стиль: {t.get('visual_style', '?')})"
        for t in (trends or [])[:7]
    ]) or "Нет данных о трендах"

    # Получаем историю успешных сценариев
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT title, hook, content_type, emotion, platform
        FROM video_scripts WHERE user_id = %s AND status IN ('published', 'approved')
        ORDER BY score DESC NULLS LAST, created_at DESC LIMIT 5
    """, (user_id,))
    past_success = cur.fetchall()
    cur.close()

    past_text = "\n".join([
        f"- [{s['platform']}] {s['title']} (хук: {s['hook'][:50]}..., тип: {s['content_type']})"
        for s in past_success
    ]) or "Новый пользователь — нет истории"

    # Фильтры из самообучения
    success_patterns = {}
    if learning_data and isinstance(learning_data, dict):
        success_patterns = learning_data.get('success_patterns', {})

    patterns_text = ""
    if success_patterns:
        patterns_text = f"""
ДАННЫЕ САМООБУЧЕНИЯ (БЛОК 13 — УСИЛИТЬ успешные паттерны):
- Лучшие типы хуков: {success_patterns.get('best_hook_types', [])}
- Лучшие эмоции: {success_patterns.get('best_emotions', [])}
- Лучшие типы контента: {success_patterns.get('best_content_types', [])}
- Оптимальная длительность: {success_patterns.get('optimal_duration', 30)}с
"""

    # Монетизация
    monet_text = ""
    if monetization_settings:
        monet = monetization_settings if isinstance(monetization_settings, dict) else {}
        monet_text = f"Монетизация: {json.dumps(monet, ensure_ascii=False)}"
    if niche_data and isinstance(niche_data, dict):
        methods = niche_data.get('monetization_methods', [])
        cta_templates = niche_data.get('cta_templates', [])
        if methods:
            monet_text += f"\nМетоды монетизации ниши: {json.dumps(methods, ensure_ascii=False)}"
        if cta_templates:
            monet_text += f"\nШаблоны CTA: {cta_templates}"

    phase_config = GROWTH_PHASES.get(growth_phase, GROWTH_PHASES['testing'])

    generated = []

    for video_num in range(1, videos_per_day + 1):
        for platform in platforms:
            plat_config = PLATFORM_CONFIG.get(platform, PLATFORM_CONFIG['TikTok'])

            prompt = f"""Ты — элитный сценарист вирусных коротких видео для {platform}.

═══════════════════════════════════════════════════
КОНТЕКСТ
═══════════════════════════════════════════════════
Ниша: {niche}
Язык: {language}
Платформа: {platform}
Фаза роста: {growth_phase} (стратегия: {phase_config['strategy']})
Стратегия контента: {content_strategy}
Видео #{video_num} из {videos_per_day}

ТРЕНДЫ:
{trends_text}

УСПЕШНЫЕ ВИДЕО ПОЛЬЗОВАТЕЛЯ:
{past_text}
{patterns_text}
МОНЕТИЗАЦИЯ:
{monet_text}

═══════════════════════════════════════════════════
ТРЕБОВАНИЯ К ПЛАТФОРМЕ {platform.upper()}
═══════════════════════════════════════════════════
- Стиль: {plat_config['style']}
- Темп: {plat_config['pace']}
- Уровень эмоций: {plat_config['emotion_level']}
- Хук: первые {plat_config['hook_duration_sec']}с
- Макс длительность: {plat_config['max_duration_sec']}с
- Фокус алгоритма: {plat_config['algorithm_focus']}
- Субтитры: {plat_config['subtitle_style']}

═══════════════════════════════════════════════════
ЗАДАНИЕ
═══════════════════════════════════════════════════

1. ВЫБЕРИ ТИП КОНТЕНТА: провокация / факт / история / мотивация / how-to
2. ВЫБЕРИ ЭМОЦИЮ: страх / любопытство / жадность / вдохновение / шок / юмор
3. СГЕНЕРИРУЙ 5 ВАРИАНТОВ ХУКОВ — выбери лучший
4. СОЗДАЙ СЦЕНАРИЙ из 5 СЦЕН:
   - Сцена 1: ХУК (цепляет за {plat_config['hook_duration_sec']}с)
   - Сцена 2: ЗАВЯЗКА (раскрытие темы)
   - Сцена 3: УСИЛЕНИЕ (нагнетание)
   - Сцена 4: КУЛЬМИНАЦИЯ (пик)
   - Сцена 5: CTA (призыв к действию + монетизация)

5. ДЛЯ КАЖДОЙ СЦЕНЫ:
   - Текст озвучки (точный текст для TTS)
   - Визуал (cinematic стиль, движение камеры, смена каждые 2-3с)
   - Субтитры (короткие фразы, КЛЮЧЕВЫЕ СЛОВА В CAPS)
   - Тайминг в секундах
   - Переход (cut / fade / zoom / whip)

6. ИНСТРУКЦИИ ПО ПУБЛИКАЦИИ

Ответ СТРОГО в JSON:
{{
  "title": "Название видео",
  "platform": "{platform}",
  "content_type": "provocation|fact|story|motivation|how-to",
  "emotion": "fear|curiosity|greed|inspiration|shock|humor",
  "all_hooks": [
    "Хук вариант 1",
    "Хук вариант 2",
    "Хук вариант 3",
    "Хук вариант 4",
    "Хук вариант 5"
  ],
  "best_hook": "Лучший хук",
  "total_duration_seconds": 30,
  "full_script": {{
    "scenes": [
      {{
        "scene_number": 1,
        "scene_name": "ХУК",
        "voiceover_text": "Точный текст озвучки для TTS",
        "visual_description": "Cinematic: [описание кадра, движение камеры slow zoom in, освещение]",
        "subtitle_text": "КОРОТКИЕ субтитры с CAPS",
        "duration_seconds": 3,
        "transition": "cut",
        "camera_movement": "slow zoom in",
        "mood": "tension"
      }},
      {{
        "scene_number": 2,
        "scene_name": "ЗАВЯЗКА",
        "voiceover_text": "...",
        "visual_description": "Cinematic: [описание + камера pan right]",
        "subtitle_text": "...",
        "duration_seconds": 6,
        "transition": "whip",
        "camera_movement": "pan right",
        "mood": "curiosity"
      }},
      {{
        "scene_number": 3,
        "scene_name": "УСИЛЕНИЕ",
        "voiceover_text": "...",
        "visual_description": "Cinematic: [описание + быстрые cuts]",
        "subtitle_text": "...",
        "duration_seconds": 7,
        "transition": "cut",
        "camera_movement": "dynamic tracking",
        "mood": "tension_rising"
      }},
      {{
        "scene_number": 4,
        "scene_name": "КУЛЬМИНАЦИЯ",
        "voiceover_text": "...",
        "visual_description": "Cinematic: [описание + dramatic zoom]",
        "subtitle_text": "...",
        "duration_seconds": 7,
        "transition": "fade",
        "camera_movement": "dramatic zoom",
        "mood": "peak_emotion"
      }},
      {{
        "scene_number": 5,
        "scene_name": "CTA",
        "voiceover_text": "... Подпишись / Ссылка в профиле / ...",
        "visual_description": "Cinematic: [CTA визуал + лого/текст]",
        "subtitle_text": "ПОДПИШИСЬ ...",
        "duration_seconds": 5,
        "transition": "fade_out",
        "camera_movement": "static with text overlay",
        "mood": "action"
      }}
    ]
  }},
  "visual_style": {{
    "overall": "cinematic dark/bright/colorful",
    "color_palette": ["#hex1", "#hex2"],
    "font": "bold sans-serif",
    "effects": ["motion blur", "color grading"],
    "scene_change_interval_sec": 2.5
  }},
  "subtitles": [
    {{"time_start": 0, "time_end": 3, "text": "СУБТИТР сцены 1"}},
    {{"time_start": 3, "time_end": 9, "text": "СУБТИТР сцены 2"}},
    {{"time_start": 9, "time_end": 16, "text": "СУБТИТР сцены 3"}},
    {{"time_start": 16, "time_end": 23, "text": "СУБТИТР сцены 4"}},
    {{"time_start": 23, "time_end": 28, "text": "СУБТИТР сцены 5"}}
  ],
  "monetization_cta": "Конкретный CTA для монетизации",
  "publishing_instructions": {{
    "best_posting_time": "18:00-21:00 MSK",
    "hashtags": ["#tag1", "#tag2", "#tag3"],
    "caption": "Текст описания",
    "music_suggestion": "Тип музыки / конкретный трек",
    "thumbnail_description": "Описание превью для генерации",
    "seo_keywords": ["ключ1", "ключ2"]
  }},
  "video_generation_instructions": {{
    "tts_text": "Полный текст для озвучки через Edge TTS / Coqui XTTS",
    "tts_voice": "ru-RU-DmitryNeural",
    "tts_speed": 1.1,
    "animatediff_prompts": [
      "scene 1 prompt for video generation",
      "scene 2 prompt for video generation",
      "scene 3 prompt for video generation",
      "scene 4 prompt for video generation",
      "scene 5 prompt for video generation"
    ],
    "ffmpeg_assembly_notes": "Инструкции по сборке видео через FFmpeg"
  }}
}}"""

            text = llm_call(client, prompt,
                "Ты элитный сценарист вирусных видео. Отвечай ТОЛЬКО валидным JSON.",
                temperature=0.85)
            script_data = extract_json(text, is_array=False)

            if not script_data or 'title' not in script_data:
                logger.warning(f"  ⚠ Не удалось сгенерировать сценарий #{video_num} для {platform}")
                continue

            # Сохраняем в БД
            try:
                cur = conn.cursor()
                cur.execute("""
                    INSERT INTO video_scripts 
                        (id, user_id, platform, title, hook, content_type, emotion, 
                         full_script, status, monetization_cta, subtitles, visual_style,
                         publishing_instructions, score, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s, %s, %s, %s::jsonb, 'draft', %s, 
                            %s::jsonb, %s::jsonb, %s::jsonb, 0, NOW(), NOW())
                """, (
                    gen_id(), user_id, platform,
                    script_data.get('title', 'Без названия'),
                    script_data.get('best_hook', script_data.get('all_hooks', [''])[0] if script_data.get('all_hooks') else ''),
                    script_data.get('content_type', 'educational'),
                    script_data.get('emotion', 'inspiring'),
                    json.dumps(script_data.get('full_script', {}), ensure_ascii=False),
                    script_data.get('monetization_cta', ''),
                    json.dumps(script_data.get('subtitles', []), ensure_ascii=False),
                    json.dumps(script_data.get('visual_style', {}), ensure_ascii=False),
                    json.dumps(script_data.get('publishing_instructions', {}), ensure_ascii=False),
                ))
                conn.commit()
                cur.close()

                generated.append(script_data)
                logger.info(f"  ✓ [{platform}] Сценарий #{video_num}: '{script_data.get('title', 'N/A')}'")

            except Exception as e:
                conn.rollback()
                logger.error(f"  ✗ Ошибка сохранения сценария: {e}")

    logger.info(f"  ✓ Всего сгенерировано: {len(generated)} сценариев")
    return generated


# =============================================================================
# БЛОК 10: АНТИ-БАН СТРАТЕГИЯ
# =============================================================================

def get_anti_ban_config(conn, user_id):
    """Получаем конфиг анти-бана для пользователя"""
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT proxy_config, account_warmup_done, daily_post_limit
        FROM user_settings WHERE user_id = %s
    """, (user_id,))
    settings = cur.fetchone()
    cur.close()

    if not settings:
        return {
            'use_proxy': False,
            'delay_between_posts_min': 30,
            'delay_between_posts_max': 120,
            'daily_limit': 3,
            'warmup_done': False,
            'human_behavior': True,
            'rotate_ip': False,
        }

    proxy = settings.get('proxy_config') or {}
    return {
        'use_proxy': bool(proxy.get('enabled', False)),
        'proxy_url': proxy.get('url', ''),
        'delay_between_posts_min': proxy.get('delay_min', 30),
        'delay_between_posts_max': proxy.get('delay_max', 120),
        'daily_limit': settings.get('daily_post_limit', 3),
        'warmup_done': settings.get('account_warmup_done', False),
        'human_behavior': True,
        'rotate_ip': proxy.get('rotate', False),
    }


# =============================================================================
# БЛОК 9: ПОДГОТОВКА К ПУБЛИКАЦИИ
# =============================================================================

def prepare_publishing_queue(conn, user_id, scripts, anti_ban_config):
    """Создаём очередь публикаций с расписанием (анти-бан)"""
    logger.info(f"  📤 БЛОК 9: Подготовка очереди публикаций...")

    import random
    base_time = datetime.now().replace(hour=10, minute=0, second=0, microsecond=0)
    delay_min = anti_ban_config.get('delay_between_posts_min', 30)
    delay_max = anti_ban_config.get('delay_between_posts_max', 120)
    daily_limit = anti_ban_config.get('daily_limit', 3)

    queued = 0
    for idx, script in enumerate(scripts[:daily_limit]):
        # Распределяем публикации по времени
        offset_minutes = sum(random.randint(delay_min, delay_max) for _ in range(idx))
        scheduled_time = base_time + timedelta(minutes=offset_minutes)

        platform = script.get('platform', 'TikTok')
        pub_instructions = script.get('publishing_instructions', {})

        try:
            cur = conn.cursor()
            cur.execute("""
                INSERT INTO publications 
                    (id, video_id, user_id, platform, status, scheduled_at,
                     caption, hashtags, created_at)
                VALUES (%s, NULL, %s, %s, 'scheduled', %s, %s, %s::jsonb, NOW())
            """, (
                gen_id(), user_id, platform, scheduled_time,
                pub_instructions.get('caption', ''),
                json.dumps(pub_instructions.get('hashtags', []), ensure_ascii=False),
            ))
            conn.commit()
            cur.close()
            queued += 1
        except Exception as e:
            conn.rollback()
            logger.warning(f"  ⚠ Ошибка создания публикации: {e}")

    logger.info(f"  ✓ Запланировано {queued} публикаций (лимит: {daily_limit}/день)")
    return queued


# =============================================================================
# ГЛАВНАЯ ФУНКЦИЯ — ОБРАБОТКА ОДНОГО ПОЛЬЗОВАТЕЛЯ
# =============================================================================

def process_user(conn, user, client):
    """Полный цикл AI-агента для одного пользователя (ВСЕ БЛОКИ)"""
    user_id = user['id']
    niche = user.get('niche', 'motivation')
    language = user.get('language', 'russian')
    platforms_raw = user.get('platforms', '[]')
    if isinstance(platforms_raw, str):
        try:
            platforms = json.loads(platforms_raw)
        except:
            platforms = ['TikTok', 'YouTube Shorts']
    elif isinstance(platforms_raw, list):
        platforms = platforms_raw
    else:
        platforms = ['TikTok', 'YouTube Shorts']

    if not platforms:
        platforms = ['TikTok', 'YouTube Shorts']

    videos_per_day = user.get('videos_per_day', 3)
    content_strategy = user.get('content_strategy', 'mixed')
    monetization_settings = user.get('monetization_settings') or {}

    logger.info(f"  Ниша: {niche} | Язык: {language} | Платформы: {platforms}")
    logger.info(f"  Видео/день: {videos_per_day} | Стратегия: {content_strategy}")

    # Проверка — уже есть контент на сегодня?
    cur = conn.cursor()
    cur.execute("""
        SELECT COUNT(*) FROM video_scripts
        WHERE user_id = %s AND DATE(created_at) = CURRENT_DATE
    """, (user_id,))
    today_count = cur.fetchone()[0]
    cur.close()

    if today_count > 0:
        logger.info(f"  ⊘ Контент на сегодня уже сгенерирован ({today_count} скриптов). Пропуск.")
        return {'status': 'skipped', 'reason': 'content_exists', 'existing_count': today_count}

    result = {
        'user_id': user_id,
        'user_name': user.get('name', 'N/A'),
        'niche': niche,
        'platforms': platforms,
    }

    # БЛОК 11: Определяем фазу роста
    growth_phase = determine_growth_phase(conn, user_id)
    logger.info(f"  🚀 Фаза роста: {growth_phase}")
    result['growth_phase'] = growth_phase

    # БЛОК 1: Анализ ниши
    niche_data = analyze_niche(client, conn, user_id, niche, language)
    result['niche_analysis'] = 'done' if niche_data else 'failed'

    # БЛОК 3: Анализ трендов
    trends = analyze_trends(client, conn, user_id, niche, language, platforms)
    result['trends_found'] = len(trends)

    # БЛОК 12-13: Аналитика + самообучение
    learning_data = collect_analytics_and_learn(client, conn, user_id, niche)
    result['learning'] = 'done' if learning_data else 'no_data'

    # БЛОК 4-8: Генерация сценариев (с визуалом, субтитрами, монетизацией)
    scripts = generate_full_scripts(
        client, conn, user_id, niche, language, platforms,
        videos_per_day, trends, niche_data, learning_data,
        monetization_settings, content_strategy, growth_phase
    )
    result['scripts_generated'] = len(scripts)

    # БЛОК 10: Анти-бан конфиг
    anti_ban = get_anti_ban_config(conn, user_id)
    result['anti_ban'] = {
        'proxy': anti_ban.get('use_proxy', False),
        'daily_limit': anti_ban.get('daily_limit', 3),
        'warmup': anti_ban.get('warmup_done', False),
    }

    # БЛОК 9: Подготовка публикаций
    queued = prepare_publishing_queue(conn, user_id, scripts, anti_ban)
    result['publications_queued'] = queued

    result['status'] = 'success'
    result['generated_at'] = datetime.now().isoformat()
    return result


# =============================================================================
# ТОЧКА ВХОДА: run_daily_generation()
# =============================================================================

def run_daily_generation():
    """
    ═══════════════════════════════════════════════════════════════
    VIDEO CONTENT AI AGENT — ЕЖЕДНЕВНЫЙ АВТОПИЛОТ
    ═══════════════════════════════════════════════════════════════
    Для каждого пользователя с autopilot_enabled=true:
      БЛОК 1:  Анализ ниши → аудитория, боли, монетизация
      БЛОК 2:  Встраивание монетизации и CTA в сценарии
      БЛОК 3:  Анализ трендов YouTube/TikTok
      БЛОК 4:  Генерация сценариев (5 сцен, 5 хуков)
      БЛОК 5:  Визуальные инструкции (cinematic, камера)
      БЛОК 6:  Субтитры (CAPS, синхронные)
      БЛОК 7:  Полный цикл автопилота
      БЛОК 8:  Адаптация TikTok vs YouTube Shorts
      БЛОК 9:  Очередь публикаций
      БЛОК 10: Анти-бан стратегия
      БЛОК 11: Фаза роста (testing → scaling → serial)
      БЛОК 12: Аналитика
      БЛОК 13: Самообучение AI
    ═══════════════════════════════════════════════════════════════
    """
    start_time = datetime.now()
    logger.info("=" * 70)
    logger.info("🤖 VIDEO CONTENT AI AGENT — ЗАПУСК АВТОПИЛОТА")
    logger.info(f"⏰ {start_time.isoformat()}")
    logger.info("=" * 70)

    # DATABASE_URL
    db_url = get_database_url()
    if not db_url:
        logger.error("❌ DATABASE_URL не найден!")
        return {'status': 'error', 'error': 'DATABASE_URL not found'}

    # ABACUS_API_KEY
    abacus_api_key = os.environ.get('ABACUS_API_KEY', '')
    if not abacus_api_key:
        logger.error("❌ ABACUS_API_KEY не найден!")
        return {'status': 'error', 'error': 'ABACUS_API_KEY not found'}

    # Подключаемся к БД
    try:
        conn = psycopg2.connect(db_url)
        logger.info("✓ Подключение к PostgreSQL установлено")
    except Exception as e:
        logger.error(f"❌ Ошибка подключения к БД: {e}")
        return {'status': 'error', 'error': f'DB error: {e}'}

    # Инициализируем Abacus AI
    from abacusai import ApiClient
    client = ApiClient(api_key=abacus_api_key)
    logger.info("✓ Abacus AI LLM подключён")

    # Получаем активных пользователей
    cur = conn.cursor(cursor_factory=RealDictCursor)
    cur.execute("""
        SELECT u.id, u.name, u.email,
               us.niche, us.language, us.platforms, us.videos_per_day,
               us.content_strategy, us.schedule_time, us.monetization_settings,
               us.growth_phase, us.proxy_config, us.account_warmup_done,
               us.daily_post_limit
        FROM users u
        JOIN user_settings us ON u.id = us.user_id
        WHERE us.autopilot_enabled = true
    """)
    active_users = cur.fetchall()
    cur.close()

    logger.info(f"👥 Активных пользователей: {len(active_users)}")

    if not active_users:
        logger.info("ℹ Нет пользователей с autopilot_enabled=true")
        conn.close()
        return {
            'status': 'success',
            'message': 'No active users',
            'users_processed': 0,
            'started_at': start_time.isoformat(),
            'finished_at': datetime.now().isoformat(),
        }

    # Обрабатываем каждого пользователя
    results = []
    success = 0
    errors = 0

    for user in active_users:
        user_name = user.get('name', 'N/A')
        user_id = user['id']
        logger.info(f"\n{'═' * 60}")
        logger.info(f"👤 ПОЛЬЗОВАТЕЛЬ: {user_name} (ID: {user_id})")
        logger.info(f"{'═' * 60}")

        try:
            result = process_user(conn, user, client)
            results.append(result)

            if result.get('status') == 'success':
                success += 1
                logger.info(f"✅ {user_name}: {result.get('scripts_generated', 0)} сценариев, "
                          f"{result.get('publications_queued', 0)} публикаций")
            elif result.get('status') == 'skipped':
                logger.info(f"⊘ {user_name}: пропущен — {result.get('reason', '?')}")
            else:
                errors += 1

        except Exception as e:
            errors += 1
            logger.error(f"❌ ОШИБКА для {user_name}: {e}")
            results.append({
                'status': 'error',
                'user_id': user_id,
                'user_name': user_name,
                'error': str(e)
            })
            try:
                conn.rollback()
            except:
                pass
            # Продолжаем для остальных пользователей (БЛОК 7: отказоустойчивость)
            continue

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
        'success_count': success,
        'error_count': errors,
        'blocks_executed': [
            'BLOCK_1_NICHE_ANALYSIS',
            'BLOCK_2_MONETIZATION',
            'BLOCK_3_TREND_ANALYSIS',
            'BLOCK_4_SCRIPT_GENERATION',
            'BLOCK_5_VISUAL_INSTRUCTIONS',
            'BLOCK_6_SUBTITLES',
            'BLOCK_7_AI_AGENT_AUTOPILOT',
            'BLOCK_8_MULTI_PLATFORM',
            'BLOCK_9_PUBLISHING_QUEUE',
            'BLOCK_10_ANTI_BAN',
            'BLOCK_11_GROWTH_STRATEGY',
            'BLOCK_12_ANALYTICS',
            'BLOCK_13_SELF_LEARNING',
        ],
        'results': results,
    }

    logger.info(f"\n{'═' * 70}")
    logger.info(f"🏁 ИТОГИ VIDEO CONTENT AI AGENT")
    logger.info(f"{'═' * 70}")
    logger.info(f"Пользователей: {len(active_users)} | Успешно: {success} | Ошибки: {errors}")
    logger.info(f"Длительность: {duration:.1f}с")
    logger.info(f"{'═' * 70}")

    # Сохраняем отчёт
    report_path = os.path.join(LOG_DIR, f'report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json')
    with open(report_path, 'w', encoding='utf-8') as f:
        json.dump(summary, f, ensure_ascii=False, indent=2)
    logger.info(f"📄 Отчёт: {report_path}")

    return summary


# =============================================================================
# CLI
# =============================================================================

if __name__ == '__main__':
    result = run_daily_generation()
    print(json.dumps(result, ensure_ascii=False, indent=2))
