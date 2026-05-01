"""
Главный оркестратор AI Content Generator
Координирует процесс генерации контента: анализ трендов → идеи → сценарии
"""

import json
import logging
from datetime import datetime
from typing import Dict, Any, List, Optional
import os

try:
    import psycopg2
    from psycopg2.extras import RealDictCursor, Json
except ImportError:
    print("ПРЕДУПРЕЖДЕНИЕ: psycopg2 не установлен. Функции БД будут недоступны.")
    print("pip install psycopg2-binary")

from trend_analyzer import analyze_youtube_trends
from script_generator import ScriptGenerator
from config import DATABASE_CONFIG, SCRIPT_CONFIG, LOGGING_CONFIG

# Настройка логирования
os.makedirs(os.path.dirname(LOGGING_CONFIG['file']), exist_ok=True)

logging.basicConfig(
    level=getattr(logging, LOGGING_CONFIG['level']),
    format=LOGGING_CONFIG['format'],
    handlers=[
        logging.FileHandler(LOGGING_CONFIG['file']),
        logging.StreamHandler()
    ]
)

logger = logging.getLogger(__name__)


class ContentEngine:
    """
    Главный движок для автоматической генерации контента
    """
    
    def __init__(self, db_config: Optional[Dict[str, Any]] = None):
        """
        Инициализация движка
        
        Args:
            db_config: Конфигурация базы данных (опционально)
        """
        self.db_config = db_config or DATABASE_CONFIG
        self.script_generator = ScriptGenerator()
        self.db_connection = None
        
        logger.info("Content Engine инициализирован")
    
    def generate_daily_content(
        self,
        user_id: int,
        force_regenerate: bool = False
    ) -> Dict[str, Any]:
        """
        Главная функция генерации ежедневного контента
        
        Args:
            user_id: ID пользователя
            force_regenerate: Принудительная регенерация (игнорировать кэш)
        
        Returns:
            Результат генерации с метриками
        """
        start_time = datetime.now()
        logger.info(f"Запуск генерации контента для пользователя {user_id}")
        
        try:
            # 1. Получение настроек пользователя из БД
            user_settings = self._get_user_settings(user_id)
            
            if not user_settings:
                raise ValueError(f"Настройки пользователя {user_id} не найдены")
            
            logger.info(f"Настройки пользователя загружены: ниша={user_settings['niche']}, платформа={user_settings['platform']}")
            
            # 2. Проверка, нужна ли генерация сегодня
            if not force_regenerate and self._check_today_content_exists(user_id):
                logger.info("Контент уже сгенерирован сегодня. Пропуск генерации.")
                return {
                    'status': 'skipped',
                    'reason': 'Content already generated today',
                    'user_id': user_id
                }
            
            # 3. Анализ актуальных трендов YouTube
            logger.info("Запуск анализа трендов YouTube...")
            trends = self._analyze_trends(
                niche=user_settings['niche'],
                language=user_settings.get('language', 'ru')
            )
            
            if trends:
                self._save_trends_to_db(user_id, trends)
            
            # 4. Получение истории успешных сценариев
            past_scripts = self._get_past_successful_scripts(user_id, limit=5)
            
            # 5. Генерация нужного количества сценариев
            num_scripts = user_settings.get('scripts_per_day', SCRIPT_CONFIG['ideas_per_generation'])
            
            logger.info(f"Генерация {num_scripts} сценариев...")
            generated_scripts = self._generate_scripts(
                user_settings=user_settings,
                trends=trends,
                past_scripts=past_scripts,
                num_scripts=num_scripts
            )
            
            # 6. Сохранение сценариев в БД
            saved_count = self._save_scripts_to_db(user_id, generated_scripts)
            
            # 7. Подсчёт времени выполнения
            end_time = datetime.now()
            execution_time = (end_time - start_time).total_seconds()
            
            # 8. Формирование результата
            result = {
                'status': 'success',
                'user_id': user_id,
                'generated_at': end_time.isoformat(),
                'execution_time_seconds': round(execution_time, 2),
                'metrics': {
                    'trends_analyzed': len(trends) if trends else 0,
                    'scripts_generated': len(generated_scripts),
                    'scripts_saved': saved_count,
                    'past_scripts_used': len(past_scripts)
                },
                'scripts': generated_scripts
            }
            
            # 9. Логирование результата
            self._log_generation_result(user_id, result)
            
            logger.info(f"✓ Генерация завершена успешно за {execution_time:.2f} сек")
            
            return result
            
        except Exception as e:
            logger.error(f"Ошибка генерации контента: {e}", exc_info=True)
            
            return {
                'status': 'error',
                'user_id': user_id,
                'error': str(e),
                'generated_at': datetime.now().isoformat()
            }
    
    # =========================================================================
    # МЕТОДЫ РАБОТЫ С БАЗОЙ ДАННЫХ
    # =========================================================================
    
    def _connect_db(self):
        """
        Подключение к базе данных PostgreSQL
        """
        if self.db_connection is None or self.db_connection.closed:
            try:
                self.db_connection = psycopg2.connect(
                    host=self.db_config['host'],
                    port=self.db_config['port'],
                    database=self.db_config['database'],
                    user=self.db_config['user'],
                    password=self.db_config['password']
                )
                logger.debug("Подключение к БД установлено")
            except Exception as e:
                logger.error(f"Ошибка подключения к БД: {e}")
                raise
        
        return self.db_connection
    
    def _get_user_settings(self, user_id: int) -> Optional[Dict[str, Any]]:
        """
        Получение настроек пользователя из БД
        
        Args:
            user_id: ID пользователя
        
        Returns:
            Словарь с настройками или None
        """
        try:
            conn = self._connect_db()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = f"""
                SELECT 
                    id,
                    niche,
                    language,
                    platform,
                    scripts_per_day,
                    settings
                FROM {self.db_config['table_users']}
                WHERE id = %s
            """
            
            cursor.execute(query, (user_id,))
            result = cursor.fetchone()
            cursor.close()
            
            if result:
                return dict(result)
            else:
                # Возврат настроек по умолчанию, если пользователь не найден
                logger.warning(f"Пользователь {user_id} не найден, используются настройки по умолчанию")
                return {
                    'id': user_id,
                    'niche': 'мотивация',
                    'language': 'ru',
                    'platform': 'TikTok',
                    'scripts_per_day': 3,
                    'settings': {}
                }
                
        except Exception as e:
            logger.error(f"Ошибка получения настроек пользователя: {e}")
            # Возврат настроек по умолчанию в случае ошибки
            return {
                'id': user_id,
                'niche': 'мотивация',
                'language': 'ru',
                'platform': 'TikTok',
                'scripts_per_day': 3,
                'settings': {}
            }
    
    def _check_today_content_exists(self, user_id: int) -> bool:
        """
        Проверка, сгенерирован ли уже контент сегодня
        
        Args:
            user_id: ID пользователя
        
        Returns:
            True если контент уже существует
        """
        try:
            conn = self._connect_db()
            cursor = conn.cursor()
            
            query = f"""
                SELECT COUNT(*) 
                FROM {self.db_config['table_scripts']}
                WHERE user_id = %s 
                AND DATE(created_at) = CURRENT_DATE
            """
            
            cursor.execute(query, (user_id,))
            count = cursor.fetchone()[0]
            cursor.close()
            
            return count > 0
            
        except Exception as e:
            logger.error(f"Ошибка проверки существующего контента: {e}")
            return False
    
    def _get_past_successful_scripts(
        self, 
        user_id: int, 
        limit: int = 5
    ) -> List[Dict[str, Any]]:
        """
        Получение истории успешных сценариев
        
        Args:
            user_id: ID пользователя
            limit: Максимальное количество сценариев
        
        Returns:
            Список успешных сценариев
        """
        try:
            conn = self._connect_db()
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            
            query = f"""
                SELECT 
                    id,
                    title,
                    script_data,
                    views,
                    likes,
                    created_at
                FROM {self.db_config['table_scripts']}
                WHERE user_id = %s 
                AND views > 10000
                ORDER BY views DESC
                LIMIT %s
            """
            
            cursor.execute(query, (user_id, limit))
            results = cursor.fetchall()
            cursor.close()
            
            return [dict(row) for row in results]
            
        except Exception as e:
            logger.error(f"Ошибка получения истории сценариев: {e}")
            return []
    
    def _save_trends_to_db(
        self, 
        user_id: int, 
        trends: List[Dict[str, Any]]
    ) -> bool:
        """
        Сохранение трендов в БД
        
        Args:
            user_id: ID пользователя
            trends: Список трендов
        
        Returns:
            True если успешно
        """
        try:
            conn = self._connect_db()
            cursor = conn.cursor()
            
            for trend in trends:
                query = f"""
                    INSERT INTO {self.db_config['table_trends']} 
                    (user_id, niche, trend_data, analyzed_at)
                    VALUES (%s, %s, %s, %s)
                """
                
                cursor.execute(query, (
                    user_id,
                    trend.get('niche', ''),
                    Json(trend),
                    datetime.now()
                ))
            
            conn.commit()
            cursor.close()
            
            logger.info(f"Сохранено {len(trends)} трендов в БД")
            return True
            
        except Exception as e:
            logger.error(f"Ошибка сохранения трендов: {e}")
            return False
    
    def _save_scripts_to_db(
        self, 
        user_id: int, 
        scripts: List[Dict[str, Any]]
    ) -> int:
        """
        Сохранение сценариев в БД
        
        Args:
            user_id: ID пользователя
            scripts: Список сценариев
        
        Returns:
            Количество сохранённых сценариев
        """
        saved_count = 0
        
        try:
            conn = self._connect_db()
            cursor = conn.cursor()
            
            for script in scripts:
                try:
                    query = f"""
                        INSERT INTO {self.db_config['table_scripts']} 
                        (user_id, title, description, script_data, platform, status, created_at)
                        VALUES (%s, %s, %s, %s, %s, %s, %s)
                    """
                    
                    cursor.execute(query, (
                        user_id,
                        script.get('title', ''),
                        script.get('description', ''),
                        Json(script),
                        script.get('metadata', {}).get('platform', 'TikTok'),
                        'draft',
                        datetime.now()
                    ))
                    
                    saved_count += 1
                    
                except Exception as e:
                    logger.error(f"Ошибка сохранения сценария: {e}")
                    continue
            
            conn.commit()
            cursor.close()
            
            logger.info(f"Сохранено {saved_count} сценариев в БД")
            
        except Exception as e:
            logger.error(f"Ошибка сохранения сценариев: {e}")
        
        return saved_count
    
    def _log_generation_result(
        self, 
        user_id: int, 
        result: Dict[str, Any]
    ) -> None:
        """
        Логирование результата генерации
        
        Args:
            user_id: ID пользователя
            result: Результат генерации
        """
        log_message = f"""
╔══════════════════════════════════════════════════════════════╗
║ РЕЗУЛЬТАТ ГЕНЕРАЦИИ КОНТЕНТА
╠══════════════════════════════════════════════════════════════╣
║ Пользователь: {user_id}
║ Статус: {result.get('status', 'unknown')}
║ Время выполнения: {result.get('execution_time_seconds', 0):.2f} сек
╠══════════════════════════════════════════════════════════════╣
║ МЕТРИКИ:
║ • Трендов проанализировано: {result.get('metrics', {}).get('trends_analyzed', 0)}
║ • Сценариев сгенерировано: {result.get('metrics', {}).get('scripts_generated', 0)}
║ • Сценариев сохранено: {result.get('metrics', {}).get('scripts_saved', 0)}
║ • Использовано прошлых сценариев: {result.get('metrics', {}).get('past_scripts_used', 0)}
╚══════════════════════════════════════════════════════════════╝
        """
        
        logger.info(log_message)
    
    # =========================================================================
    # МЕТОДЫ ГЕНЕРАЦИИ КОНТЕНТА
    # =========================================================================
    
    def _analyze_trends(
        self, 
        niche: str, 
        language: str
    ) -> List[Dict[str, Any]]:
        """
        Анализ трендов YouTube
        
        Args:
            niche: Ниша для анализа
            language: Код языка
        
        Returns:
            Список трендов
        """
        try:
            trends = analyze_youtube_trends(niche, language)
            logger.info(f"Анализ трендов завершён: {len(trends)} трендов найдено")
            return trends
            
        except Exception as e:
            logger.error(f"Ошибка анализа трендов: {e}")
            return []
    
    def _generate_scripts(
        self,
        user_settings: Dict[str, Any],
        trends: List[Dict[str, Any]],
        past_scripts: List[Dict[str, Any]],
        num_scripts: int
    ) -> List[Dict[str, Any]]:
        """
        Генерация сценариев
        
        Args:
            user_settings: Настройки пользователя
            trends: Список трендов
            past_scripts: История успешных сценариев
            num_scripts: Количество сценариев для генерации
        
        Returns:
            Список сгенерированных сценариев
        """
        generated_scripts = []
        
        try:
            # 1. Генерация идей
            logger.info("Генерация идей...")
            ideas = self.script_generator.generate_video_ideas(
                niche=user_settings['niche'],
                language=user_settings.get('language', 'ru'),
                trends=trends,
                past_successful_scripts=past_scripts,
                num_ideas=num_scripts
            )
            
            # 2. Для каждой идеи: генерация хуков и сценария
            for i, idea in enumerate(ideas[:num_scripts], 1):
                logger.info(f"Обработка идеи {i}/{num_scripts}: {idea.get('title', '')}")
                
                try:
                    # Генерация хуков
                    hooks, best_hook = self.script_generator.generate_hooks(idea)
                    
                    # Генерация сценария
                    script = self.script_generator.generate_script(
                        idea=idea,
                        hook=best_hook,
                        platform=user_settings.get('platform', 'TikTok'),
                        language=user_settings.get('language', 'ru')
                    )
                    
                    if script:
                        generated_scripts.append(script)
                        logger.info(f"✓ Сценарий {i} успешно сгенерирован")
                    
                except Exception as e:
                    logger.error(f"Ошибка генерации сценария для идеи {i}: {e}")
                    continue
            
            return generated_scripts
            
        except Exception as e:
            logger.error(f"Ошибка генерации сценариев: {e}")
            return []
    
    def close(self):
        """
        Закрытие соединения с БД
        """
        if self.db_connection and not self.db_connection.closed:
            self.db_connection.close()
            logger.info("Соединение с БД закрыто")


