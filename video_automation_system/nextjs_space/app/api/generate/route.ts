export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseLLMJson } from '@/lib/utils'

const NICHE_KEYWORDS: Record<string, { ru: string[]; en: string[] }> = {
  motivation: { ru: ['мотивация', 'успех', 'сила воли', 'цель', 'действие'], en: ['motivation', 'success', 'mindset', 'discipline', 'goals'] },
  business: { ru: ['бизнес', 'деньги', 'доход', 'инвестиции', 'финансы'], en: ['business', 'money', 'investing', 'income', 'finance'] },
  fitness: { ru: ['фитнес', 'тренировка', 'здоровье', 'тело', 'питание'], en: ['fitness', 'workout', 'health', 'body', 'nutrition'] },
  psychology: { ru: ['психология', 'мышление', 'эмоции', 'отношения', 'саморазвитие'], en: ['psychology', 'mindset', 'emotions', 'relationships', 'growth'] },
  facts: { ru: ['факты', 'интересно', 'наука', 'мир', 'открытие'], en: ['facts', 'science', 'discovery', 'interesting', 'amazing'] },
  stories: { ru: ['истории', 'рассказ', 'биография', 'судьба', 'легенда'], en: ['story', 'biography', 'legend', 'tale', 'life'] },
  education: { ru: ['образование', 'обучение', 'знания', 'уроки', 'навыки'], en: ['education', 'learning', 'skills', 'knowledge', 'tutorial'] },
  technology: { ru: ['технологии', 'AI', 'будущее', 'инновации', 'гаджеты'], en: ['technology', 'AI', 'future', 'innovation', 'gadgets'] },
}

const CONTENT_TYPES = ['provocative', 'fact_revelation', 'story_hook', 'motivational_monologue', 'listicle', 'tutorial']
const EMOTIONS = ['fear', 'curiosity', 'greed', 'inspiration', 'surprise', 'urgency']

function getSystemPrompt(platform: string, language: string, niche: string, strategy: string) {
  const lang = language === 'russian' ? 'русском' : 'English'
  const platformStyle = platform === 'tiktok'
    ? 'Стиль TikTok: Агрессивный хук в первую секунду. Быстрый темп. Эмоциональные триггеры. Провокация.'
    : 'Стиль YouTube Shorts: Логическая структура. Ценность для зрителя. Удержание внимания. Watch time.'

  return `Ты — эксперт по вирусному короткому видео-контенту.
Ниша: ${niche}
Язык контента: ${lang}
${platformStyle}
Стратегия: ${strategy}

Правила:
1. Хук должен зацепить в первую секунду
2. Каждая сцена 2-3 секунды
3. Визуал: cinematic стиль, движение камеры
4. Субтитры: короткие фразы, ключевые слова CAPS
5. CTA в последней сцене`
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    })
    if (!user || !user.settings) {
      return NextResponse.json({ error: 'Сначала настройте параметры в панели управления' }, { status: 400 })
    }

    const settings = user.settings
    let platforms: string[] = []
    try {
      platforms = typeof settings.platforms === 'string' ? JSON.parse(settings.platforms as string) : (settings.platforms as string[])
    } catch { platforms = ['youtube_shorts'] }
    if (platforms.length === 0) platforms = ['youtube_shorts']

    const platform = platforms[Math.floor(Math.random() * platforms.length)]
    const contentType = CONTENT_TYPES[Math.floor(Math.random() * CONTENT_TYPES.length)]
    const emotion = EMOTIONS[Math.floor(Math.random() * EMOTIONS.length)]
    const nicheKw = NICHE_KEYWORDS[settings.niche] ?? NICHE_KEYWORDS.motivation
    const langKw = settings.language === 'english' ? nicheKw.en : nicheKw.ru
    const keyword = langKw[Math.floor(Math.random() * langKw.length)]

    // Fetch recent trends to incorporate
    let trendsContext = ''
    try {
      const recentTrends = await prisma.trend.findMany({
        where: { platform: { contains: platform.replace('_', '') } },
        orderBy: { analyzedAt: 'desc' },
        take: 5,
        select: { title: true, hookType: true, emotion: true, engagementRate: true },
      })
      if (recentTrends.length > 0) {
        trendsContext = `\n\nАКТУАЛЬНЫЕ ТРЕНДЫ (используй для вдохновения):\n` +
          recentTrends.map((t, i) => `${i + 1}. "${t.title}" — хук: ${t.hookType}, эмоция: ${t.emotion}, вовлечённость: ${t.engagementRate}%`).join('\n')
      }
    } catch { /* ignore trend fetch errors */ }

    const systemPrompt = getSystemPrompt(platform, settings.language, settings.niche, settings.contentStrategy)

    const userPrompt = `Создай вирусный сценарий короткого видео на тему "${keyword}".
Тип контента: ${contentType}
Эмоция: ${emotion}
Платформа: ${platform === 'tiktok' ? 'TikTok' : 'YouTube Shorts'}${trendsContext}

Please respond in JSON format with the following structure:
{
  "title": "short catchy title",
  "hook": "attention-grabbing first line",
  "contentType": "${contentType}",
  "emotion": "${emotion}",
  "targetAudience": "description of target audience",
  "hashtags": ["tag1", "tag2", "tag3", "tag4", "tag5"],
  "totalDuration": "15s",
  "style": "cinematic",
  "scenes": [
    {
      "sceneNumber": 1,
      "sceneName": "Хук",
      "duration": "3s",
      "text": "voiceover text for this scene",
      "visualDescription": "detailed visual description for video generation",
      "cameraAngle": "camera angle description",
      "musicMood": "music mood",
      "transition": "transition type",
      "subtitleText": "SHORT text with KEY WORDS in CAPS"
    }
  ]
}

Создай ровно 5 сцен: Хук, Завязка, Усиление, Кульминация, CTA.
Respond with raw JSON only. Do not include code blocks, markdown, or any other formatting.`

    const apiKey = process.env.ABACUSAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
        temperature: 0.9,
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('LLM API error:', errText)
      return NextResponse.json({ error: 'Ошибка генерации. Попробуйте ещё раз.' }, { status: 500 })
    }

    const llmData = await response.json()
    const content = llmData?.choices?.[0]?.message?.content
    if (!content) {
      return NextResponse.json({ error: 'Пустой ответ от AI' }, { status: 500 })
    }

    let scriptData: any
    try {
      scriptData = parseLLMJson(content)
    } catch {
      console.error('Failed to parse LLM response:', content)
      return NextResponse.json({ error: 'Ошибка парсинга ответа AI' }, { status: 500 })
    }

    const videoScript = await prisma.videoScript.create({
      data: {
        userId: user.id,
        platform,
        title: scriptData.title ?? 'Без названия',
        hook: scriptData.hook ?? '',
        contentType: scriptData.contentType ?? contentType,
        emotion: scriptData.emotion ?? emotion,
        fullScript: scriptData,
        status: 'ready',
      },
    })

    return NextResponse.json({
      success: true,
      script: {
        id: videoScript.id,
        title: videoScript.title,
        platform: videoScript.platform,
        hook: videoScript.hook,
        contentType: videoScript.contentType,
        emotion: videoScript.emotion,
        status: videoScript.status,
      },
    })
  } catch (error: any) {
    console.error('Generate error:', error)
    return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 })
  }
}
