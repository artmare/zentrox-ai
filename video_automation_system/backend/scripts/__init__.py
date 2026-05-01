"""
AI Content Generator
Автоматическая генерация видео-сценариев для социальных сетей

Модули:
- config: Конфигурация и настройки
- trend_analyzer: Анализ трендов YouTube
- script_generator: Генерация сценариев через Abacus AI LLM
- content_engine: Главный оркестратор
"""

__version__ = '1.0.0'
__author__ = 'AI Content Generator Team'

# Импорт основных функций для удобного доступа
from .trend_analyzer import analyze_youtube_trends, YouTubeTrendAnalyzer
from .script_generator import (
    generate_video_ideas,
    generate_hooks,
    generate_script,
    ScriptGenerator
)
from .content_engine import generate_daily_content, ContentEngine

__all__ = [
    'analyze_youtube_trends',
    'YouTubeTrendAnalyzer',
    'generate_video_ideas',
    'generate_hooks',
    'generate_script',
    'ScriptGenerator',
    'generate_daily_content',
    'ContentEngine',
]
