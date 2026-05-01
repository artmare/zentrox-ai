export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { exec } from 'child_process'
import { promisify } from 'util'
import fs from 'fs/promises'
import path from 'path'
import os from 'os'

const execAsync = promisify(exec)
const MAX_DOWNLOAD_SIZE_BYTES = 500 * 1024 * 1024
const ALLOWED_VIDEO_CONTENT_TYPES = ['video/mp4', 'video/quicktime', 'video/webm', 'application/octet-stream']

function shellEscape(value: string): string {
  return `"${value.replace(/"/g, '\\"')}"`
}

function parseUploaderOutput(stdout: string): { url: string | null; externalId: string | null } {
  const output = stdout.trim()
  if (!output) return { url: null, externalId: null }

  try {
    const parsed = JSON.parse(output)
    return {
      url: parsed?.url ?? parsed?.video_url ?? null,
      externalId: parsed?.externalId ?? parsed?.external_id ?? null,
    }
  } catch {
    const urlMatch = output.match(/https?:\/\/\S+/)
    return { url: urlMatch?.[0] ?? null, externalId: null }
  }
}

async function resolveScriptPath(): Promise<string> {
  const localScript = path.join(process.cwd(), 'scripts', 'tiktok_upload.py')
  const backendScript = path.join(process.cwd(), '..', 'backend', 'scripts', 'tiktok_upload.py')

  try {
    await fs.access(localScript)
    return localScript
  } catch {}

  await fs.access(backendScript)
  return backendScript
}

async function ensureLocalVideoPath(videoPathOrUrl: string): Promise<string> {
  if (!/^https?:\/\//i.test(videoPathOrUrl)) {
    return videoPathOrUrl
  }

  const res = await fetch(videoPathOrUrl)
  if (!res.ok) {
    throw new Error(`Не удалось скачать видео: ${res.status}`)
  }

  const contentType = (res.headers.get('content-type') ?? '').toLowerCase()
  if (!ALLOWED_VIDEO_CONTENT_TYPES.some((allowedType) => contentType.includes(allowedType))) {
    throw new Error(`Неподдерживаемый content-type: ${contentType || 'unknown'}`)
  }

  const contentLength = Number(res.headers.get('content-length') ?? '0')
  if (contentLength > MAX_DOWNLOAD_SIZE_BYTES) {
    throw new Error('Файл слишком большой. Максимум 500MB.')
  }

  const arr = await res.arrayBuffer()
  if (arr.byteLength > MAX_DOWNLOAD_SIZE_BYTES) {
    throw new Error('Файл слишком большой. Максимум 500MB.')
  }
  const tempPath = path.join(os.tmpdir(), `zentrox-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.mp4`)
  await fs.writeFile(tempPath, Buffer.from(arr))
  return tempPath
}

function parseScheduledAt(value: unknown): Date | null {
  if (value === undefined || value === null || value === '') return null
  const parsed = new Date(String(value))
  if (Number.isNaN(parsed.getTime())) return null
  return parsed
}

async function resolvePythonBinary(): Promise<string> {
  try {
    await execAsync('python3 --version')
    return 'python3'
  } catch {
    try {
      await execAsync('python --version')
      return 'python'
    } catch {
      throw new Error('Не найден Python интерпретатор. Установите python3 или python в PATH.')
    }
  }
}

