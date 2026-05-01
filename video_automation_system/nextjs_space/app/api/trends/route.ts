export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { parseLLMJson } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const trends = await prisma.trend.findMany({
      orderBy: { analyzedAt: 'desc' },
      take: 50,
    })

    // Aggregate stats
    const totalTrends = trends.length
    const avgEngagement = trends.length > 0
      ? (trends.reduce((a, t) => a + (t.engagementRate ?? 0), 0) / trends.length).toFixed(1)
      : '0'
    const topHookTypes = trends.reduce((acc: Record<string, number>, t) => {
      acc[t.hookType] = (acc[t.hookType] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)
    const topEmotions = trends.reduce((acc: Record<string, number>, t) => {
      acc[t.emotion] = (acc[t.emotion] ?? 0) + 1
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      trends,
      stats: {
        totalTrends,
        avgEngagement,
        topHookTypes,
        topEmotions,
      },
    })
  } catch (error: any) {
    console.error('Trends error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }

    const apiKey = process.env.ABACUSAI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 })
    }

    const body = await request.json()
    const platform = body?.platform ?? 'youtube_shorts'
    const niche = body?.niche ?? 'motivation'

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: 'Ты эксперт по вирусному контенту в социальных сетях. Анализируешь тренды и выявляешь паттерны вирусности.' },
          { role: 'user', content: `Проанализируй текущие тренды для ${platform === 'tiktok' ? 'TikTok' : 'YouTube Shorts'} в нише "${niche}".

Верни JSON массив из 5 трендов:
[
  {
    "title": "название тренда",
    "hookType": "тип хука (question/shock/promise/curiosity/controversial)",
    "emotion": "основная эмоция (fear/curiosity/greed/inspiration/surprise)",
    "views": числоПросмотров,
    "engagementRate": процентВовлечения,
    "description": "краткое описание тренда и почему он вирусный",
    "structure": "структура видео",
    "duration": "оптимальная длительность",
    "style": "стиль видео"
  }
]

Respond with raw JSON only.` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 3000,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Ошибка AI анализа' }, { status: 500 })
    }

    const llmData = await response.json()
    const content = llmData?.choices?.[0]?.message?.content
    let parsedTrends: any[] = []
    try {
      const parsed = parseLLMJson(content)
      parsedTrends = Array.isArray(parsed) ? parsed : (parsed?.trends ?? parsed?.data ?? [])
    } catch {
      console.error('Failed to parse trends LLM response:', content)
      return NextResponse.json({ error: 'Ошибка парсинга' }, { status: 500 })
    }

    // Save to DB
    const saved = []
    for (const t of parsedTrends) {
      const trend = await prisma.trend.create({
        data: {
          platform,
          title: t?.title ?? 'Без названия',
          hookType: t?.hookType ?? 'curiosity',
          emotion: t?.emotion ?? 'curiosity',
          views: t?.views ?? 0,
          engagementRate: t?.engagementRate ?? 0,
        },
      })
      saved.push(trend)
    }

    return NextResponse.json({ success: true, trends: saved, analysis: parsedTrends })
  } catch (error: any) {
    console.error('Trend analysis error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
