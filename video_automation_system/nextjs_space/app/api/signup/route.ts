export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password, name } = body ?? {}

    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
    }

    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ error: 'Пользователь с таким email уже существует' }, { status: 409 })
    }

    const passwordHash = await bcrypt.hash(password, 12)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: name ?? '',
        settings: {
          create: {
            platforms: JSON.stringify(['youtube_shorts']),
            niche: 'motivation',
            language: 'russian',
            videosPerDay: 5,
          },
        },
      },
    })

    return NextResponse.json({ id: user?.id, email: user?.email }, { status: 201 })
  } catch (error: any) {
    console.error('Signup error:', error)
    if (
      error instanceof Prisma.PrismaClientInitializationError ||
      String(error?.message ?? '').includes("Can't reach database server")
    ) {
      return NextResponse.json(
        { error: 'База данных недоступна. Проверьте DATABASE_URL, VPN/сеть и доступ к Postgres.' },
        { status: 503 }
      )
    }
    return NextResponse.json({ error: 'Ошибка регистрации' }, { status: 500 })
  }
}
