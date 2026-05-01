"""
Анализатор трендов YouTube для AI Content Generator
Использует YouTube Data API v3 для поиска и анализа популярных Shorts
"""

import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import re
from collections import Counter

try:
    from googleapiclient.discovery import build
    from googleapiclient.errors import HttpError
except ImportError:
    print("ОШИБКА: Установите google-api-python-client")
    print("pip install google-api-python-client")

from config import YOUTUBE_API_KEY, YOUTUBE_CONFIG, get_language_config

# Настройка логирования
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class YouTubeTrendAnalyzer:
    """
    Класс для анализа трендов YouTube Shorts
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Инициализация анализатора
        
        Args:
            api_key: YouTube Data API ключ (если не указан, берётся из config)
        """
        self.api_key = api_key or YOUTUBE_API_KEY
        
        if not self.api_key:
            raise ValueError("YouTube API ключ не найден. Установите YOUTUBE_API_KEY в config.py")
        
        try:
            self.youtube = build('youtube', 'v3', developerKey=self.api_key)
            logger.info("YouTube API клиент успешно инициализирован")
        except Exception as e:
            logger.error(f"Ошибка инициализации YouTube API: {e}")
            raise
    
    def analyze_youtube_trends(
        self, 
        niche: str, 
        language: str = 'ru',
        max_results: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Главная функция анализа трендов YouTube
        
        Args:
            niche: Ниша для анализа (например, "мотивация", "финансы")
            language: Код языка (ru, en, etc.)
            max_results: Максимальное количество видео (по умолчанию из config)
        
        Returns:
            Список трендов с паттернами хуков
        """
        logger.info(f"Начало анализа трендов для ниши: {niche}, язык: {language}")
        
        try:
            # Поиск популярных Shorts
            videos = self._search_shorts(niche, language, max_results)
            
            if not videos:
                logger.warning(f"Видео не найдены для ниши: {niche}")
                return []
            
            logger.info(f"Найдено {len(videos)} видео для анализа")
            
            # Получение детальной статистики
            videos_with_stats = self._get_video_statistics(videos)
            
            # Фильтрация по метрикам
            filtered_videos = self._filter_by_engagement(videos_with_stats)
            
            logger.info(f"После фильтрации осталось {len(filtered_videos)} видео")
            
            # Анализ паттернов хуков
            trends = self._analyze_hook_patterns(filtered_videos, niche)
            
            logger.info(f"Обнаружено {len(trends)} трендов")
            
            return trends
            
        except HttpError as e:
            logger.error(f"YouTube API ошибка: {e}")
            raise
        except Exception as e:
            logger.error(f"Ошибка анализа трендов: {e}")
            raise
    
    def _search_shorts(
        self, 
        niche: str, 
        language: str,
        max_results: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        """
        Поиск популярных Shorts по нише
        
        Args:
            niche: Ниша для поиска
            language: Код языка
            max_results: Максимальное количество результатов
        
        Returns:
            Список видео с базовой информацией
        """
        max_results = max_results or YOUTUBE_CONFIG['max_results']
        lang_config = get_language_config(language)
        
        # Формирование поискового запроса с #shorts
        search_query = f"{niche} #shorts"
        
        # Расчёт даты для фильтрации (последние N дней)
        published_after = datetime.now() - timedelta(
            days=YOUTUBE_CONFIG['published_after_days']
        )
        published_after_str = published_after.strftime('%Y-%m-%dT%H:%M:%SZ')
        
        try:
            # Выполнение поискового запроса
            search_response = self.youtube.search().list(
                q=search_query,
                part='id,snippet',
                type='video',
                videoDuration='short',  # Только короткие видео
                maxResults=max_results,
                order=YOUTUBE_CONFIG['search_order'],
                publishedAfter=published_after_str,
                regionCode=lang_config['region'],
                relevanceLanguage=lang_config['code']
            ).execute()
            
            videos = []
            for item in search_response.get('items', []):
                video_data = {
                    'video_id': item['id']['videoId'],
                    'title': item['snippet']['title'],
                    'description': item['snippet']['description'],
                    'channel_title': item['snippet']['channelTitle'],
                    'published_at': item['snippet']['publishedAt'],
                }
                videos.append(video_data)
            
            return videos
            
        except HttpError as e:
            logger.error(f"Ошибка поиска видео: {e}")
            return []
    
    def _get_video_statistics(
        self, 
        videos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Получение детальной статистики для видео
        
        Args:
            videos: Список видео с базовой информацией
        
        Returns:
            Список видео с метриками
        """
        if not videos:
            return []
        
        # Формирование списка ID для запроса
        video_ids = ','.join([v['video_id'] for v in videos])
        
        try:
            # Получение статистики
            stats_response = self.youtube.videos().list(
                part='statistics,contentDetails',
                id=video_ids
            ).execute()
            
            # Создание словаря статистики
            stats_dict = {}
            for item in stats_response.get('items', []):
                video_id = item['id']
                stats = item['statistics']
                
                stats_dict[video_id] = {
                    'views': int(stats.get('viewCount', 0)),
                    'likes': int(stats.get('likeCount', 0)),
                    'comments': int(stats.get('commentCount', 0)),
                    'duration': item['contentDetails'].get('duration', '')
                }
            
            # Добавление статистики к видео
            for video in videos:
                video_id = video['video_id']
                if video_id in stats_dict:
                    video.update(stats_dict[video_id])
                    # Расчёт коэффициента вовлеченности
                    if video.get('views', 0) > 0:
                        engagement = (video.get('likes', 0) + video.get('comments', 0)) / video['views']
                        video['engagement_rate'] = engagement
                    else:
                        video['engagement_rate'] = 0
            
            return videos
            
        except HttpError as e:
            logger.error(f"Ошибка получения статистики: {e}")
            return videos
    
    def _filter_by_engagement(
        self, 
        videos: List[Dict[str, Any]]
    ) -> List[Dict[str, Any]]:
        """
        Фильтрация видео по метрикам вовлеченности
        
        Args:
            videos: Список видео с метриками
        
        Returns:
            Отфильтрованный список видео
        """
        filtered = []
        
        for video in videos:
            # Проверка минимального количества просмотров
            if video.get('views', 0) < YOUTUBE_CONFIG['min_views']:
                continue
            
            # Проверка коэффициента вовлеченности
            if video.get('engagement_rate', 0) < YOUTUBE_CONFIG['engagement_threshold']:
                continue
            
            filtered.append(video)
        
        # Сортировка по просмотрам
        filtered.sort(key=lambda x: x.get('views', 0), reverse=True)
        
        return filtered
    
    def _analyze_hook_patterns(
        self, 
        videos: List[Dict[str, Any]],
        niche: str
    ) -> List[Dict[str, Any]]:
        """
        Анализ паттернов хуков в заголовках и описаниях
        
        Args:
            videos: Список видео для анализа
            niche: Ниша контента
        
        Returns:
            Список трендов с паттернами
        """
        if not videos:
            return []
        
        # Анализ заголовков
        all_titles = [v['title'] for v in videos]
        title_patterns = self._extract_patterns(all_titles)
        
        # Анализ описаний
        all_descriptions = [v['description'] for v in videos if v.get('description')]
        description_patterns = self._extract_patterns(all_descriptions)
        
        # Топ-3 видео по просмотрам
        top_videos = videos[:3]
        
        # Средние метрики
        avg_views = sum(v.get('views', 0) for v in videos) / len(videos) if videos else 0
        avg_engagement = sum(v.get('engagement_rate', 0) for v in videos) / len(videos) if videos else 0
        
        # Формирование трендов
        trends = [
            {
                'niche': niche,
                'analyzed_at': datetime.now().isoformat(),
                'videos_analyzed': len(videos),
                'avg_views': int(avg_views),
                'avg_engagement_rate': round(avg_engagement, 4),
                'hook_patterns': {
                    'title_patterns': title_patterns[:10],  # Топ-10 паттернов
                    'description_patterns': description_patterns[:10],
                    'common_words': self._get_common_words(all_titles),
                    'question_usage': self._count_questions(all_titles),
                    'number_usage': self._count_numbers(all_titles),
                },
                'top_performing_videos': [
                    {
                        'title': v['title'],
                        'views': v['views'],
                        'engagement_rate': round(v['engagement_rate'], 4),
                        'url': f"https://youtube.com/shorts/{v['video_id']}"
                    }
                    for v in top_videos
                ],
                'recommendations': self._generate_recommendations(videos)
            }
        ]
        
        return trends
    
    def _extract_patterns(self, texts: List[str]) -> List[Dict[str, Any]]:
        """
        Извлечение паттернов из текстов
        
        Args:
            texts: Список текстов для анализа
        
        Returns:
            Список паттернов с частотой использования
        """
        patterns = []
        
        # Паттерны для поиска
        pattern_templates = [
            (r'^\d+', 'Начинается с числа'),
            (r'^Как\s+', 'Начинается с "Как"'),
            (r'^Почему\s+', 'Начинается с "Почему"'),
            (r'\?$', 'Заканчивается вопросом'),
            (r'!$', 'Заканчивается восклицанием'),
            (r'^\d+\s+(способ|метод|секрет)', 'Список способов/методов'),
            (r'(секрет|тайна|правда)', 'Содержит интригу'),
            (r'(шок|невероятно|удивительно)', 'Эмоциональная лексика'),
        ]
        
        for pattern, description in pattern_templates:
            count = sum(1 for text in texts if re.search(pattern, text, re.IGNORECASE))
            if count > 0:
                patterns.append({
                    'pattern': description,
                    'usage_count': count,
                    'usage_percentage': round((count / len(texts)) * 100, 1)
                })
        
        # Сортировка по частоте
        patterns.sort(key=lambda x: x['usage_count'], reverse=True)
        
        return patterns
    
    def _get_common_words(self, texts: List[str], top_n: int = 10) -> List[Dict[str, int]]:
        """
        Получение наиболее часто используемых слов
        
        Args:
            texts: Список текстов
            top_n: Количество топовых слов
        
        Returns:
            Список слов с частотой
        """
        # Стоп-слова для фильтрации
        stop_words = {
            'в', 'на', 'и', 'с', 'по', 'для', 'как', 'что', 'это', 'все',
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to'
        }
        
        # Извлечение всех слов
        all_words = []
        for text in texts:
            words = re.findall(r'\b\w+\b', text.lower())
            all_words.extend([w for w in words if w not in stop_words and len(w) > 2])
        
        # Подсчёт частоты
        word_counts = Counter(all_words)
        
        return [
            {'word': word, 'count': count}
            for word, count in word_counts.most_common(top_n)
        ]
    
    def _count_questions(self, texts: List[str]) -> Dict[str, Any]:
        """
        Подсчёт использования вопросов
        
        Args:
            texts: Список текстов
        
        Returns:
            Статистика использования вопросов
        """
        question_count = sum(1 for text in texts if '?' in text)
        
        return {
            'total_questions': question_count,
            'percentage': round((question_count / len(texts)) * 100, 1) if texts else 0
        }
    
    def _count_numbers(self, texts: List[str]) -> Dict[str, Any]:
        """
        Подсчёт использования чисел
        
        Args:
            texts: Список текстов
        
        Returns:
            Статистика использования чисел
        """
        number_count = sum(1 for text in texts if re.search(r'\d+', text))
        
        return {
            'total_with_numbers': number_count,
            'percentage': round((number_count / len(texts)) * 100, 1) if texts else 0
        }
    
    def _generate_recommendations(self, videos: List[Dict[str, Any]]) -> List[str]:
        """
        Генерация рекомендаций на основе анализа
        
        Args:
            videos: Список проанализированных видео
        
        Returns:
            Список рекомендаций
        """
        recommendations = []
        
        # Анализ заголовков
        titles = [v['title'] for v in videos]
        
        # Рекомендация по использованию чисел
        numbers_usage = sum(1 for t in titles if re.search(r'\d+', t))
        if numbers_usage / len(titles) > 0.5:
            recommendations.append("Используйте числа в заголовках (более 50% успешных видео)")
        
        # Рекомендация по использованию вопросов
        questions_usage = sum(1 for t in titles if '?' in t)
        if questions_usage / len(titles) > 0.3:
            recommendations.append("Формулируйте заголовки в виде вопросов")
        
        # Рекомендация по длине заголовка
        avg_title_length = sum(len(t) for t in titles) / len(titles)
        if avg_title_length < 50:
            recommendations.append(f"Оптимальная длина заголовка: до {int(avg_title_length)} символов")
        
        # Рекомендация по вовлеченности
        high_engagement = [v for v in videos if v.get('engagement_rate', 0) > 0.05]
        if high_engagement:
            recommendations.append("Фокус на эмоциональный контент для повышения вовлеченности")
        
        return recommendations


# =============================================================================
# ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ
# =============================================================================

def analyze_youtube_trends(
    niche: str, 
    language: str = 'ru',
    api_key: Optional[str] = None
) -> List[Dict[str, Any]]:
    """
    Упрощённая функция для анализа трендов YouTube
    
    Args:
        niche: Ниша для анализа
        language: Код языка (ru, en, etc.)
        api_key: YouTube API ключ (опционально)
    
    Returns:
        Список трендов с паттернами
    """
    analyzer = YouTubeTrendAnalyzer(api_key=api_key)
    return analyzer.analyze_youtube_trends(niche, language)


# =============================================================================
# ТЕСТИРОВАНИЕ
# =============================================================================

if __name__ == '__main__':
    # Пример использования
    print("Тестирование анализатора трендов YouTube...")
    print("-" * 50)
    
    # Проверка API ключа
    if not YOUTUBE_API_KEY:
        print("❌ ОШИБКА: YouTube API ключ не настроен")
        print("Установите YOUTUBE_API_KEY в файле config.py")
        exit(1)
    
    # Тестовый анализ
    try:
        trends = analyze_youtube_trends(
            niche='мотивация',
            language='ru'
        )
        
        print(f"\n✓ Найдено трендов: {len(trends)}")
        
        if trends:
            trend = trends[0]
            print(f"\nПроанализировано видео: {trend['videos_analyzed']}")
            print(f"Средние просмотры: {trend['avg_views']:,}")
            print(f"Средняя вовлеченность: {trend['avg_engagement_rate']:.2%}")
            
            print("\n📊 Паттерны хуков:")
            for pattern in trend['hook_patterns']['title_patterns'][:5]:
                print(f"  - {pattern['pattern']}: {pattern['usage_percentage']}%")
            
            print("\n💡 Рекомендации:")
            for rec in trend['recommendations']:
                print(f"  - {rec}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")
