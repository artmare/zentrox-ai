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
    return NextResponse.json(user?.settings ?? null)
  } catch (error: any) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Ошибка получения настроек' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const body = await request.json()
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    const settings = await prisma.userSettings.upsert({
      where: { userId: user.id },
      update: {
        platforms: body?.platforms ?? '[]',
        niche: body?.niche ?? 'motivation',
        language: body?.language ?? 'russian',
        videosPerDay: body?.videosPerDay ?? 5,
        monetizationSettings: body?.monetizationSettings ?? null,
        autopilotEnabled: body?.autopilotEnabled ?? false,
        scheduleTime: body?.scheduleTime ?? '09:00',
        contentStrategy: body?.contentStrategy ?? 'mixed',
      },
      create: {
        userId: user.id,
        platforms: body?.platforms ?? '[]',
        niche: body?.niche ?? 'motivation',
        language: body?.language ?? 'russian',
        videosPerDay: body?.videosPerDay ?? 5,
        monetizationSettings: body?.monetizationSettings ?? null,
        autopilotEnabled: body?.autopilotEnabled ?? false,
        scheduleTime: body?.scheduleTime ?? '09:00',
        contentStrategy: body?.contentStrategy ?? 'mixed',
      },
    })
    return NextResponse.json(settings)
  } catch (error: any) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Ошибка обновления настроек' }, { status: 500 })
  }
}
