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
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const accounts = await prisma.socialAccount.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        accountName: true,
        username: true,
        proxyUrl: true,
        isActive: true,
        isWarmedUp: true,
        lastPostedAt: true,
        postsToday: true,
        dailyLimit: true,
        notes: true,
        createdAt: true,
        _count: { select: { publications: true } },
      },
    })

    return NextResponse.json(accounts)
  } catch (error: any) {
    console.error('Accounts GET error:', error)
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

    const body = await request.json()
    const { platform, accountName, username, credentials, proxyUrl, dailyLimit, notes } = body ?? {}

    if (!platform || !accountName) {
      return NextResponse.json({ error: 'Укажите платформу и название аккаунта' }, { status: 400 })
    }

    const account = await prisma.socialAccount.create({
      data: {
        userId: user.id,
        platform,
        accountName,
        username: username ?? '',
        credentials: credentials ?? {},
        proxyUrl: proxyUrl ?? null,
        dailyLimit: dailyLimit ?? 3,
        notes: notes ?? null,
      },
    })

    return NextResponse.json({ success: true, account })
  } catch (error: any) {
    console.error('Accounts POST error:', error)
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
    const { id, ...updates } = body ?? {}

    if (!id) return NextResponse.json({ error: 'Укажите id' }, { status: 400 })

    // Verify ownership
    const existing = await prisma.socialAccount.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Аккаунт не найден' }, { status: 404 })

    const account = await prisma.socialAccount.update({
      where: { id },
      data: {
        accountName: updates.accountName ?? undefined,
        username: updates.username ?? undefined,
        credentials: updates.credentials ?? undefined,
        proxyUrl: updates.proxyUrl ?? undefined,
        isActive: updates.isActive ?? undefined,
        isWarmedUp: updates.isWarmedUp ?? undefined,
        dailyLimit: updates.dailyLimit ?? undefined,
        notes: updates.notes ?? undefined,
      },
    })

    return NextResponse.json({ success: true, account })
  } catch (error: any) {
    console.error('Accounts PUT error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'Укажите id' }, { status: 400 })

    const existing = await prisma.socialAccount.findFirst({ where: { id, userId: user.id } })
    if (!existing) return NextResponse.json({ error: 'Аккаунт не найден' }, { status: 404 })

    await prisma.socialAccount.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Accounts DELETE error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
