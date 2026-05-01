'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layouts/page-header'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { FileText, Eye, Search, Filter, Video, Clock, Sparkles, Zap, ArrowRight, Rocket, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

interface ScriptItem {
  id: string
  platform: string
  title: string
  hook: string
  contentType: string
  emotion: string
  status: string
  createdAt: string
}

const statusLabels: Record<string, string> = {
  draft: 'Черновик',
  ready: 'Готов',
  published: 'Опубликован',
}

const statusColors: Record<string, string> = {
  draft: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  ready: 'bg-green-500/10 text-green-400 border-green-500/20',
  published: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
}

const platformConfig: Record<string, { label: string; color: string; icon: string }> = {
  youtube_shorts: { label: 'YouTube Shorts', color: 'bg-red-500/10 text-red-400 border-red-500/20', icon: '📺' },
  tiktok: { label: 'TikTok', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20', icon: '🎵' },
}

const contentTypeLabels: Record<string, string> = {
  motivational_monologue: '💪 Мотивация',
  fact_revelation: '💡 Факты',
  story_hook: '📖 История',
  provocative: '🔥 Провокация',
  listicle: '📋 Список',
  tutorial: '🎓 Урок',
  challenge: '🏆 Челлендж',
  comparison: '⚖️ Сравнение',
  transformation: '✨ Трансформация',
}

export function ScriptsContent() {
  const [scripts, setScripts] = useState<ScriptItem[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [platformFilter, setPlatformFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [quickCreating, setQuickCreating] = useState<string | null>(null)

  const handleQuickCreate = async (e: React.MouseEvent, scriptId: string) => {
    e.preventDefault()
    e.stopPropagation()
    setQuickCreating(scriptId)
    try {
      // Step 1: Start video generation
      const genRes = await fetch('/api/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId }),
      })
      const genData = await genRes.json()
      if (!genRes.ok || !genData.videoId) {
        toast.error(genData.error ?? 'Ошибка генерации')
        return
      }
      toast.success('Видео генерируется! Перейдите на страницу «Мои видео» для отслеживания.')
    } catch { toast.error('Ошибка соединения') }
    finally { setQuickCreating(null) }
  }

  useEffect(() => {
    fetchScripts()
  }, [])

  const fetchScripts = async () => {
    try {
      const res = await fetch('/api/scripts')
      if (res.ok) {
        const data = await res.json()
        setScripts(data ?? [])
      }
    } catch (e: any) {
      console.error('Failed to fetch scripts', e)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    return (scripts ?? []).filter((s: ScriptItem) => {
      const matchSearch = !search || (s?.title ?? '').toLowerCase().includes(search.toLowerCase()) || (s?.hook ?? '').toLowerCase().includes(search.toLowerCase())
      const matchPlatform = platformFilter === 'all' || s?.platform === platformFilter
      const matchStatus = statusFilter === 'all' || s?.status === statusFilter
      return matchSearch && matchPlatform && matchStatus
    })
  }, [scripts, search, platformFilter, statusFilter])

  return (
    <div>
      <PageHeader
        title="Мои сценарии"
        description={`${scripts?.length ?? 0} сценариев сгенерировано`}
      />

      {/* Filters */}
      <FadeIn className="mt-6">
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Поиск по названию или хуку..."
                  value={search}
                  onChange={(e: any) => setSearch(e?.target?.value ?? '')}
                  className="pl-10"
                />
              </div>
              <Select value={platformFilter} onValueChange={setPlatformFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Платформа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все платформы</SelectItem>
                  <SelectItem value="youtube_shorts">YouTube Shorts</SelectItem>
                  <SelectItem value="tiktok">TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <SelectValue placeholder="Статус" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все статусы</SelectItem>
                  <SelectItem value="draft">Черновик</SelectItem>
                  <SelectItem value="ready">Готов</SelectItem>
                  <SelectItem value="published">Опубликован</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="animate-pulse text-muted-foreground">Загрузка сценариев...</div>
        </div>
      ) : (filtered?.length ?? 0) === 0 ? (
        <FadeIn>
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <FileText className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">
                {search || platformFilter !== 'all' || statusFilter !== 'all' ? 'Ничего не найдено' : 'Сценариев пока нет'}
              </h3>
              <p className="text-muted-foreground text-sm max-w-md">
                {search || platformFilter !== 'all' || statusFilter !== 'all'
                  ? 'Попробуйте изменить фильтры'
                  : 'Нажмите «Сгенерировать» в панели управления или включите автопилот'
                }
              </p>
            </CardContent>
          </Card>
        </FadeIn>
      ) : (
        <Stagger className="grid gap-4 md:grid-cols-2" staggerDelay={0.05}>
          {filtered.map((s: ScriptItem) => {
            const pConfig = platformConfig[s?.platform ?? ''] ?? { label: s?.platform, color: 'bg-muted text-muted-foreground', icon: '🎥' }
            return (
              <StaggerItem key={s?.id}>
                <Link href={`/scripts/${s?.id}`} className="block group">
                  <Card className="h-full hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 border-border/50 hover:border-primary/20 overflow-hidden">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${pConfig.color} border gap-1`}>
                            <span>{pConfig.icon}</span>
                            {pConfig.label}
                          </span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${statusColors[s?.status ?? ''] ?? 'bg-muted text-muted-foreground'} border`}>
                            {statusLabels[s?.status ?? ''] ?? s?.status}
                          </span>
                        </div>
                        <span className="text-xs text-gray-400 font-mono">
                          {s?.createdAt ? new Date(s.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short' }) : ''}
                        </span>
                      </div>

                      <h3 className="font-display text-base font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{s?.title ?? ''}</h3>

                      <p className="text-sm text-gray-400 italic mb-3 line-clamp-2">«{s?.hook ?? ''}»</p>

                      <div className="flex items-center justify-between">
                        <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">
                          {contentTypeLabels[s?.contentType ?? ''] ?? s?.contentType}
                        </span>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs gap-1 text-purple-400 hover:text-purple-300 opacity-0 group-hover:opacity-100 transition-opacity"
                            disabled={quickCreating === s?.id}
                            onClick={(e) => handleQuickCreate(e, s?.id ?? '')}
                          >
                            {quickCreating === s?.id ? (
                              <><Loader2 className="w-3 h-3 animate-spin" /> Запуск...</>
                            ) : (
                              <><Rocket className="w-3 h-3" /> Создать видео</>
                            )}
                          </Button>
                          <span className="text-xs text-primary flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            Открыть <ArrowRight className="w-3 h-3" />
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </StaggerItem>
            )
          })}
        </Stagger>
      )}
    </div>
  )
}
