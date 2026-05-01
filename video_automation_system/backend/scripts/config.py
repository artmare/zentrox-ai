"""
Конфигурационный файл для AI Content Generator
Содержит настройки API и параметры генерации контента
"""

import os
from typing import Dict, Any

# =============================================================================
# API КЛЮЧИ
# =============================================================================

# YouTube Data API v3
# Получить ключ: https://console.cloud.google.com/apis/credentials
YOUTUBE_API_KEY = os.getenv('YOUTUBE_API_KEY', '')

# Abacus AI API
# Ключ автоматически подтягивается из переменной окружения
ABACUS_API_KEY = os.getenv('ABACUS_API_KEY', '')

# =============================================================================
# НАСТРОЙКИ YOUTUBE DATA API
# =============================================================================

YOUTUBE_CONFIG = {
    'max_results': 20,  # Максимум видео за один запрос
    'shorts_duration_max': 60,  # Максимальная длительность Shorts (секунды)
    'search_order': 'viewCount',  # Порядок сортировки: viewCount, relevance, date
    'published_after_days': 30,  # Анализировать видео за последние N дней
    'min_views': 10000,  # Минимальное количество просмотров для анализа
    'engagement_threshold': 0.03,  # Минимальный коэффициент вовлеченности (likes+comments)/views
}

# =============================================================================
# НАСТРОЙКИ ABACUS AI LLM
# =============================================================================

ABACUS_CONFIG = {
    'model': 'gpt-4',  # Модель для генерации контента
    'temperature_ideas': 0.8,  # Креативность для генерации идей
    'temperature_hooks': 0.9,  # Креативность для генерации хуков
    'temperature_scripts': 0.7,  # Креативность для генерации сценариев
    'max_tokens': 2000,  # Максимальное количество токенов в ответе
    'timeout': 30,  # Таймаут запроса (секунды)
}

# =============================================================================
# ПАРАМЕТРЫ ГЕНЕРАЦИИ СЦЕНАРИЕВ
# =============================================================================

SCRIPT_CONFIG = {
    # Количество генерируемых элементов
    'hooks_per_idea': 5,  # Количество вариантов хуков для каждой идеи
    'scenes_per_script': 5,  # Количество сцен в сценарии
    'ideas_per_generation': 3,  # Количество идей за одну генерацию
    
    # Параметры сцен
    'scene_duration_min': 2,  # Минимальная длительность сцены (секунды)
    'scene_duration_max': 3,  # Максимальная длительность сцены (секунды)
    'total_duration_target': 15,  # Целевая длительность видео (секунды)
    
    # Параметры по платформам
    'platform_settings': {
        'TikTok': {
            'style': 'aggressive',
            'pace': 'fast',
            'emotion_level': 'high',
            'hook_duration': 1,  # Секунды на хук
            'cta_position': 'end',
            'max_duration': 60,
        },
        'YouTube': {
            'style': 'value-driven',
            'pace': 'moderate',
            'emotion_level': 'medium',
            'hook_duration': 3,  # Секунды на хук
            'cta_position': 'middle_and_end',
            'max_duration': 60,
        },
        'Instagram': {
            'style': 'visual-first',
            'pace': 'fast',
            'emotion_level': 'high',
            'hook_duration': 1.5,
            'cta_position': 'end',
            'max_duration': 90,
        },
    },
}

# =============================================================================
# НАСТРОЙКИ БАЗЫ ДАННЫХ
# =============================================================================

DATABASE_CONFIG = {
    'host': os.getenv('DB_HOST', 'localhost'),
    'port': int(os.getenv('DB_PORT', '5432')),
    'database': os.getenv('DB_NAME', 'video_automation'),
    'user': os.getenv('DB_USER', 'postgres'),
    'password': os.getenv('DB_PASSWORD', ''),
    'table_users': 'users',
    'table_scripts': 'video_scripts',
    'table_trends': 'youtube_trends',
}

# =============================================================================
# НАСТРОЙКИ ЛОГИРОВАНИЯ
# =============================================================================

LOGGING_CONFIG = {
    'level': 'INFO',  # DEBUG, INFO, WARNING, ERROR, CRITICAL
    'format': '%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    'file': '/home/ubuntu/video_automation_system/logs/content_generator.log',
    'max_bytes': 10485760,  # 10MB
    'backup_count': 5,
}

# =============================================================================
# ЯЗЫКОВЫЕ НАСТРОЙКИ
# =============================================================================

SUPPORTED_LANGUAGES = {
    'ru': {'name': 'Russian', 'code': 'ru', 'region': 'RU'},
    'en': {'name': 'English', 'code': 'en', 'region': 'US'},
    'es': {'name': 'Spanish', 'code': 'es', 'region': 'ES'},
    'de': {'name': 'German', 'code': 'de', 'region': 'DE'},
    'fr': {'name': 'French', 'code': 'fr', 'region': 'FR'},
}

# =============================================================================
# ПРЕДОПРЕДЕЛЁННЫЕ НИШИ
# =============================================================================

POPULAR_NICHES = {
    'education': ['обучение', 'education', 'tutorial', 'how to'],
    'entertainment': ['развлечения', 'entertainment', 'funny', 'comedy'],
    'finance': ['финансы', 'finance', 'money', 'investing'],
    'health': ['здоровье', 'health', 'fitness', 'wellness'],
    'tech': ['технологии', 'technology', 'tech', 'gadgets'],
    'lifestyle': ['стиль жизни', 'lifestyle', 'vlog', 'daily'],
    'gaming': ['игры', 'gaming', 'gameplay', 'esports'],
    'motivation': ['мотивация', 'motivation', 'inspiration', 'success'],
}

# =============================================================================
# ФУНКЦИИ-ПОМОЩНИКИ
# =============================================================================

def validate_config() -> Dict[str, bool]:
    """
    Проверяет наличие всех необходимых настроек
    
    Returns:
        Dict с результатами валидации
    """
    validation_results = {
        'youtube_api_key': bool(YOUTUBE_API_KEY),
        'abacus_api_key': bool(ABACUS_API_KEY),
        'database_config': all([
            DATABASE_CONFIG['host'],
            DATABASE_CONFIG['database'],
            DATABASE_CONFIG['user'],
        ]),
    }
    
    return validation_results


def get_platform_config(platform: str) -> Dict[str, Any]:
    """
    Получает конфигурацию для конкретной платформы
    
    Args:
        platform: Название платформы (TikTok, YouTube, Instagram)
    
    Returns:
        Конфигурация платформы или конфигурация по умолчанию
    """
    return SCRIPT_CONFIG['platform_settings'].get(
        platform, 
        SCRIPT_CONFIG['platform_settings']['TikTok']
    )


def get_language_config(language_code: str) -> Dict[str, str]:
    """
    Получает конфигурацию для конкретного языка
    
    Args:
        language_code: Код языка (ru, en, es, etc.)
    
    Returns:
        Конфигурация языка или английский по умолчанию
    """
    return SUPPORTED_LANGUAGES.get(
        language_code.lower(), 
        SUPPORTED_LANGUAGES['en']
    )


if __name__ == '__main__':
    # Проверка конфигурации при запуске
    print("Проверка конфигурации AI Content Generator...")
    print("-" * 50)
    
    results = validate_config()
    for key, value in results.items():
        status = "✓" if value else "✗"
        print(f"{status} {key}: {'Настроено' if value else 'Не настроено'}")
    
    print("-" * 50)
    if all(results.values()):
        print("✓ Конфигурация полная и готова к использованию")
    else:
        print("✗ Требуется настройка недостающих параметров")
