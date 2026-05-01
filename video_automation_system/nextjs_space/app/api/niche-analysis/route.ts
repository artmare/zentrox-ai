export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { parseLLMJson } from '@/lib/utils'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const analyses = await prisma.nicheAnalysis.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })
    return NextResponse.json(analyses)
  } catch (error: any) {
    console.error('Niche analysis error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const apiKey = process.env.ABACUSAI_API_KEY
    if (!apiKey) return NextResponse.json({ error: 'API key not configured' }, { status: 500 })

    const body = await request.json()
    const topic = body?.topic ?? 'мотивация'

    const response = await fetch('https://apps.abacus.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        messages: [
          { role: 'system', content: 'Ты эксперт по маркетингу и контент-стратегии. Анализируешь ниши для создания видео-контента.' },
          { role: 'user', content: `Проанализируй тему "${topic}" и найди 3 прибыльные ниши для короткого видео-контента.

Для каждой ниши определи:
1. Целевая аудитория (возраст, интересы, боли)
2. Главная боль / желание аудитории
3. Вирусный потенциал (оценка 1-10)
4. Способы монетизации (партнёрки, продукт, трафик, бренд)
5. Конкурентный анализ

JSON формат:
{
  "niches": [
    {
      "name": "название ниши",
      "audienceProfile": { "age": "18-35", "interests": ["..."], "gender": "mixed" },
      "painPoints": ["боль 1", "боль 2", "боль 3"],
      "viralPotential": 8.5,
      "monetizationMethods": ["партнёрские программы", "инфопродукт"],
      "competitorAnalysis": { "level": "medium", "gap": "описание возможности" },
      "recommendation": "почему эта ниша хороша"
    }
  ],
  "bestNiche": "название лучшей ниши",
  "reasoning": "почему это лучший выбор"
}

Respond with raw JSON only.` },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 4000,
        temperature: 0.8,
      }),
    })

    if (!response.ok) {
      return NextResponse.json({ error: 'Ошибка AI' }, { status: 500 })
    }

    const llmData = await response.json()
    const content = llmData?.choices?.[0]?.message?.content
    let parsed: any
    try {
      parsed = parseLLMJson(content)
    } catch {
      console.error('Failed to parse niche analysis LLM response:', content)
      return NextResponse.json({ error: 'Ошибка парсинга' }, { status: 500 })
    }

    // Save each niche
    const niches = parsed?.niches ?? []
    for (const n of niches) {
      await prisma.nicheAnalysis.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          niche: n?.name ?? topic,
          audienceProfile: n?.audienceProfile ?? {},
          painPoints: n?.painPoints ?? [],
          viralPotential: n?.viralPotential ?? 0,
          monetizationMethods: n?.monetizationMethods ?? [],
          competitorAnalysis: n?.competitorAnalysis ?? {},
        },
      })
    }

    return NextResponse.json({
      success: true,
      niches: parsed?.niches ?? [],
      bestNiche: parsed?.bestNiche ?? '',
      reasoning: parsed?.reasoning ?? '',
    })
  } catch (error: any) {
    console.error('Niche analysis error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
