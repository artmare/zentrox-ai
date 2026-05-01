#!/usr/bin/env python3
"""
Примеры использования AI Content Generator
Демонстрация основных функций модуля
"""

import json
from datetime import datetime

# Импорт модулей
from trend_analyzer import analyze_youtube_trends, YouTubeTrendAnalyzer
from script_generator import ScriptGenerator
from content_engine import generate_daily_content


def example_1_basic_trend_analysis():
    """
    Пример 1: Базовый анализ трендов YouTube
    """
    print("\n" + "="*70)
    print("ПРИМЕР 1: Анализ трендов YouTube")
    print("="*70)
    
    try:
        # Анализ трендов для ниши "мотивация"
        trends = analyze_youtube_trends(
            niche='мотивация',
            language='ru'
        )
        
        if trends:
            trend = trends[0]
            
            print(f"\n✓ Проанализировано видео: {trend['videos_analyzed']}")
            print(f"✓ Средние просмотры: {trend['avg_views']:,}")
            print(f"✓ Средняя вовлеченность: {trend['avg_engagement_rate']:.2%}")
            
            print("\n📊 Топ-5 паттернов хуков:")
            for pattern in trend['hook_patterns']['title_patterns'][:5]:
                print(f"  • {pattern['pattern']}: {pattern['usage_percentage']}%")
            
            print("\n🎥 Топ-3 видео:")
            for i, video in enumerate(trend['top_performing_videos'][:3], 1):
                print(f"  {i}. {video['title'][:60]}...")
                print(f"     Просмотры: {video['views']:,}, Вовлеченность: {video['engagement_rate']:.2%}")
        else:
            print("❌ Тренды не найдены")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")


def example_2_generate_video_ideas():
    """
    Пример 2: Генерация идей для видео
    """
    print("\n" + "="*70)
    print("ПРИМЕР 2: Генерация идей для видео")
    print("="*70)
    
    try:
        # Сначала анализируем тренды
        print("\n🔍 Анализ трендов...")
        trends = analyze_youtube_trends(niche='финансы', language='ru')
        
        # Генерируем идеи
        print("\n💡 Генерация идей...")
        generator = ScriptGenerator()
        
        ideas = generator.generate_video_ideas(
            niche='финансы',
            language='ru',
            trends=trends,
            num_ideas=3
        )
        
        print(f"\n✓ Сгенерировано идей: {len(ideas)}")
        
        for i, idea in enumerate(ideas, 1):
            print(f"\n{i}. {idea.get('title', 'Без названия')}")
            print(f"   Описание: {idea.get('description', '')[:100]}...")
            print(f"   Вирусный потенциал: {idea.get('viral_potential', 'unknown')}")
            print(f"   Эмоция: {idea.get('emotion', 'unknown')}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")


def example_3_full_script_generation():
    """
    Пример 3: Полная генерация сценария
    """
    print("\n" + "="*70)
    print("ПРИМЕР 3: Полная генерация сценария")
    print("="*70)
    
    try:
        # Анализ трендов
        print("\n🔍 Шаг 1: Анализ трендов...")
        trends = analyze_youtube_trends(niche='мотивация', language='ru')
        
        # Инициализация генератора
        generator = ScriptGenerator()
        
        # Генерация идей
        print("\n💡 Шаг 2: Генерация идей...")
        ideas = generator.generate_video_ideas(
            niche='мотивация',
            language='ru',
            trends=trends,
            num_ideas=1
        )
        
        if not ideas:
            print("❌ Не удалось сгенерировать идеи")
            return
        
        idea = ideas[0]
        print(f"✓ Идея: {idea['title']}")
        
        # Генерация хуков
        print("\n🎣 Шаг 3: Генерация хуков...")
        hooks, best_hook = generator.generate_hooks(idea)
        print(f"✓ Сгенерировано хуков: {len(hooks)}")
        print(f"✓ Лучший хук (оценка {best_hook.get('score', 0)}): {best_hook.get('text', '')}")
        
        # Генерация полного сценария
        print("\n🎬 Шаг 4: Генерация сценария...")
        script = generator.generate_script(
            idea=idea,
            hook=best_hook,
            platform='TikTok',
            language='ru'
        )
        
        print(f"\n✅ СЦЕНАРИЙ СГЕНЕРИРОВАН")
        print(f"Название: {script.get('title', '')}")
        print(f"Сцен: {len(script.get('scenes', []))}")
        print(f"Общая длительность: {script.get('total_duration', 0)} секунд")
        print(f"Хэштеги: {', '.join(script.get('hashtags', []))}")
        
        print("\n📋 Сцены:")
        for scene in script.get('scenes', []):
            print(f"\n  Сцена {scene['scene_number']} ({scene['duration']}с):")
            print(f"  Озвучка: {scene['voiceover_text'][:80]}...")
            print(f"  Визуал: {scene['visual_description'][:80]}...")
        
        # Сохранение в файл
        filename = f"script_example_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(script, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Сценарий сохранён в: {filename}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")


