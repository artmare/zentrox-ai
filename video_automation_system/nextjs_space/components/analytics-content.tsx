'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/layouts/page-header'
import { FadeIn, SlideIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { BarChart3, PieChart as PieIcon, TrendingUp, TrendingDown, FileText, Lightbulb, Calendar, ArrowUpRight, Zap, Target, RefreshCw } from 'lucide-react'
import dynamic from 'next/dynamic'

const AnalyticsCharts = dynamic(() => import('@/components/analytics-charts'), { ssr: false, loading: () => <div className="animate-pulse h-64 bg-muted/30 rounded-lg" /> })

interface AnalyticsData {
  perDay: { date: string; count: number }[]
  contentTypes: { name: string; value: number }[]
  topIdeas: { title: string; platform: string; contentType: string }[]
  totalScripts: number
  platformMetrics?: {
    tiktok: { avgRetention: string; avgEngagement: string; totalViews: number; totalLikes: number }
    youtube: { avgCtr: string; avgWatchTime: string; totalViews: number; totalLikes: number }
  }
}

const contentTypeLabels: Record<string, string> = {
  motivational_monologue: 'Мотивационный',
  fact_revelation: 'Факты',
  story_hook: 'История',
  listicle: 'Список',
  tutorial: 'Урок',
  challenge: 'Челлендж',
  comparison: 'Сравнение',
  transformation: 'Трансформация',
}

const contentTypeIcons: Record<string, string> = {
  motivational_monologue: '🔥',
  fact_revelation: '💡',
  story_hook: '📖',
  listicle: '📋',
  tutorial: '🎓',
  challenge: '🏆',
  comparison: '⚖️',
  transformation: '✨',
}

export function AnalyticsContent() {
  const [data, setData] = useState<AnalyticsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchAnalytics()
  }, [])

  const fetchAnalytics = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const d = await res.json()
        setData(d ?? null)
      }
    } catch (e: any) {
      console.error('Failed to fetch analytics', e)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  // Calculate week-over-week change
  const getWeekTrend = () => {
    if (!data?.perDay || data.perDay.length < 14) return { change: 0, isUp: true }
    const thisWeek = data.perDay.slice(-7).reduce((a, b) => a + (b?.count ?? 0), 0)
    const lastWeek = data.perDay.slice(0, 7).reduce((a, b) => a + (b?.count ?? 0), 0)
    if (lastWeek === 0) return { change: thisWeek > 0 ? 100 : 0, isUp: true }
    const change = Math.round(((thisWeek - lastWeek) / lastWeek) * 100)
    return { change: Math.abs(change), isUp: change >= 0 }
  }

  const weekTrend = getWeekTrend()
  const totalLast14 = (data?.perDay ?? []).reduce((a: number, b: any) => a + (b?.count ?? 0), 0)
  const avgPerDay = totalLast14 > 0 ? (totalLast14 / 14).toFixed(1) : '0'
  const topContentType = (data?.contentTypes ?? []).sort((a, b) => (b?.value ?? 0) - (a?.value ?? 0))[0]

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка аналитики...</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-start justify-between">
        <PageHeader
          title="Аналитика"
          description="Полная статистика вашего контента"
        />
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchAnalytics(true)}
          disabled={refreshing}
          className="gap-2 mt-1"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Обновить
        </Button>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
        <SlideIn from="bottom" delay={0}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <Badge variant="outline" className="text-xs font-normal">всего</Badge>
              </div>
              <div className="font-display text-3xl font-bold tracking-tight">{data?.totalScripts ?? 0}</div>
              <div className="text-xs text-muted-foreground mt-1">Сценариев создано</div>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn from="bottom" delay={0.05}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-500" />
                </div>
                <Badge variant="outline" className="text-xs font-normal">14 дней</Badge>
              </div>
              <div className="font-display text-3xl font-bold tracking-tight">{totalLast14}</div>
              <div className="text-xs text-muted-foreground mt-1">~{avgPerDay} в день</div>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn from="bottom" delay={0.1}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  {weekTrend.isUp ? <TrendingUp className="w-5 h-5 text-emerald-500" /> : <TrendingDown className="w-5 h-5 text-orange-500" />}
                </div>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-normal gap-1 border ${weekTrend.isUp ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-orange-500/10 text-orange-400 border-orange-500/20'}`}>
                  <ArrowUpRight className={`w-3 h-3 ${!weekTrend.isUp ? 'rotate-90' : ''}`} />
                  {weekTrend.change}%
                </span>
              </div>
              <div className={`font-display text-3xl font-bold tracking-tight ${weekTrend.isUp ? 'text-emerald-400' : 'text-orange-400'}`}>
                {weekTrend.isUp ? '+' : '-'}{weekTrend.change}%
              </div>
              <div className="text-xs text-muted-foreground/80 mt-1">Динамика за неделю</div>
            </CardContent>
          </Card>
        </SlideIn>

        <SlideIn from="bottom" delay={0.15}>
          <Card className="relative overflow-hidden group hover:shadow-lg transition-shadow">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                  <Target className="w-5 h-5 text-purple-500" />
                </div>
                <Badge variant="outline" className="text-xs font-normal">топ</Badge>
              </div>
              <div className="font-display text-lg font-bold tracking-tight truncate">
                {topContentType ? (contentTypeIcons[topContentType.name] ?? '📝') : '—'}{' '}
                {topContentType ? (contentTypeLabels[topContentType.name] ?? topContentType.name) : 'Нет данных'}
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                {topContentType ? `${topContentType.value} сценариев` : 'Популярный тип'}
              </div>
            </CardContent>
          </Card>
        </SlideIn>
      </div>

      {/* Charts */}
      <FadeIn delay={0.2} className="mt-8">
        <AnalyticsCharts perDay={data?.perDay ?? []} contentTypes={data?.contentTypes ?? []} />
      </FadeIn>

      {/* Platform-Specific Metrics (Block 12) */}
      <FadeIn delay={0.22} className="mt-8">
        <div className="grid md:grid-cols-2 gap-6">
          {/* TikTok Metrics */}
          <Card className="border-cyan-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">🎵</span>
                TikTok
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Удержание</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.tiktok?.avgRetention ?? '0'}%</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Вовлечение</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.tiktok?.avgEngagement ?? '0'}%</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Просмотры</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.tiktok?.totalViews ?? 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Лайки</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.tiktok?.totalLikes ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* YouTube Metrics */}
          <Card className="border-red-500/10">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-base">
                <span className="text-lg">📺</span>
                YouTube Shorts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">CTR</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.youtube?.avgCtr ?? '0'}%</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Watch Time (сек)</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.youtube?.avgWatchTime ?? '0'}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Просмотры</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.youtube?.totalViews ?? 0}</div>
                </div>
                <div className="p-3 rounded-lg bg-muted/30">
                  <div className="text-xs text-muted-foreground mb-1">Лайки</div>
                  <div className="font-display text-xl font-bold">{data?.platformMetrics?.youtube?.totalLikes ?? 0}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Top Ideas */}
      <FadeIn delay={0.25} className="mt-8">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2 text-lg">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Lightbulb className="w-4 h-4 text-amber-500" />
                </div>
                Последние сценарии
              </CardTitle>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold bg-secondary text-secondary-foreground">{data?.topIdeas?.length ?? 0} шт</span>
            </div>
          </CardHeader>
          <CardContent>
            {(data?.topIdeas?.length ?? 0) === 0 ? (
              <div className="text-center py-10">
                <div className="w-14 h-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
                  <Zap className="w-7 h-7 text-muted-foreground/50" />
                </div>
                <p className="text-sm font-medium text-muted-foreground">Пока нет сгенерированных сценариев</p>
                <p className="text-xs text-muted-foreground/70 mt-1">Нажмите «Генерировать» на дашборде</p>
              </div>
            ) : (
              <Stagger className="space-y-2" staggerDelay={0.04}>
                {(data?.topIdeas ?? []).map((idea: any, i: number) => (
                  <StaggerItem key={i}>
                    <div className="flex items-center gap-4 p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors group">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                        <span className="text-sm">{contentTypeIcons[idea?.contentType ?? ''] ?? '📝'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{idea?.title ?? ''}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {contentTypeLabels[idea?.contentType ?? ''] ?? idea?.contentType}
                        </p>
                      </div>
                      <Badge
                        variant="outline"
                        className={`text-xs shrink-0 ${
                          idea?.platform === 'youtube_shorts'
                            ? 'border-red-500/30 text-red-400'
                            : 'border-cyan-500/30 text-cyan-400'
                        }`}
                      >
                        {idea?.platform === 'youtube_shorts' ? '▶ YouTube' : '♪ TikTok'}
                      </Badge>
                    </div>
                  </StaggerItem>
                ))}
              </Stagger>
            )}
          </CardContent>
        </Card>
      </FadeIn>
    </div>
  )
}
