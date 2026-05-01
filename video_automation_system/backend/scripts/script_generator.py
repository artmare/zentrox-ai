"""
Генератор видео-сценариев через Abacus AI LLM API
Создаёт идеи, хуки и детальные сценарии для видео-контента
"""

import json
import logging
from typing import List, Dict, Any, Optional
from datetime import datetime

try:
    import abacusai
except ImportError:
    print("ОШИБКА: Установите abacusai")
    print("pip install abacusai")

from config import (
    ABACUS_CONFIG, 
    SCRIPT_CONFIG, 
    get_platform_config,
    get_language_config
)

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class ScriptGenerator:
    """
    Класс для генерации видео-сценариев с помощью Abacus AI LLM
    """
    
    def __init__(self):
        """
        Инициализация генератора сценариев
        """
        try:
            self.client = abacusai.ApiClient()
            logger.info("Abacus AI клиент успешно инициализирован")
        except Exception as e:
            logger.error(f"Ошибка инициализации Abacus AI: {e}")
            raise
    
    def generate_video_ideas(
        self,
        niche: str,
        language: str,
        trends: List[Dict[str, Any]],
        past_successful_scripts: Optional[List[Dict[str, Any]]] = None,
        num_ideas: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Генерация идей для видео на основе трендов и истории
        
        Args:
            niche: Ниша контента
            language: Код языка
            trends: Список трендов из YouTube
            past_successful_scripts: История успешных сценариев (опционально)
            num_ideas: Количество идей для генерации
        
        Returns:
            Список идей для видео
        """
        num_ideas = num_ideas or SCRIPT_CONFIG['ideas_per_generation']
        
        logger.info(f"Генерация {num_ideas} идей для ниши: {niche}")
        
        # Формирование промпта
        prompt = self._build_ideas_prompt(
            niche, language, trends, past_successful_scripts, num_ideas
        )
        
        try:
            # Вызов LLM
            response = self._call_llm(
                prompt=prompt,
                temperature=ABACUS_CONFIG['temperature_ideas'],
                system_message="Ты эксперт по созданию вирусного видео-контента для соцсетей."
            )
            
            # Парсинг ответа
            ideas = self._parse_ideas_response(response)
            
            logger.info(f"Успешно сгенерировано {len(ideas)} идей")
            
            return ideas
            
        except Exception as e:
            logger.error(f"Ошибка генерации идей: {e}")
            raise
    
    def generate_hooks(
        self,
        idea: Dict[str, Any],
        num_hooks: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Генерация вариантов хуков для идеи
        
        Args:
            idea: Идея для видео
            num_hooks: Количество вариантов хуков
        
        Returns:
            Список хуков с оценкой качества
        """
        num_hooks = num_hooks or SCRIPT_CONFIG['hooks_per_idea']
        
        logger.info(f"Генерация {num_hooks} хуков для идеи: {idea.get('title', 'Без названия')}")
        
        # Формирование промпта
        prompt = self._build_hooks_prompt(idea, num_hooks)
        
        try:
            # Вызов LLM
            response = self._call_llm(
                prompt=prompt,
                temperature=ABACUS_CONFIG['temperature_hooks'],
                system_message="Ты эксперт по созданию захватывающих хуков для видео в соцсетях."
            )
            
            # Парсинг ответа
            hooks = self._parse_hooks_response(response)
            
            # Выбор лучшего хука
            best_hook = self._select_best_hook(hooks)
            
            logger.info(f"Лучший хук: {best_hook.get('text', '')[:50]}...")
            
            return hooks, best_hook
            
        except Exception as e:
            logger.error(f"Ошибка генерации хуков: {e}")
            raise
    
    def generate_script(
        self,
        idea: Dict[str, Any],
        hook: Dict[str, Any],
        platform: str = 'TikTok',
        language: str = 'ru',
        num_scenes: Optional[int] = None
    ) -> Dict[str, Any]:
        """
        Генерация детального сценария видео
        
        Args:
            idea: Идея для видео
            hook: Выбранный хук
            platform: Платформа (TikTok, YouTube, Instagram)
            language: Код языка
            num_scenes: Количество сцен
        
        Returns:
            Полный JSON-сценарий с деталями
        """
        num_scenes = num_scenes or SCRIPT_CONFIG['scenes_per_script']
        
        logger.info(f"Генерация сценария для платформы: {platform}")
        
        # Получение настроек платформы
        platform_config = get_platform_config(platform)
        
        # Формирование промпта
        prompt = self._build_script_prompt(
            idea, hook, platform, platform_config, language, num_scenes
        )
        
        try:
            # Вызов LLM
            response = self._call_llm(
                prompt=prompt,
                temperature=ABACUS_CONFIG['temperature_scripts'],
                system_message=f"Ты профессиональный сценарист для {platform}, специализирующийся на коротких вирусных видео."
            )
            
            # Парсинг ответа
            script = self._parse_script_response(response, idea, hook, platform)
            
            logger.info(f"Сценарий успешно сгенерирован: {len(script.get('scenes', []))} сцен")
            
            return script
            
        except Exception as e:
            logger.error(f"Ошибка генерации сценария: {e}")
            raise
    
    # =========================================================================
    # ВСПОМОГАТЕЛЬНЫЕ МЕТОДЫ
    # =========================================================================
    
    def _call_llm(
        self,
        prompt: str,
        temperature: float,
        system_message: str
    ) -> str:
        """
        Вызов Abacus AI LLM
        
        Args:
            prompt: Текст промпта
            temperature: Параметр креативности
            system_message: Системное сообщение
        
        Returns:
            Ответ от LLM
        """
        try:
            # Используем chat completion API
            messages = [
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ]
            
            # Вызов через Abacus AI SDK
            # Примечание: Здесь используется общий метод для работы с LLM
            # В зависимости от конкретной настройки Abacus AI, метод может отличаться
            
            response = self.client.create_chat_llm_response(
                messages=messages,
                temperature=temperature,
                max_tokens=ABACUS_CONFIG['max_tokens']
            )
            
            return response.get('content', '')
            
        except Exception as e:
            logger.error(f"Ошибка вызова LLM: {e}")
            raise
    
    def _build_ideas_prompt(
        self,
        niche: str,
        language: str,
        trends: List[Dict[str, Any]],
        past_scripts: Optional[List[Dict[str, Any]]],
        num_ideas: int
    ) -> str:
        """
        Построение промпта для генерации идей
        """
        lang_config = get_language_config(language)
        
        prompt = f"""Сгенерируй {num_ideas} идей для вирусных коротких видео в нише "{niche}" на языке {lang_config['name']}.

АНАЛИЗ ТРЕНДОВ:
"""
        
        # Добавление информации о трендах
        if trends:
            trend = trends[0]
            prompt += f"""
- Проанализировано видео: {trend.get('videos_analyzed', 0)}
- Средние просмотры: {trend.get('avg_views', 0):,}
- Топ паттерны хуков:
"""
            for pattern in trend.get('hook_patterns', {}).get('title_patterns', [])[:5]:
                prompt += f"  * {pattern['pattern']} ({pattern['usage_percentage']}%)\n"
            
            prompt += "\n- Рекомендации:\n"
            for rec in trend.get('recommendations', []):
                prompt += f"  * {rec}\n"
        
        # Добавление истории успешных сценариев
        if past_scripts:
            prompt += f"\n\nИСТОРИЯ УСПЕШНЫХ СЦЕНАРИЕВ:\n"
            for script in past_scripts[:3]:
                prompt += f"- {script.get('title', 'Без названия')}: {script.get('views', 0):,} просмотров\n"
        
        prompt += f"""

ЗАДАЧА:
Создай {num_ideas} уникальных идей для видео, которые:
1. Соответствуют трендам и паттернам
2. Привлекают внимание с первых секунд
3. Имеют потенциал для вирусного распространения
4. Подходят для формата Shorts (до 60 секунд)

ФОРМАТ ОТВЕТА (JSON):
[
  {{
    "title": "Название идеи",
    "description": "Краткое описание (2-3 предложения)",
    "target_audience": "Целевая аудитория",
    "viral_potential": "high/medium/low",
    "emotion": "Основная эмоция (любопытство, шок, радость, страх и т.д.)",
    "key_message": "Ключевое сообщение"
  }}
]

Ответь ТОЛЬКО валидным JSON, без дополнительного текста.
"""
        
        return prompt
    
    def _build_hooks_prompt(
        self,
        idea: Dict[str, Any],
        num_hooks: int
    ) -> str:
        """
        Построение промпта для генерации хуков
        """
        prompt = f"""Создай {num_hooks} вариантов хука для видео-идеи:

ИДЕЯ:
- Название: {idea.get('title', '')}
- Описание: {idea.get('description', '')}
- Целевая аудитория: {idea.get('target_audience', '')}
- Основная эмоция: {idea.get('emotion', '')}

ТРЕБОВАНИЯ К ХУКАМ:
1. Длительность: 1-3 секунды (10-15 слов максимум)
2. Создают интригу или любопытство
3. Обещают ценность или решение проблемы
4. Используют эмоциональные триггеры
5. Простые и понятные

ФОРМАТ ОТВЕТА (JSON):
[
  {{
    "text": "Текст хука",
    "type": "question/statement/promise/shock",
    "emotion_trigger": "Какую эмоцию вызывает",
    "score": 8.5,
    "reasoning": "Почему этот хук будет работать"
  }}
]

Ответь ТОЛЬКО валидным JSON, без дополнительного текста.
"""
        
        return prompt
    
    def _build_script_prompt(
        self,
        idea: Dict[str, Any],
        hook: Dict[str, Any],
        platform: str,
        platform_config: Dict[str, Any],
        language: str,
        num_scenes: int
    ) -> str:
        """
        Построение промпта для генерации сценария
        """
        prompt = f"""Создай детальный сценарий для видео на платформе {platform}.

ИДЕЯ:
{json.dumps(idea, ensure_ascii=False, indent=2)}

ХУК:
{hook.get('text', '')}

ПАРАМЕТРЫ ПЛАТФОРМЫ {platform}:
- Стиль: {platform_config.get('style', '')}
- Темп: {platform_config.get('pace', '')}
- Уровень эмоций: {platform_config.get('emotion_level', '')}
- Позиция CTA: {platform_config.get('cta_position', '')}
- Макс. длительность: {platform_config.get('max_duration', 60)} секунд

СТРУКТУРА СЦЕНАРИЯ:
Создай {num_scenes} сцен, каждая из которых содержит:

1. ТЕКСТ ДЛЯ ОЗВУЧКИ (voiceover_text)
   - Естественная разговорная речь
   - Энергичная и вовлекающая
   - {platform_config.get('style', 'dynamic')} стиль

2. ВИЗУАЛЬНОЕ ОПИСАНИЕ (visual_description)
   - Детальное описание того, что видит зритель
   - Динамичные переходы
   - Визуальные эффекты

3. ДЛИТЕЛЬНОСТЬ (duration)
   - {SCRIPT_CONFIG['scene_duration_min']}-{SCRIPT_CONFIG['scene_duration_max']} секунды на сцену

4. ПРОМПТ ДЛЯ ВИДЕО-ГЕНЕРАЦИИ (video_prompt)
   - Детальный промпт для AI генератора видео
   - Описание стиля, освещения, движения камеры
   - Специфические визуальные элементы

ДОПОЛНИТЕЛЬНО:
- Добавь CTA (Call-to-Action) в позицию: {platform_config.get('cta_position', 'end')}
- Включи элементы монетизации (подписка, продукт, ссылка)
- Общая длительность должна быть около {SCRIPT_CONFIG['total_duration_target']} секунд

ФОРМАТ ОТВЕТА (JSON):
{{
  "title": "Название видео",
  "description": "Описание для публикации",
  "hashtags": ["хэштег1", "хэштег2", "хэштег3"],
  "total_duration": 15,
  "scenes": [
    {{
      "scene_number": 1,
      "voiceover_text": "Текст озвучки",
      "visual_description": "Что показывается на экране",
      "duration": 2.5,
      "video_prompt": "Промпт для AI генератора видео",
      "notes": "Дополнительные заметки"
    }}
  ],
  "cta": {{
    "text": "Текст призыва к действию",
    "position": "end",
    "action": "subscribe/like/visit"
  }},
  "monetization": {{
    "type": "product/affiliate/subscription",
    "description": "Описание монетизации"
  }}
}}

Ответь ТОЛЬКО валидным JSON, без дополнительного текста.
"""
        
        return prompt
    
    def _parse_ideas_response(self, response: str) -> List[Dict[str, Any]]:
        """
        Парсинг ответа LLM с идеями
        """
        try:
            # Попытка извлечь JSON из ответа
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                ideas = json.loads(json_str)
                return ideas
            else:
                logger.warning("JSON не найден в ответе, возвращаем пустой список")
                return []
                
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга JSON идей: {e}")
            return []
    
    def _parse_hooks_response(self, response: str) -> List[Dict[str, Any]]:
        """
        Парсинг ответа LLM с хуками
        """
        try:
            json_start = response.find('[')
            json_end = response.rfind(']') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                hooks = json.loads(json_str)
                return hooks
            else:
                logger.warning("JSON не найден в ответе")
                return []
                
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга JSON хуков: {e}")
            return []
    
    def _parse_script_response(
        self,
        response: str,
        idea: Dict[str, Any],
        hook: Dict[str, Any],
        platform: str
    ) -> Dict[str, Any]:
        """
        Парсинг ответа LLM со сценарием
        """
        try:
            json_start = response.find('{')
            json_end = response.rfind('}') + 1
            
            if json_start != -1 and json_end > json_start:
                json_str = response[json_start:json_end]
                script = json.loads(json_str)
                
                # Добавление метаданных
                script['metadata'] = {
                    'idea': idea,
                    'hook': hook,
                    'platform': platform,
                    'generated_at': datetime.now().isoformat(),
                    'generator': 'Abacus AI LLM'
                }
                
                return script
            else:
                logger.warning("JSON не найден в ответе")
                return {}
                
        except json.JSONDecodeError as e:
            logger.error(f"Ошибка парсинга JSON сценария: {e}")
            return {}
    
    def _select_best_hook(self, hooks: List[Dict[str, Any]]) -> Dict[str, Any]:
        """
        Выбор лучшего хука по оценке
        """
        if not hooks:
            return {}
        
        # Сортировка по score
        sorted_hooks = sorted(
            hooks,
            key=lambda h: h.get('score', 0),
            reverse=True
        )
        
        return sorted_hooks[0]


# =============================================================================
# ПУБЛИЧНЫЕ ФУНКЦИИ
# =============================================================================

def generate_video_ideas(
    niche: str,
    language: str,
    trends: List[Dict[str, Any]],
    past_successful_scripts: Optional[List[Dict[str, Any]]] = None
) -> List[Dict[str, Any]]:
    """
    Упрощённая функция для генерации идей
    """
    generator = ScriptGenerator()
    return generator.generate_video_ideas(
        niche, language, trends, past_successful_scripts
    )


def generate_hooks(idea: Dict[str, Any]) -> tuple:
    """
    Упрощённая функция для генерации хуков
    """
    generator = ScriptGenerator()
    return generator.generate_hooks(idea)


def generate_script(
    idea: Dict[str, Any],
    hook: Dict[str, Any],
    platform: str = 'TikTok',
    language: str = 'ru'
) -> Dict[str, Any]:
    """
    Упрощённая функция для генерации сценария
    """
    generator = ScriptGenerator()
    return generator.generate_script(idea, hook, platform, language)


# =============================================================================
# ТЕСТИРОВАНИЕ
# =============================================================================

if __name__ == '__main__':
    print("Тестирование генератора сценариев...")
    print("-" * 50)
    
    # Тестовые данные
    test_trends = [{
        'niche': 'мотивация',
        'videos_analyzed': 20,
        'avg_views': 150000,
        'hook_patterns': {
            'title_patterns': [
                {'pattern': 'Начинается с числа', 'usage_percentage': 60},
                {'pattern': 'Содержит интригу', 'usage_percentage': 45}
            ]
        },
        'recommendations': ['Используйте числа в заголовках']
    }]
    
    try:
        # Тест 1: Генерация идей
        print("\n📝 Тест 1: Генерация идей...")
        generator = ScriptGenerator()
        ideas = generator.generate_video_ideas(
            niche='мотивация',
            language='ru',
            trends=test_trends
        )
        print(f"✓ Сгенерировано идей: {len(ideas)}")
        
        if ideas:
            # Тест 2: Генерация хуков
            print("\n🎣 Тест 2: Генерация хуков...")
            hooks, best_hook = generator.generate_hooks(ideas[0])
            print(f"✓ Сгенерировано хуков: {len(hooks)}")
            print(f"✓ Лучший хук: {best_hook.get('text', '')[:50]}...")
            
            # Тест 3: Генерация сценария
            print("\n🎬 Тест 3: Генерация сценария...")
            script = generator.generate_script(
                idea=ideas[0],
                hook=best_hook,
                platform='TikTok',
                language='ru'
            )
            print(f"✓ Сценарий создан: {len(script.get('scenes', []))} сцен")
            print(f"✓ Общая длительность: {script.get('total_duration', 0)} сек")
        
        print("\n✓ Все тесты пройдены успешно!")
        
    except Exception as e:
        print(f"\n❌ Ошибка тестирования: {e}")