# =============================================================================
# ПУБЛИЧНЫЕ ФУНКЦИИ
# =============================================================================

def generate_daily_content(
    user_id: int,
    force_regenerate: bool = False,
    db_config: Optional[Dict[str, Any]] = None
) -> Dict[str, Any]:
    """
    Упрощённая функция для генерации ежедневного контента
    
    Args:
        user_id: ID пользователя
        force_regenerate: Принудительная регенерация
        db_config: Конфигурация БД (опционально)
    
    Returns:
        Результат генерации
    """
    engine = ContentEngine(db_config=db_config)
    
    try:
        result = engine.generate_daily_content(user_id, force_regenerate)
        return result
    finally:
        engine.close()


# =============================================================================
# ТЕСТИРОВАНИЕ И CLI
# =============================================================================

if __name__ == '__main__':
    import argparse
    
    # Парсинг аргументов командной строки
    parser = argparse.ArgumentParser(description='AI Content Generator Engine')
    parser.add_argument('--user-id', type=int, required=True, help='User ID')
    parser.add_argument('--force', action='store_true', help='Force regenerate')
    parser.add_argument('--export', type=str, help='Export results to JSON file')
    
    args = parser.parse_args()
    
    print("=" * 70)
    print("AI CONTENT GENERATOR ENGINE")
    print("=" * 70)
    
    # Запуск генерации
    result = generate_daily_content(
        user_id=args.user_id,
        force_regenerate=args.force
    )
    
    # Вывод результата
    print(f"\n{'='*70}")
    print("РЕЗУЛЬТАТ ГЕНЕРАЦИИ")
    print(f"{'='*70}")
    print(json.dumps(result, ensure_ascii=False, indent=2))
    
    # Экспорт в файл, если указан
    if args.export:
        with open(args.export, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        print(f"\n✓ Результат экспортирован в: {args.export}")
