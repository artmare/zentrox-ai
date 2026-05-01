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
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }

    const scripts = await prisma.videoScript.findMany({
      where: { userId: user.id },
      select: { createdAt: true, contentType: true, platform: true, title: true },
      orderBy: { createdAt: 'desc' },
    })

    // Scripts per day (last 14 days)
    const dayMap: Record<string, number> = {}
    const now = new Date()
    for (let i = 13; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().slice(0, 10)
      dayMap[key] = 0
    }
    (scripts ?? []).forEach((s: any) => {
      const key = new Date(s?.createdAt).toISOString().slice(0, 10)
      if (dayMap[key] !== undefined) dayMap[key]++
    })
    const perDay = Object.entries(dayMap ?? {}).map(([date, count]: [string, number]) => ({ date, count }))

    // Content types distribution
    const typeMap: Record<string, number> = {}
    ;(scripts ?? []).forEach((s: any) => {
      const t = s?.contentType ?? 'unknown'
      typeMap[t] = (typeMap[t] ?? 0) + 1
    })
    const contentTypes = Object.entries(typeMap ?? {}).map(([name, value]: [string, number]) => ({ name, value }))

    // Top 5 recent ideas
    const topIdeas = (scripts ?? []).slice(0, 5).map((s: any) => ({
      title: s?.title ?? '',
      platform: s?.platform ?? '',
      contentType: s?.contentType ?? '',
    }))

    // Platform-specific metrics (Block 12)
    const videoAnalytics = await prisma.videoAnalytic.findMany({
      where: { userId: user.id },
      orderBy: { collectedAt: 'desc' },
      take: 50,
    })

    const tiktokMetrics = videoAnalytics.filter(v => v.platform === 'tiktok')
    const youtubeMetrics = videoAnalytics.filter(v => v.platform === 'youtube_shorts')

    const platformMetrics = {
      tiktok: {
        avgRetention: tiktokMetrics.length > 0 ? (tiktokMetrics.reduce((a, v) => a + (v.retentionRate ?? 0), 0) / tiktokMetrics.length).toFixed(1) : '0',
        avgEngagement: tiktokMetrics.length > 0 ? (tiktokMetrics.reduce((a, v) => a + (v.engagementRate ?? 0), 0) / tiktokMetrics.length).toFixed(1) : '0',
        totalViews: tiktokMetrics.reduce((a, v) => a + (v.views ?? 0), 0),
        totalLikes: tiktokMetrics.reduce((a, v) => a + (v.likes ?? 0), 0),
      },
      youtube: {
        avgCtr: youtubeMetrics.length > 0 ? (youtubeMetrics.reduce((a, v) => a + (v.ctr ?? 0), 0) / youtubeMetrics.length).toFixed(1) : '0',
        avgWatchTime: youtubeMetrics.length > 0 ? (youtubeMetrics.reduce((a, v) => a + (v.watchTimeSeconds ?? 0), 0) / youtubeMetrics.length).toFixed(0) : '0',
        totalViews: youtubeMetrics.reduce((a, v) => a + (v.views ?? 0), 0),
        totalLikes: youtubeMetrics.reduce((a, v) => a + (v.likes ?? 0), 0),
      },
    }

    return NextResponse.json({ perDay, contentTypes, topIdeas, totalScripts: scripts?.length ?? 0, platformMetrics })
  } catch (error: any) {
    console.error('Analytics error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
