export const dynamic = 'force-dynamic'

import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadBufferToS3 } from '@/lib/s3'
import crypto from 'crypto'

const LLM_URL = 'https://apps.abacus.ai/v1/chat/completions'
const FFMPEG_CREATE_URL = 'https://apps.abacus.ai/api/createRunFfmpegCommandRequest'
const FFMPEG_STATUS_URL = 'https://apps.abacus.ai/api/getRunFfmpegCommandStatus'
const FAL_KLING_URL = 'https://fal.run/fal-ai/kling-video/v2.1/standard/image-to-video'
const MAX_DOWNLOAD_SIZE_BYTES = 500 * 1024 * 1024

/* ─── helpers ─── */
async function updateProgress(videoId: string, step: string, progress: number, extra?: any) {
  try {
    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: { generationLog: { step, progress, ...extra, updatedAt: new Date().toISOString() } },
    })
  } catch (e) {
    console.error('Progress update failed:', e)
  }
}

async function isVideoCancelled(videoId: string): Promise<boolean> {
  try {
    const v = await prisma.generatedVideo.findUnique({ where: { id: videoId }, select: { status: true } })
    return v?.status === 'cancelled'
  } catch { return false }
}

async function generateImage(prompt: string, apiKey: string): Promise<string | null> {
  try {
    const res = await fetch(LLM_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: 'gpt-5.1',
        messages: [{ role: 'user', content: prompt }],
        modalities: ['image'],
        image_config: { aspect_ratio: '9:16', num_images: 1 },
      }),
    })
    if (!res.ok) {
      console.error('Image gen failed:', res.status, await res.text().catch(() => ''))
      return null
    }
    const data = await res.json()
    const images = data?.choices?.[0]?.message?.images
    if (images && images.length > 0) {
      const url = images[0]?.image_url?.url ?? images[0]?.url ?? null
      return url
    }
    return null
  } catch (e) {
    console.error('Image gen error:', e)
    return null
  }
}

async function uploadBase64Image(dataUrl: string, name: string): Promise<string | null> {
  try {
    // dataUrl format: data:image/png;base64,<base64data>
    const matches = dataUrl.match(/^data:image\/(\w+);base64,(.+)$/)
    if (!matches) {
      // If it's already an HTTP URL, return as-is
      if (dataUrl.startsWith('http')) return dataUrl
      console.error('Invalid data URL format')
      return null
    }
    const ext = matches[1]
    const base64Data = matches[2]
    const buffer = Buffer.from(base64Data, 'base64')
    const publicUrl = await uploadBufferToS3(buffer, `${name}.${ext}`, `image/${ext}`, true)
    return publicUrl
  } catch (e) {
    console.error('Upload image error:', e)
    return null
  }
}

async function runFfmpeg(
  inputFiles: Record<string, string>,
  outputFiles: Record<string, string>,
  ffmpegCommand: string,
  apiKey: string
): Promise<Record<string, string> | null> {
  try {
    const createRes = await fetch(FFMPEG_CREATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        deployment_token: apiKey,
        input_files: inputFiles,
        output_files: outputFiles,
        ffmpeg_command: ffmpegCommand,
        max_command_run_seconds: 300,
      }),
    })
    if (!createRes.ok) {
      console.error('FFmpeg create failed:', await createRes.text().catch(() => ''))
      return null
    }
    const { request_id } = await createRes.json()
    if (!request_id) return null

    for (let i = 0; i < 300; i++) {
      await new Promise(r => setTimeout(r, 2000))
      const statusRes = await fetch(FFMPEG_STATUS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ request_id, deployment_token: apiKey }),
      })
      const statusData = await statusRes.json()
      if (statusData?.status === 'SUCCESS' && statusData?.result?.result) {
        return statusData.result.result
      }
      if (statusData?.status === 'FAILED') {
        console.error('FFmpeg failed:', statusData?.result?.error)
        return null
      }
    }
    return null
  } catch (e) {
    console.error('FFmpeg error:', e)
    return null
  }
}