def example_4_daily_content_generation():
    """
    Пример 4: Автоматическая генерация ежедневного контента
    """
    print("\n" + "="*70)
    print("ПРИМЕР 4: Автоматическая генерация ежедневного контента")
    print("="*70)
    
    try:
        print("\n🚀 Запуск генерации контента для пользователя ID=1...")
        
        result = generate_daily_content(
            user_id=1,
            force_regenerate=True  # Игнорировать кэш
        )
        
        print(f"\n✅ Генерация завершена!")
        print(f"Статус: {result['status']}")
        print(f"Время выполнения: {result.get('execution_time_seconds', 0):.2f} секунд")
        
        if result['status'] == 'success':
            metrics = result['metrics']
            print(f"\n📊 Метрики:")
            print(f"  • Трендов проанализировано: {metrics['trends_analyzed']}")
            print(f"  • Сценариев сгенерировано: {metrics['scripts_generated']}")
            print(f"  • Сценариев сохранено в БД: {metrics['scripts_saved']}")
            print(f"  • Использовано прошлых сценариев: {metrics['past_scripts_used']}")
            
            # Экспорт результата
            export_file = f"daily_content_{datetime.now().strftime('%Y%m%d')}.json"
            with open(export_file, 'w', encoding='utf-8') as f:
                json.dump(result, f, ensure_ascii=False, indent=2)
            
            print(f"\n💾 Результат экспортирован в: {export_file}")
        else:
            print(f"\n❌ Ошибка: {result.get('error', 'Unknown error')}")
            
    except Exception as e:
        print(f"❌ Ошибка: {e}")


def example_5_advanced_trend_analysis():
    """
    Пример 5: Расширенный анализ трендов с детальными метриками
    """
    print("\n" + "="*70)
    print("ПРИМЕР 5: Расширенный анализ трендов")
    print("="*70)
    
    try:
        # Создаём экземпляр анализатора
        analyzer = YouTubeTrendAnalyzer()
        
        # Анализ нескольких ниш
        niches = ['мотивация', 'финансы', 'здоровье']
        
        all_results = {}
        
        for niche in niches:
            print(f"\n🔍 Анализ ниши: {niche}")
            
            trends = analyzer.analyze_youtube_trends(
                niche=niche,
                language='ru',
                max_results=15
            )
            
            if trends:
                trend = trends[0]
                all_results[niche] = {
                    'videos_analyzed': trend['videos_analyzed'],
                    'avg_views': trend['avg_views'],
                    'avg_engagement': trend['avg_engagement_rate'],
                    'top_patterns': [p['pattern'] for p in trend['hook_patterns']['title_patterns'][:3]]
                }
                
                print(f"  ✓ Видео: {trend['videos_analyzed']}")
                print(f"  ✓ Ср. просмотры: {trend['avg_views']:,}")
                print(f"  ✓ Ср. вовлеченность: {trend['avg_engagement_rate']:.2%}")
        
        # Сравнительный отчёт
        print("\n" + "="*70)
        print("📊 СРАВНИТЕЛЬНЫЙ ОТЧЁТ")
        print("="*70)
        
        # Найти нишу с наибольшей вовлеченностью
        best_niche = max(all_results.items(), key=lambda x: x[1]['avg_engagement'])
        
        print(f"\n🏆 Самая вовлекающая ниша: {best_niche[0]}")
        print(f"   Вовлеченность: {best_niche[1]['avg_engagement']:.2%}")
        
        # Экспорт отчёта
        report_file = f"trend_report_{datetime.now().strftime('%Y%m%d')}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(all_results, f, ensure_ascii=False, indent=2)
        
        print(f"\n💾 Отчёт сохранён: {report_file}")
        
    except Exception as e:
        print(f"❌ Ошибка: {e}")


def main():
    """
    Главная функция - запускает все примеры
    """
    print("""
    ╔══════════════════════════════════════════════════════════════════╗
    ║                                                                  ║
    ║              AI CONTENT GENERATOR - ПРИМЕРЫ ИСПОЛЬЗОВАНИЯ        ║
    ║                                                                  ║
    ╚══════════════════════════════════════════════════════════════════╝
    """)
    
    examples = [
        ("Анализ трендов YouTube", example_1_basic_trend_analysis),
        ("Генерация идей для видео", example_2_generate_video_ideas),
        ("Полная генерация сценария", example_3_full_script_generation),
        ("Автоматическая генерация ежедневного контента", example_4_daily_content_generation),
        ("Расширенный анализ трендов", example_5_advanced_trend_analysis),
    ]
    
    print("\nДоступные примеры:")
    for i, (name, _) in enumerate(examples, 1):
        print(f"{i}. {name}")
    print("0. Выход")
    print("A. Запустить все примеры")
    
    choice = input("\nВыберите пример (0-5, A): ").strip().upper()
    
    if choice == '0':
        print("\n👋 До свидания!")
        return
    elif choice == 'A':
        print("\n🚀 Запуск всех примеров...\n")
        for name, func in examples:
            try:
                func()
            except Exception as e:
                print(f"❌ Ошибка в примере '{name}': {e}")
            print("\n" + "-"*70)
    elif choice.isdigit() and 1 <= int(choice) <= len(examples):
        idx = int(choice) - 1
        examples[idx][1]()
    else:
        print("❌ Неверный выбор!")


if __name__ == '__main__':
    main()
