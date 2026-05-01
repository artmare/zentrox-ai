'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layouts/page-header'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { toast } from 'sonner'
import {
  TrendingUp, Search, Loader2, Flame, Eye, Zap, BarChart3,
  Target, Sparkles, RefreshCw, ArrowUpRight, Brain
} from 'lucide-react'

const hookTypeLabels: Record<string, string> = {
  question: '❓ Вопрос',
  shock: '💥 Шок',
  promise: '🎯 Обещание',
  curiosity: '🔍 Любопытство',
  controversial: '🔥 Провокация',
}

const emotionLabels: Record<string, string> = {
  fear: '😨 Страх',
  curiosity: '🧐 Любопытство',
  greed: '🤑 Жадность',
  inspiration: '✨ Вдохновение',
  surprise: '😲 Удивление',
  urgency: '⏰ Срочность',
}

interface TrendItem {
  id: string
  platform: string
  title: string
  hookType: string
  emotion: string
  views: number
  engagementRate: number
  analyzedAt: string
}

export function TrendsContent() {
  const [trends, setTrends] = useState<TrendItem[]>([])
  const [stats, setStats] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [platform, setPlatform] = useState('youtube_shorts')
  const [niche, setNiche] = useState('motivation')

  useEffect(() => {
    fetchTrends()
  }, [])

  const fetchTrends = async () => {
    try {
      const res = await fetch('/api/trends')
      if (res.ok) {
        const data = await res.json()
        setTrends(data?.trends ?? [])
        setStats(data?.stats ?? null)
      }
    } catch (e: any) {
      console.error('Failed to fetch trends', e)
    } finally {
      setLoading(false)
    }
  }

  const runAnalysis = async () => {
    setAnalyzing(true)
    try {
      const res = await fetch('/api/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform, niche }),
      })
      const data = await res.json()
      if (res.ok && data?.success) {
        toast.success('Тренды проанализированы!')
        fetchTrends()
      } else {
        toast.error(data?.error ?? 'Ошибка анализа')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setAnalyzing(false)
    }
  }

  const formatViews = (n: number) => {
    if (n >= 1000000) return (n / 1000000).toFixed(1) + 'M'
    if (n >= 1000) return (n / 1000).toFixed(0) + 'K'
    return String(n)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка трендов...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <PageHeader
        title="Анализ трендов"
        description="Находим вирусные паттерны и успешные форматы"
      />

      {/* Analysis Controls */}
      <FadeIn className="mt-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-transparent overflow-hidden relative">
          <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/25">
                <Brain className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="font-display font-semibold">AI-анализ трендов</h3>
                <p className="text-sm text-muted-foreground">Найти вирусные видео, хуки, структуры и стили</p>
              </div>
            </div>
            <div className="flex flex-col sm:flex-row gap-3">
              <Select value={platform} onValueChange={setPlatform}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="youtube_shorts">📺 YouTube Shorts</SelectItem>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                </SelectContent>
              </Select>
              <Select value={niche} onValueChange={setNiche}>
                <SelectTrigger className="w-full sm:w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="motivation">💪 Мотивация</SelectItem>
                  <SelectItem value="business">💰 Бизнес</SelectItem>
                  <SelectItem value="fitness">🏋️ Фитнес</SelectItem>
                  <SelectItem value="psychology">🧠 Психология</SelectItem>
                  <SelectItem value="facts">💡 Факты</SelectItem>
                  <SelectItem value="stories">📖 Истории</SelectItem>
                  <SelectItem value="technology">🚀 Технологии</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={runAnalysis} disabled={analyzing} className="gap-2 shadow-lg shadow-primary/20">
                {analyzing ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Анализ...</>
                ) : (
                  <><Search className="w-4 h-4" />Запустить анализ</>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Stats */}
      {stats && (
        <FadeIn delay={0.1} className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <TrendingUp className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{stats?.totalTrends ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Трендов найдено</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <BarChart3 className="w-4.5 h-4.5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{stats?.avgEngagement ?? 0}%</div>
                    <div className="text-xs text-muted-foreground">Ср. вовлечение</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-orange-500/10 flex items-center justify-center">
                    <Flame className="w-4.5 h-4.5 text-orange-500" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold">
                      {Object.keys(stats?.topHookTypes ?? {}).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Типов хуков</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <Target className="w-4.5 h-4.5 text-purple-500" />
                  </div>
                  <div>
                    <div className="font-display text-lg font-bold">
                      {Object.keys(stats?.topEmotions ?? {}).length}
                    </div>
                    <div className="text-xs text-muted-foreground">Эмоцион. паттернов</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}

      {/* Trends List */}
      <FadeIn delay={0.2} className="mt-6">
        {trends.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-20 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <TrendingUp className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">Тренды пока не проанализированы</h3>
              <p className="text-muted-foreground text-sm max-w-md">Запустите AI-анализ выше, чтобы найти вирусные паттерны</p>
            </CardContent>
          </Card>
        ) : (
          <Stagger className="space-y-3" staggerDelay={0.04}>
            {trends.map((t) => (
              <StaggerItem key={t.id}>
                <Card className="hover:shadow-lg transition-shadow overflow-hidden">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center shrink-0">
                        <Flame className="w-5 h-5 text-orange-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <h4 className="text-sm font-semibold text-foreground line-clamp-1">{t.title}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold border ${t.platform === 'tiktok' ? 'border-cyan-500/30 bg-cyan-500/10 text-cyan-400' : 'border-red-500/30 bg-red-500/15 text-red-300'}`}>
                              {t.platform === 'tiktok' ? '♪ TikTok' : '▶ YouTube'}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-foreground border border-border/50">{hookTypeLabels[t.hookType] ?? t.hookType}</span>
                          <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-muted text-foreground border border-border/50">{emotionLabels[t.emotion] ?? t.emotion}</span>
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            <Eye className="w-3 h-3" />{formatViews(t.views)}
                          </span>
                          <span className="text-xs text-gray-300 flex items-center gap-1">
                            <BarChart3 className="w-3 h-3" />{t.engagementRate}%
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        )}
      </FadeIn>
    </div>
  )
}