async function generateKlingVideo(imageUrl: string, prompt: string, falApiKey: string): Promise<string | null> {
  try {
    const startRes = await fetch(FAL_KLING_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Key ${falApiKey}`,
      },
      body: JSON.stringify({
        image_url: imageUrl,
        prompt,
      }),
    })

    if (!startRes.ok) {
      console.error('Kling start failed:', startRes.status, await startRes.text().catch(() => ''))
      return null
    }

    const startData = await startRes.json()
    const directUrl =
      startData?.video?.url ??
      startData?.video_url ??
      startData?.data?.video?.url ??
      startData?.output?.video?.url ??
      null
    if (directUrl) return directUrl

    const statusUrl = startData?.status_url ?? startData?.urls?.status ?? null
    if (!statusUrl) return null

    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 2500))
      const statusRes = await fetch(statusUrl, {
        headers: { Authorization: `Key ${falApiKey}` },
      })
      if (!statusRes.ok) continue
      const statusData = await statusRes.json()
      const status = String(statusData?.status ?? statusData?.state ?? '').toUpperCase()
      const videoUrl =
        statusData?.video?.url ??
        statusData?.video_url ??
        statusData?.data?.video?.url ??
        statusData?.output?.video?.url ??
        null
      if (videoUrl) return videoUrl
      if (status.includes('COMPLETED') || status.includes('SUCCESS')) return null
      if (status.includes('FAILED') || status.includes('ERROR')) {
        console.error('Kling failed:', statusData)
        return null
      }
    }
    return null
  } catch (e) {
    console.error('Kling error:', e)
    return null
  }
}

async function generateVoiceoverAudio(voiceoverText: string, elevenLabsApiKey: string, voiceId: string): Promise<Buffer | null> {
  try {
    const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'audio/mpeg',
        'xi-api-key': elevenLabsApiKey,
      },
      body: JSON.stringify({
        text: voiceoverText,
        model_id: 'eleven_multilingual_v2',
      }),
    })
    if (!res.ok) {
      console.error('ElevenLabs TTS failed:', res.status, await res.text().catch(() => ''))
      return null
    }
    const contentType = (res.headers.get('content-type') ?? '').toLowerCase()
    if (!contentType.includes('audio/')) {
      console.error('Unexpected ElevenLabs content-type:', contentType || 'unknown')
      return null
    }

    const contentLength = Number(res.headers.get('content-length') ?? '0')
    if (contentLength > MAX_DOWNLOAD_SIZE_BYTES) {
      console.error('ElevenLabs response too large:', contentLength)
      return null
    }

    const arr = await res.arrayBuffer()
    if (arr.byteLength > MAX_DOWNLOAD_SIZE_BYTES) {
      console.error('ElevenLabs response exceeded max size after download:', arr.byteLength)
      return null
    }
    return Buffer.from(arr)
  } catch (e) {
    console.error('ElevenLabs TTS error:', e)
    return null
  }
}

/* ─── Background generation ─── */
async function generateVideoAsync(videoId: string, script: any, apiKey: string, falApiKey: string, elevenLabsApiKey: string, elevenLabsVoiceId: string) {
  try {
    const fullScript = script.fullScript as any
    const scenes = fullScript?.scenes ?? []

    if (scenes.length === 0) {
      await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: 'failed', generationLog: { error: 'Нет сцен', progress: 0 } } })
      return
    }

    const totalSteps = scenes.length * 3 + 2 // images + voiceovers + scene videos + concat + thumbnail
    let completedSteps = 0

    // Step 1: Generate images and upload to S3
    const generatedSceneImages: Array<{ sceneIndex: number; imageUrl: string }> = []
    for (let i = 0; i < scenes.length; i++) {
      if (await isVideoCancelled(videoId)) return

      const scene = scenes[i]
      const visualDesc = scene?.visualDescription ?? scene?.visual ?? scene?.visualPrompt ?? scene?.description ?? `Scene ${i + 1}`
      const prompt = `Create a cinematic vertical video frame (9:16) for a short-form video. Scene: ${visualDesc}. Style: dramatic lighting, high contrast, professional quality, suitable for ${script.platform === 'tiktok' ? 'TikTok' : 'YouTube Shorts'}. Visually striking and engaging.`

      await updateProgress(videoId, 'generating_images', Math.round((completedSteps / totalSteps) * 100), { currentScene: i + 1, totalScenes: scenes.length })

      let imageDataUrl = await generateImage(prompt, apiKey)
      if (!imageDataUrl) {
        // Fallback with simpler prompt
        imageDataUrl = await generateImage(
          `Cinematic vertical frame (9:16): ${scene?.voiceover?.slice(0, 80) ?? 'dramatic scene'}. High quality, dark.`,
          apiKey
        )
      }

      if (imageDataUrl) {
        const publicUrl = await uploadBase64Image(imageDataUrl, `video_${videoId}_scene_${i}`)
        if (publicUrl) {
          generatedSceneImages.push({ sceneIndex: i, imageUrl: publicUrl })
        } else {
          console.warn(`Scene ${i + 1}: upload to S3 failed`)
        }
      } else {
        console.warn(`Scene ${i + 1}: image generation failed`)
      }
      completedSteps++
    }

    if (generatedSceneImages.length === 0) {
      await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: 'failed', generationLog: { error: 'Не удалось сгенерировать изображения', progress: 0 } } })
      await prisma.videoScript.update({ where: { id: script.id }, data: { status: 'draft' } })
      return
    }

    // Step 2: Generate voiceovers for every scene and upload to S3
    const voiceoverUrls: (string | null)[] = []
    for (let i = 0; i < scenes.length; i++) {
      if (await isVideoCancelled(videoId)) return
      await updateProgress(videoId, 'generating_voiceovers', Math.round((completedSteps / totalSteps) * 100), { currentScene: i + 1, totalScenes: scenes.length })

      const scene = scenes[i]
      const voiceoverText = String(scene?.voiceover ?? '').trim()
      if (!voiceoverText) {
        voiceoverUrls.push(null)
        completedSteps++
        continue
      }

      const audioBuffer = await generateVoiceoverAudio(voiceoverText, elevenLabsApiKey, elevenLabsVoiceId)
      if (!audioBuffer) {
        voiceoverUrls.push(null)
        completedSteps++
        continue
      }

      const s3AudioUrl = await uploadBufferToS3(audioBuffer, `video_${videoId}_scene_${i}_voiceover.mp3`, 'audio/mpeg', true)
      voiceoverUrls.push(s3AudioUrl ?? null)

      await updateProgress(videoId, 'generating_voiceovers', Math.round((completedSteps / totalSteps) * 100), {
        currentScene: i + 1,
        totalScenes: scenes.length,
        voiceoverUrls,
      })
      completedSteps++
    }

    // Step 3: Create scene videos via FAL Kling
    const sceneDuration = Math.max(3, Math.floor(55 / generatedSceneImages.length))
    const sceneVideoUrls: string[] = []

    for (let i = 0; i < generatedSceneImages.length; i++) {
      if (await isVideoCancelled(videoId)) return

      await updateProgress(videoId, 'creating_scenes', Math.round((completedSteps / totalSteps) * 100), { currentScene: i + 1, totalScenes: generatedSceneImages.length })

      const generatedScene = generatedSceneImages[i]
      const scene = scenes[generatedScene.sceneIndex] ?? {}
      const prompt = String(scene?.visualDescription ?? scene?.visual ?? scene?.visualPrompt ?? scene?.description ?? `Scene ${generatedScene.sceneIndex + 1}`)
      const sceneVideoUrl = await generateKlingVideo(generatedScene.imageUrl, prompt, falApiKey)

      if (sceneVideoUrl) {
        sceneVideoUrls.push(sceneVideoUrl)
      }
      completedSteps++
    }

    if (sceneVideoUrls.length === 0) {
      await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: 'failed', generationLog: { error: 'Ошибка создания сцен', progress: 0 } } })
      await prisma.videoScript.update({ where: { id: script.id }, data: { status: 'draft' } })
      return
    }

    // Step 4: Concatenate all scenes with background audio
    if (await isVideoCancelled(videoId)) return
    await updateProgress(videoId, 'concatenating', Math.round((completedSteps / totalSteps) * 100))

    const concatInputs: Record<string, string> = {}
    let filterInputs = ''
    let concatFilter = ''
    for (let i = 0; i < sceneVideoUrls.length; i++) {
      concatInputs[`in_${i + 1}`] = sceneVideoUrls[i]
      filterInputs += `-i {{in_${i + 1}}} `
      concatFilter += `[${i}:v]`
    }
    const totalDuration = sceneVideoUrls.length * sceneDuration
    // Concat video + generate ambient audio (layered sine pads + filtered noise for cinematic feel)
    concatFilter += `concat=n=${sceneVideoUrls.length}:v=1:a=0[outv];` +
      `anoisesrc=d=${totalDuration}:c=pink:r=44100:a=0.015[noise];` +
      `sine=frequency=174:duration=${totalDuration}:sample_rate=44100,volume=0.04[s1];` +
      `sine=frequency=261:duration=${totalDuration}:sample_rate=44100,volume=0.025[s2];` +
      `sine=frequency=349:duration=${totalDuration}:sample_rate=44100,volume=0.02[s3];` +
      `[noise][s1][s2][s3]amix=inputs=4:duration=first[mix];` +
      `[mix]lowpass=f=600,afade=t=in:st=0:d=2,afade=t=out:st=${Math.max(0, totalDuration - 3)}:d=3[outa]`

    const finalResult = await runFfmpeg(
      concatInputs,
      { out_1: 'final_video.mp4' },
      `${filterInputs}-filter_complex "${concatFilter}" -map "[outv]" -map "[outa]" -c:v libx264 -preset fast -crf 23 -pix_fmt yuv420p -c:a aac -b:a 128k -shortest {{out_1}}`,
      apiKey
    )
    completedSteps++

    if (!finalResult?.out_1) {
      await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: 'failed', generationLog: { error: 'Ошибка сборки видео', progress: 0 } } })
      await prisma.videoScript.update({ where: { id: script.id }, data: { status: 'draft' } })
      return
    }

    // Step 5: Thumbnail
    await updateProgress(videoId, 'thumbnail', Math.round((completedSteps / totalSteps) * 100))
    const thumbResult = await runFfmpeg(
      { in_1: finalResult.out_1 },
      { out_1: 'thumbnail.jpg' },
      `-i {{in_1}} -vf "select=eq(n\\,0)" -frames:v 1 -q:v 2 {{out_1}}`,
      apiKey
    )
    completedSteps++

    await prisma.generatedVideo.update({
      where: { id: videoId },
      data: {
        status: 'ready',
        videoPath: finalResult.out_1,
        thumbnailPath: thumbResult?.out_1 ?? null,
        durationSeconds: totalDuration,
        generationLog: { step: 'completed', progress: 100, scenes: sceneVideoUrls.length, totalDuration, voiceoverUrls, completedAt: new Date().toISOString() },
      },
    })
    await prisma.videoScript.update({ where: { id: script.id }, data: { status: 'ready' } })
  } catch (error: any) {
    console.error('Async video gen error:', error)
    await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: 'failed', generationLog: { error: error?.message ?? 'Unknown error', progress: 0 } } }).catch(() => {})
    await prisma.videoScript.update({ where: { id: script.id }, data: { status: 'draft' } }).catch(() => {})
  }
}

/* ─── POST: Start video generation (async) ─── */
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const body = await request.json()
    const { scriptId } = body ?? {}
    if (!scriptId) return NextResponse.json({ error: 'Укажите scriptId' }, { status: 400 })

    const script = await prisma.videoScript.findFirst({ where: { id: scriptId, userId: user.id } })
    if (!script) return NextResponse.json({ error: 'Сценарий не найден' }, { status: 404 })

    const apiKey = process.env.ABACUSAI_API_KEY
    const falApiKey = process.env.FAL_API_KEY
    const elevenLabsApiKey = process.env.ELEVENLABS_API_KEY
    const elevenLabsVoiceId = process.env.ELEVENLABS_VOICE_ID
    if (!apiKey) return NextResponse.json({ error: 'API ключ не настроен' }, { status: 500 })
    if (!falApiKey) return NextResponse.json({ error: 'FAL_API_KEY не настроен' }, { status: 500 })
    if (!elevenLabsApiKey) return NextResponse.json({ error: 'ELEVENLABS_API_KEY не настроен' }, { status: 500 })
    if (!elevenLabsVoiceId) return NextResponse.json({ error: 'ELEVENLABS_VOICE_ID не настроен' }, { status: 500 })

    const videoId = crypto.randomUUID()
    await prisma.generatedVideo.create({
      data: {
        id: videoId,
        scriptId: script.id,
        userId: user.id,
        platform: script.platform,
        status: 'generating',
        generationLog: { step: 'started', progress: 0, startedAt: new Date().toISOString() },
      },
    })
    await prisma.videoScript.update({ where: { id: scriptId }, data: { status: 'generating' } })

    // Fire and forget — generation runs in background
    generateVideoAsync(videoId, script, apiKey, falApiKey, elevenLabsApiKey, elevenLabsVoiceId).catch(err => {
      console.error('Background generation crashed:', err)
    })

    return NextResponse.json({ success: true, videoId, status: 'generating' })
  } catch (error: any) {
    console.error('Video generate error:', error)
    return NextResponse.json({ error: 'Ошибка: ' + (error?.message ?? '') }, { status: 500 })
  }
}

/* ─── GET: Check status / list videos ─── */
export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const scriptId = searchParams.get('scriptId')
    const videoId = searchParams.get('videoId')

    if (videoId) {
      const video = await prisma.generatedVideo.findFirst({
        where: { id: videoId, userId: user.id },
        include: { script: { select: { title: true, platform: true, hook: true } } },
      })
      return NextResponse.json(video ?? null)
    }

    if (scriptId) {
      const video = await prisma.generatedVideo.findFirst({
        where: { scriptId, userId: user.id },
        orderBy: { createdAt: 'desc' },
      })
      return NextResponse.json(video ?? null)
    }

    const videos = await prisma.generatedVideo.findMany({
      where: { userId: user.id },
      orderBy: { createdAt: 'desc' },
      take: 50,
      include: { script: { select: { title: true, platform: true, hook: true } } },
    })
    return NextResponse.json(videos)
  } catch (error: any) {
    console.error('Video status error:', error)
    return NextResponse.json({ error: 'Ошибка' }, { status: 500 })
  }
}

/* ─── DELETE: Cancel video generation ─── */
export async function DELETE(request: Request) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) return NextResponse.json({ error: 'Не авторизован' }, { status: 401 })
    const user = await prisma.user.findUnique({ where: { email: session.user.email } })
    if (!user) return NextResponse.json({ error: 'Не найден' }, { status: 404 })

    const { searchParams } = new URL(request.url)
    const videoId = searchParams.get('videoId')
    if (!videoId) return NextResponse.json({ error: 'Укажите videoId' }, { status: 400 })

    const video = await prisma.generatedVideo.findFirst({ where: { id: videoId, userId: user.id } })
    if (!video) return NextResponse.json({ error: 'Видео не найдено' }, { status: 404 })

    const doDelete = searchParams.get('delete') === 'true'

    if (doDelete) {
      // Permanent delete — any status
      await prisma.generatedVideo.delete({ where: { id: videoId } })
      if (video.scriptId) {
        await prisma.videoScript.update({ where: { id: video.scriptId }, data: { status: 'draft' } }).catch(() => {})
      }
      return NextResponse.json({ success: true, deleted: true })
    }

    // Cancel generation — allow for generating, pending, and stuck videos
    if (!['generating', 'pending'].includes(video.status ?? '')) {
      return NextResponse.json({ error: 'Можно отменить только генерирующееся видео' }, { status: 400 })
    }

    await prisma.generatedVideo.update({ where: { id: videoId }, data: { status: 'cancelled', generationLog: { step: 'cancelled', progress: 0 } } })
    if (video.scriptId) {
      await prisma.videoScript.update({ where: { id: video.scriptId }, data: { status: 'draft' } })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Cancel error:', error)
    return NextResponse.json({ error: 'Ошибка отмены' }, { status: 500 })
  }
}
