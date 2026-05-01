'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { toast } from 'sonner'
import {
  ArrowLeft, Clock, Film, FileText, Volume2, Type, Monitor,
  Camera, Music, Layers, Hash, Users, Copy, Check, Sparkles
} from 'lucide-react'

interface Scene {
  sceneNumber: number
  sceneName?: string
  duration: string
  text: string
  visualDescription: string
  cameraAngle: string
  musicMood: string
  transition: string
  subtitleText?: string
}

interface FullScriptData {
  id: string
  platform: string
  title: string
  hook: string
  contentType: string
  emotion: string
  status: string
  createdAt: string
  fullScript: {
    scenes: Scene[]
    totalDuration: string
    style: string
    targetAudience: string
    hashtags: string[]
  } | null
}

const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  youtube_shorts: { label: 'YouTube Shorts', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '📺' },
  tiktok: { label: 'TikTok', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: '🎵' },
}

const sceneNames = ['Хук', 'Завязка', 'Усиление', 'Кульминация', 'CTA']
const sceneColors = [
  'from-red-500/20 to-orange-500/20',
  'from-blue-500/20 to-cyan-500/20',
  'from-purple-500/20 to-pink-500/20',
  'from-yellow-500/20 to-orange-500/20',
  'from-green-500/20 to-emerald-500/20',
]