/* ─── Simulate publishing in background ─── */
async function simulatePublish(
  pubId: string,
  scriptId: string,
  account: { id: string; credentials: any },
  videoId: string | null,
  videoPath: string | null,
  description: string,
  hashtagsList: string[]
) {
  let tempVideoPath: string | null = null
  try {
    if (!videoPath) {
      throw new Error('Нет готового видео для публикации')
    }

    const credentials = typeof account.credentials === 'object' && account.credentials !== null ? account.credentials : {}
    const sessionid = String(credentials?.sessionid ?? credentials?.sessionId ?? '').trim()
    if (!sessionid) {
      throw new Error('Не найден sessionid в credentials аккаунта')
    }

    const scriptPath = await resolveScriptPath()
    const localVideoPath = await ensureLocalVideoPath(videoPath)
    if (/^https?:\/\//i.test(videoPath)) {
      tempVideoPath = localVideoPath
    }
    const hashtags = hashtagsList.map((h: string) => h.replace(/^#/, '').trim()).filter(Boolean).join(',')
    const pythonBinary = await resolvePythonBinary()
    const command =
      `${pythonBinary} ${shellEscape(scriptPath)} ` +
      `--video ${shellEscape(localVideoPath)} ` +
      `--sessionid ${shellEscape(sessionid)} ` +
      `--description ${shellEscape(description)} ` +
      `--hashtags ${shellEscape(hashtags)}`

    const { stdout, stderr } = await execAsync(command)
    if (stderr?.trim()) {
      console.warn('tiktok_upload stderr:', stderr)
    }
    const parsed = parseUploaderOutput(stdout ?? '')
    if (!parsed.url) {
      throw new Error('Скрипт не вернул URL опубликованного видео')
    }

    await prisma.publication.update({
      where: { id: pubId },
      data: {
        status: 'published',
        publishedAt: new Date(),
        externalId: parsed.externalId,
        url: parsed.url,
      },
    })

    await prisma.socialAccount.update({
      where: { id: account.id },
      data: {
        postsToday: { increment: 1 },
        lastPostedAt: new Date(),
      },
    })

    await prisma.videoScript.update({
      where: { id: scriptId },
      data: { status: 'published' },
    }).catch(() => {})

    // If there's a video, update its publishedUrl too
    if (videoId) {
      await prisma.generatedVideo.update({
        where: { id: videoId },
        data: { publishedUrl: parsed.url, publishedAt: new Date() },
      }).catch(() => {})
    }
  } catch (e) {
    console.error('simulatePublish error:', e)
    try {
      await prisma.publication.update({
        where: { id: pubId },
        data: { status: 'failed', errorLog: String(e) },
      })
    } catch {}
  } finally {
    if (tempVideoPath) {
      await fs.unlink(tempVideoPath).catch(() => {})
    }
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
    const { scriptId, accountIds, scheduledAt } = body ?? {}
    const parsedScheduledAt = parseScheduledAt(scheduledAt)
    if (scheduledAt !== undefined && scheduledAt !== null && scheduledAt !== '' && !parsedScheduledAt) {
      return NextResponse.json({ error: 'Некорректный формат scheduledAt' }, { status: 400 })
    }


    if (!scriptId || !accountIds?.length) {
      return NextResponse.json({ error: 'Укажите сценарий и хотя бы один аккаунт' }, { status: 400 })
    }

    const script = await prisma.videoScript.findFirst({
      where: { id: scriptId, userId: user.id },
    })
    if (!script) return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 })

    // Find video for this script
    const video = await prisma.generatedVideo.findFirst({
      where: { scriptId, userId: user.id, status: 'ready' },
      orderBy: { createdAt: 'desc' },
    })

    const accounts = await prisma.socialAccount.findMany({
      where: { id: { in: accountIds }, userId: user.id, isActive: true },
    })
    if (accounts.length === 0) {
      return NextResponse.json({ error: 'Нет активных аккаунтов' }, { status: 400 })
    }

    const fullScript = script.fullScript as any
    const publications = []

    for (const account of accounts) {
      if (account.postsToday >= account.dailyLimit) {
        publications.push({
          accountId: account.id,
          accountName: account.accountName,
          status: 'skipped',
          reason: `Лимит ${account.dailyLimit} постов/день исчерпан`,
        })
        continue
      }

      const hashtags = (fullScript?.hashtags ?? []).map((h: string) => h.startsWith('#') ? h : `#${h}`).join(' ')
      const caption = `${script.hook}\n\n${hashtags}`

      const pub = await prisma.publication.create({
        data: {
          id: crypto.randomUUID(),
          videoId: video?.id ?? null,
          userId: user.id,
          accountId: account.id,
          platform: account.platform,
          status: parsedScheduledAt ? 'scheduled' : 'publishing',
          scheduledAt: parsedScheduledAt,
          caption,
          hashtags: fullScript?.hashtags ?? [],
        },
      })

      // Fire-and-forget: simulate actual publishing in background
      if (!parsedScheduledAt) {
        simulatePublish(
          pub.id,
          script.id,
          { id: account.id, credentials: account.credentials },
          video?.id ?? null,
          video?.videoPath ?? null,
          script.hook,
          fullScript?.hashtags ?? []
        )
      }

      publications.push({
        publicationId: pub.id,
        accountId: account.id,
        accountName: account.accountName,
        platform: account.platform,
        status: pub.status,
        caption: caption.slice(0, 100) + '...',
      })
    }

    const hasRealPublishesInProgress = publications.some((publication: any) => publication.status === 'publishing')
    const hasScheduledPublishes = publications.some((publication: any) => publication.status === 'scheduled')
    const scriptStatus = hasRealPublishesInProgress ? 'publishing' : hasScheduledPublishes ? 'scheduled' : script.status

    if (scriptStatus !== script.status) {
      await prisma.videoScript.update({
        where: { id: scriptId },
        data: { status: scriptStatus },
      })
    }

    return NextResponse.json({
      success: true,
      scriptTitle: script.title,
      publications,
    })
  } catch (error: any) {
    console.error('Publish error:', error)
    return NextResponse.json({ error: 'Ошибка публикации' }, { status: 500 })
  }
}

/* ─── GET: Fetch publication statuses ─── */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const pubIds = searchParams.get('ids')

    if (pubIds) {
      const ids = pubIds.split(',')
      const pubs = await prisma.publication.findMany({
        where: { id: { in: ids }, userId: user.id },
        include: { account: { select: { accountName: true, platform: true } } },
      })
      return NextResponse.json(pubs)
    }

    const pubs = await prisma.publication.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { account: { select: { accountName: true, platform: true } } },
    })
    return NextResponse.json(pubs)
  } catch (error: any) {
    console.error('Fetch publications error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}
