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
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        title: true,
        hook: true,
        contentType: true,
        emotion: true,
        status: true,
        createdAt: true,
      },
    })
    return NextResponse.json(scripts ?? [])
  } catch (error: any) {
    console.error('Get scripts error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