export function ScriptDetailContent({ id }: { id: string }) {
  const [script, setScript] = useState<FullScriptData | null>(null)
  const [loading, setLoading] = useState(true)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)

  const fetchScript = useCallback(async () => {
    try {
      const res = await fetch(`/api/scripts/${id}`)
      if (res.ok) {
        const data = await res.json()
        setScript(data ?? null)
      }
    } catch (e: any) {
      console.error('Failed to fetch script', e)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    if (id) fetchScript()
  }, [id, fetchScript])

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedIndex(index)
      toast.success('Скопировано!')
      setTimeout(() => setCopiedIndex(null), 2000)
    } catch {
      toast.error('Не удалось скопировать')
    }
  }

  const copyFullScript = async () => {
    if (!script?.fullScript?.scenes) return
    const text = script.fullScript.scenes.map((s: Scene, i: number) => {
      return `=== СЦЕНА ${i + 1}: ${sceneNames[i] ?? ''} (${s.duration}) ===\nТекст: ${s.text}\nВизуал: ${s.visualDescription}\nКамера: ${s.cameraAngle}\nМузыка: ${s.musicMood}\nПереход: ${s.transition}`
    }).join('\n\n')
    try {
      await navigator.clipboard.writeText(`${script.title}\n${script.hook}\n\n${text}`)
      toast.success('Весь сценарий скопирован!')
    } catch {
      toast.error('Ошибка копирования')
    }
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-pulse text-muted-foreground">Загрузка...</div></div>
  }

  if (!script) {
    return (
      <div className="text-center py-20">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-primary" />
        </div>
        <h2 className="text-xl font-semibold mb-2">Сценарий не найден</h2>
        <Link href="/scripts"><Button variant="outline" className="gap-2 mt-4"><ArrowLeft className="w-4 h-4" />Назад</Button></Link>
      </div>
    )
  }

  const fullScript = script?.fullScript
  const scenes = fullScript?.scenes ?? []
  const pConfig = platformConfig[script?.platform ?? ''] ?? { label: script?.platform, color: 'bg-muted', icon: '🎥' }

  return (
    <div className="max-w-4xl">
      {/* Back button */}
      <FadeIn>
        <Link href="/scripts">
          <Button variant="ghost" size="sm" className="gap-1 mb-6">
            <ArrowLeft className="w-4 h-4" />
            Назад к сценариям
          </Button>
        </Link>
      </FadeIn>

      {/* Header */}
      <FadeIn delay={0.05}>
        <div className="mb-8">
          <div className="flex flex-wrap gap-2 mb-3">
            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pConfig.color} border gap-1`}>
              <span>{pConfig.icon}</span>
              {pConfig.label}
            </span>
            <Badge variant="outline">{script?.contentType ?? ''}</Badge>
            <Badge variant="outline">✨ {script?.emotion ?? ''}</Badge>
            <Badge variant="outline" className="gap-1">
              <Clock className="w-3 h-3" />
              {fullScript?.totalDuration ?? '15s'}
            </Badge>
          </div>
          <h1 className="font-display text-2xl md:text-3xl font-bold tracking-tight mb-4">{script?.title ?? ''}</h1>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" className="gap-1" onClick={copyFullScript}>
              <Copy className="w-3.5 h-3.5" />
              Скопировать всё
            </Button>
          </div>
        </div>
      </FadeIn>

      {/* Hook Card */}
      <FadeIn delay={0.1}>
        <Card className="mb-6 border-primary/20 bg-gradient-to-r from-primary/5 to-purple-500/5 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-xs font-medium text-primary uppercase tracking-wider">Хук</span>
            </div>
            <p className="text-xl font-semibold leading-relaxed">«{script?.hook ?? ''}»</p>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Meta Info */}
      {(fullScript?.targetAudience || (fullScript?.hashtags?.length ?? 0) > 0) && (
        <FadeIn delay={0.15}>
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            {fullScript?.targetAudience && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Users className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Целевая аудитория</span>
                  </div>
                  <p className="text-sm">{fullScript.targetAudience}</p>
                </CardContent>
              </Card>
            )}
            {(fullScript?.hashtags?.length ?? 0) > 0 && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Hash className="w-4 h-4 text-primary" />
                    <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Хэштеги</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(fullScript?.hashtags ?? []).map((tag: string, i: number) => (
                      <Badge key={i} variant="secondary" className="text-xs">#{tag}</Badge>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </FadeIn>
      )}

      {/* Timeline Header */}
      <FadeIn delay={0.2}>
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <Film className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display text-lg font-semibold">Сценарий — {scenes.length} сцен</h2>
            <p className="text-sm text-muted-foreground">Общая длительность: {fullScript?.totalDuration ?? '15s'}</p>
          </div>
        </div>
      </FadeIn>

      {/* Scenes Timeline */}
      <Stagger className="space-y-0 relative" staggerDelay={0.1}>
        {/* Timeline line */}
        <div className="absolute left-[27px] top-4 bottom-4 w-0.5 bg-border hidden md:block" />

        {scenes.map((scene: Scene, index: number) => (
          <StaggerItem key={index}>
            <div className="flex gap-4 md:gap-6 relative pb-6 last:pb-0">
              {/* Timeline dot */}
              <div className="hidden md:flex flex-col items-center z-10">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${sceneColors[index % sceneColors.length]} flex flex-col items-center justify-center flex-shrink-0 border border-border/50`}>
                  <span className="text-[10px] font-mono text-muted-foreground leading-none">{scene?.duration ?? ''}</span>
                  <span className="text-xs font-bold leading-none mt-0.5">{index + 1}</span>
                </div>
              </div>

              {/* Scene Card */}
              <Card className="flex-1 overflow-hidden hover:shadow-lg transition-shadow">
                <CardContent className="p-0">
                  {/* Scene Header */}
                  <div className={`px-5 py-3 bg-gradient-to-r ${sceneColors[index % sceneColors.length]} border-b border-border/30`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="md:hidden text-xs font-mono bg-card/80 px-2 py-0.5 rounded">{index + 1}</span>
                        <span className="font-display text-sm font-semibold">{scene?.sceneName ?? sceneNames[index] ?? `Сцена ${index + 1}`}</span>
                        <Badge variant="outline" className="text-[10px] gap-1 bg-card/50">
                          <Clock className="w-2.5 h-2.5" />
                          {scene?.duration ?? ''}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => copyToClipboard(scene?.text ?? '', index)}
                      >
                        {copiedIndex === index ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                      </Button>
                    </div>
                  </div>

                  <div className="p-5 space-y-4">
                    {/* Voiceover text */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Volume2 className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium uppercase tracking-wider">Текст озвучки</span>
                      </div>
                      <p className="text-sm leading-relaxed font-medium">{scene?.text ?? ''}</p>
                    </div>

                    {/* Visual description */}
                    <div>
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                        <Monitor className="w-3.5 h-3.5 text-primary" />
                        <span className="font-medium uppercase tracking-wider">Визуал / Промпт</span>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed bg-muted/30 rounded-lg p-3">{scene?.visualDescription ?? ''}</p>
                    </div>

                    {/* Subtitle text */}
                    {scene?.subtitleText && (
                      <div>
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                          <Type className="w-3.5 h-3.5 text-primary" />
                          <span className="font-medium uppercase tracking-wider">Субтитры</span>
                        </div>
                        <p className="text-sm font-mono bg-card border border-border/50 rounded-lg p-3">{scene.subtitleText}</p>
                      </div>
                    )}

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-3 pt-1">
                      {scene?.cameraAngle && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Camera className="w-3.5 h-3.5" />
                          <span>{scene.cameraAngle}</span>
                        </div>
                      )}
                      {scene?.musicMood && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Music className="w-3.5 h-3.5" />
                          <span>{scene.musicMood}</span>
                        </div>
                      )}
                      {scene?.transition && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Layers className="w-3.5 h-3.5" />
                          <span>{scene.transition}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </StaggerItem>
        ))}
      </Stagger>
    </div>
  )
}
