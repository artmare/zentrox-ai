export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, password } = body ?? {}
    if (!email || !password) {
      return NextResponse.json({ error: 'Email и пароль обязательны' }, { status: 400 })
    }
    const user = await prisma.user.findUnique({ where: { email } })
    if (!user || !user.passwordHash) {
      return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 })
    }
    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json({ error: 'Неверные учетные данные' }, { status: 401 })
    }
    return NextResponse.json({ id: user?.id, email: user?.email, name: user?.name })
  } catch (error: any) {
    console.error('Login error:', error)
    return NextResponse.json({ error: 'Ошибка авторизации' }, { status: 500 })
  }
}
