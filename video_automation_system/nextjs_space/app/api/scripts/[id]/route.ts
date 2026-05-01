export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    }
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) {
      return NextResponse.json({ error: 'Пользователь не найден' }, { status: 404 })
    }
    const script = await prisma.videoScript.findFirst({
      where: { id: params?.id, userId: user.id },
    })
    if (!script) {
      return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 })
    }
    return NextResponse.json(script)
  } catch (error: any) {
    console.error('Get script error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
