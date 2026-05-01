export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      include: { settings: true },
    })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const strategyLogs = await prisma.strategyLog.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 10,
    })

    const totalScripts = await prisma.videoScript.count({ where: { userId: user.id } })
    const totalPublished = await prisma.publication.count({ where: { userId: user.id, status: 'published' } })
    const totalVideos = await prisma.generatedVideo.count({ where: { userId: user.id } })

    const analytics = await prisma.videoAnalytic.findMany({
      where: { userId: user.id },
      orderBy: { collectedAt: 'desc' },
      take: 20,
    })

    const totalViews = analytics.reduce((a, v) => a + (v.views ?? 0), 0)
    const totalLikes = analytics.reduce((a, v) => a + (v.likes ?? 0), 0)
    const avgRetention = analytics.length > 0
      ? (analytics.reduce((a, v) => a + (v.retentionRate ?? 0), 0) / analytics.length).toFixed(1)
      : '0'
    const avgCtr = analytics.length > 0
      ? (analytics.reduce((a, v) => a + (v.ctr ?? 0), 0) / analytics.length).toFixed(1)
      : '0'

    // Top performing scripts
    const topScripts = await prisma.videoScript.findMany({
      where: { userId: user.id, score: { gt: 0 } },
      orderBy: { score: 'desc' },
      take: 5,
      select: { id: true, title: true, platform: true, contentType: true, score: true },
    })

    return NextResponse.json({
      growthPhase: user.settings?.growthPhase ?? 'testing',
      selfLearningEnabled: user.settings?.selfLearningEnabled ?? true,
      strategyLogs,
      stats: {
        totalScripts,
        totalPublished,
        totalVideos,
        totalViews,
        totalLikes,
        avgRetention,
        avgCtr,
      },
      topScripts,
      analytics,
    })
  } catch (error: any) {
    console.error('Growth error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const body = await request.json()

    await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        growthPhase: body?.growthPhase ?? undefined,
        selfLearningEnabled: body?.selfLearningEnabled ?? undefined,
      },
      create: {
        userId: user.id,
        growthPhase: body?.growthPhase ?? 'testing',
        selfLearningEnabled: body?.selfLearningEnabled ?? true,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Growth update error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
