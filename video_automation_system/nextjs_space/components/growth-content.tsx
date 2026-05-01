'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/layouts/page-header'
import { FadeIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { toast } from 'sonner'
import {
  Rocket, TrendingUp, Brain, Target, Eye, Heart, BarChart3,
  CheckCircle2, ChevronRight, Save, Layers, Zap, Award,
  ArrowUpRight, Activity, Settings, Server, Cpu, Database, Clapperboard
} from 'lucide-react'

const GROWTH_PHASES = [
  {
    id: 'testing',
    label: 'Фаза 1: Тестирование',
    icon: '🧪',
    desc: 'Тестируем разные форматы, хуки и ниши. Выявляем работающие паттерны.',
    color: 'from-blue-500/20 to-cyan-500/20 border-blue-500/20',
    activeColor: 'from-blue-500/10 to-cyan-500/10 border-blue-500/40',
  },
  {
    id: 'scaling',
    label: 'Фаза 2: Масштабирование',
    icon: '🚀',
    desc: 'Увеличиваем объём контента. Усиливаем успешные форматы.',
    color: 'from-purple-500/20 to-pink-500/20 border-purple-500/20',
    activeColor: 'from-purple-500/10 to-pink-500/10 border-purple-500/40',
  },
  {
    id: 'serial',
    label: 'Фаза 3: Серийный контент',
    icon: '🏆',
    desc: 'Создаём серии видео. Монетизация и стабильный доход.',
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/20',
    activeColor: 'from-green-500/10 to-emerald-500/10 border-green-500/40',
  },
]

const ARCHITECTURE = [
  { name: 'AI Engine', desc: 'LLM генерация сценариев и анализ', icon: Brain, color: 'bg-purple-500/10 text-purple-500' },
  { name: 'Trend Scraper', desc: 'Поиск вирусных видео и паттернов', icon: TrendingUp, color: 'bg-blue-500/10 text-blue-500' },
  { name: 'Video Generator', desc: 'Stable Diffusion + AnimateDiff + FFmpeg', icon: Clapperboard, color: 'bg-red-500/10 text-red-500' },
  { name: 'Scheduler', desc: 'Расписание и автопилот', icon: Settings, color: 'bg-orange-500/10 text-orange-500' },
  { name: 'Posting Engine', desc: 'Автопостинг + Browser Automation', icon: Rocket, color: 'bg-green-500/10 text-green-500' },
  { name: 'Analytics Engine', desc: 'Сбор и анализ метрик', icon: BarChart3, color: 'bg-cyan-500/10 text-cyan-500' },
]

export function GrowthContent() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [growthPhase, setGrowthPhase] = useState('testing')
  const [selfLearning, setSelfLearning] = useState(true)
  const [stats, setStats] = useState<any>(null)
  const [topScripts, setTopScripts] = useState<any[]>([])
  const [strategyLogs, setStrategyLogs] = useState<any[]>([])

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const res = await fetch('/api/growth')
      if (res.ok) {
        const data = await res.json()
        setGrowthPhase(data?.growthPhase ?? 'testing')
        setSelfLearning(data?.selfLearningEnabled ?? true)
        setStats(data?.stats ?? null)
        setTopScripts(data?.topScripts ?? [])
        setStrategyLogs(data?.strategyLogs ?? [])
      }
    } catch (e: any) {
      console.error('Growth fetch error', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/growth', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ growthPhase, selfLearningEnabled: selfLearning }),
      })
      if (res.ok) {
        toast.success('Настройки роста сохранены!')
      } else {
        toast.error('Ошибка')
      }
    } catch {
      toast.error('Ошибка')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-4xl">
      <PageHeader
        title="Стратегия роста"
        description="Фазы роста, самообучение и архитектура системы"
      />

      {/* Stats Overview */}
      {stats && (
        <FadeIn className="mt-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Layers className="w-4.5 h-4.5 text-primary" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{stats?.totalScripts ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Сценариев</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Eye className="w-4.5 h-4.5 text-green-500" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{stats?.totalViews ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Просмотров</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                    <Heart className="w-4.5 h-4.5 text-red-500" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{stats?.totalLikes ?? 0}</div>
                    <div className="text-xs text-muted-foreground">Лайков</div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-cyan-500/10 flex items-center justify-center">
                    <Activity className="w-4.5 h-4.5 text-cyan-500" />
                  </div>
                  <div>
                    <div className="font-display text-2xl font-bold">{stats?.avgRetention ?? 0}%</div>
                    <div className="text-xs text-muted-foreground">Удержание</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </FadeIn>
      )}

      {/* Growth Phases */}
      <FadeIn delay={0.05} className="mt-6">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Rocket className="w-4 h-4 text-primary" />
              </div>
              Фазы роста
              <Badge variant="outline" className="text-xs">Блок 11</Badge>
            </CardTitle>
            <CardDescription className="ml-[42px]">Выберите текущую фазу для адаптации стратегии</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {GROWTH_PHASES.map((phase, idx) => {
                const isActive = growthPhase === phase.id
                return (
                  <button
                    key={phase.id}
                    onClick={() => setGrowthPhase(phase.id)}
                    className={`w-full text-left p-4 rounded-xl border-2 transition-all ${
                      isActive
                        ? `bg-gradient-to-r ${phase.activeColor} shadow-sm`
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{phase.icon}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold">{phase.label}</span>
                          {isActive && <CheckCircle2 className="w-4 h-4 text-primary" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{phase.desc}</p>
                      </div>
                      {idx < GROWTH_PHASES.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                      )}
                    </div>
                  </button>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Self-Learning */}
      <FadeIn delay={0.1} className="mt-5">
        <Card className={selfLearning ? 'border-emerald-500/20' : ''}>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Brain className="w-4 h-4 text-emerald-500" />
              </div>
              Самообучение
              <Badge variant="outline" className="text-xs border-emerald-500/30 text-emerald-400">Блок 13</Badge>
            </CardTitle>
            <CardDescription className="ml-[42px]">Автоматическая адаптация на основе результатов</CardDescription>
          </CardHeader>
          <CardContent>
            <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
              selfLearning ? 'bg-emerald-500/5 border border-emerald-500/15' : 'bg-muted/30'
            }`}>
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 ${selfLearning ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                <div>
                  <p className="text-sm font-medium">{selfLearning ? 'Система обучается' : 'Самообучение выключено'}</p>
                  <p className="text-xs text-muted-foreground">
                    {selfLearning ? 'Усиливает успешные, удаляет слабые, адаптируется' : 'Ручной режим'}
                  </p>
                </div>
              </div>
              <Switch checked={selfLearning} onCheckedChange={setSelfLearning} />
            </div>

            {/* Top Performing */}
            {topScripts.length > 0 && (
              <div className="mt-4">
                <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" />
                  Топ по оценке
                </h4>
                <div className="space-y-2">
                  {topScripts.map((s: any, i: number) => (
                    <div key={s.id} className="flex items-center gap-3 p-2.5 rounded-lg bg-muted/30">
                      <span className="text-xs font-mono text-muted-foreground w-5">{i + 1}.</span>
                      <span className="text-sm flex-1 truncate">{s.title}</span>
                      <Badge variant="secondary" className="text-xs">{s.score?.toFixed(1)}</Badge>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Architecture - Block 14 */}
      <FadeIn delay={0.15} className="mt-5">
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2.5 text-base">
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <Cpu className="w-4 h-4 text-blue-500" />
              </div>
              Архитектура системы
              <Badge variant="outline" className="text-xs">Блок 14</Badge>
            </CardTitle>
            <CardDescription className="ml-[42px]">6 модулей автономной системы</CardDescription>
          </CardHeader>
          <CardContent>
            <Stagger className="grid sm:grid-cols-2 gap-3" staggerDelay={0.05}>
              {ARCHITECTURE.map((mod) => (
                <StaggerItem key={mod.name}>
                  <div className="flex items-start gap-3 p-3.5 rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className={`w-10 h-10 rounded-xl ${mod.color} flex items-center justify-center shrink-0`}>
                      <mod.icon className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold">{mod.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">{mod.desc}</p>
                    </div>
                  </div>
                </StaggerItem>
              ))}
            </Stagger>

            {/* Tech stack */}
            <div className="mt-4 p-4 rounded-xl bg-primary/5 border border-primary/10">
              <h4 className="text-xs font-medium text-primary uppercase tracking-wider mb-2">Технологический стек</h4>
              <div className="flex flex-wrap gap-2">
                {['Stable Video Diffusion', 'AnimateDiff', 'Edge TTS', 'Coqui XTTS', 'FFmpeg', 'Python', 'LLM API', 'Prisma', 'Next.js', 'PostgreSQL'].map((t) => (
                  <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </FadeIn>

      {/* Save */}
      <FadeIn delay={0.2} className="mt-6">
        <Button onClick={handleSave} disabled={saving} className="gap-2" size="lg">
          <Save className="w-5 h-5" />
          {saving ? 'Сохранение...' : 'Сохранить настройки'}
        </Button>
      </FadeIn>
    </div>
  )
}
