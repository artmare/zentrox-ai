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

    const settings = user.settings
    const publications = await prisma.publication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 20,
      include: {
        account: { select: { accountName: true, platform: true } },
      },
    })

    return NextResponse.json({
      postingConfig: settings?.postingConfig ?? null,
      antiBanConfig: settings?.antiBanConfig ?? null,
      proxyConfig: settings?.proxyConfig ?? {},
      dailyPostLimit: settings?.dailyPostLimit ?? 3,
      accountWarmupDone: settings?.accountWarmupDone ?? false,
      tiktokCredentials: (settings?.tiktokCredentials && typeof settings.tiktokCredentials === 'object' && Object.keys(settings.tiktokCredentials as object).length > 0) ? { configured: true } : null,
      youtubeCredentials: (settings?.youtubeCredentials && typeof settings.youtubeCredentials === 'object' && Object.keys(settings.youtubeCredentials as object).length > 0) ? { configured: true } : null,
      publications,
    })
  } catch (error: any) {
    console.error('Posting error:', error)
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
        postingConfig: body?.postingConfig ?? undefined,
        antiBanConfig: body?.antiBanConfig ?? undefined,
        proxyConfig: body?.proxyConfig ?? undefined,
        dailyPostLimit: body?.dailyPostLimit ?? undefined,
        accountWarmupDone: body?.accountWarmupDone ?? undefined,
      },
      create: {
        userId: user.id,
        postingConfig: body?.postingConfig ?? {},
        antiBanConfig: body?.antiBanConfig ?? {},
        proxyConfig: body?.proxyConfig ?? {},
        dailyPostLimit: body?.dailyPostLimit ?? 3,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Posting update error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
