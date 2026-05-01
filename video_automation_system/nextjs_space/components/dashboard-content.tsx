'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Badge } from '@/components/ui/badge'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { FadeIn, SlideIn, Stagger, StaggerItem } from '@/components/ui/animate'
import { PageHeader } from '@/components/layouts/page-header'
import { toast } from 'sonner'
import {
  Settings, Save, Zap, Video, Target, Globe, Gauge, DollarSign, Power,
  Sparkles, FileText, TrendingUp, Bot, Loader2, ArrowRight, Wand2,
  CheckCircle2, AlertCircle
} from 'lucide-react'

const PLATFORMS = [
  { id: 'youtube_shorts', label: 'YouTube Shorts', icon: '📺', color: 'bg-red-500/10 text-red-400 border-red-500/20' },
  { id: 'tiktok', label: 'TikTok', icon: '🎵', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20' },
]

const NICHES = [
  { value: 'motivation', label: '💪 Мотивация' },
  { value: 'business', label: '💰 Деньги / Бизнес' },
  { value: 'fitness', label: '🏋️ Фитнес' },
  { value: 'psychology', label: '🧠 Психология' },
  { value: 'facts', label: '💡 Факты' },
  { value: 'stories', label: '📖 Истории' },
  { value: 'education', label: '🎓 Образование' },
  { value: 'technology', label: '🚀 Технологии' },
]

const LANGUAGES = [
  { value: 'russian', label: '🇷🇺 Русский' },
  { value: 'english', label: '🇺🇸 English' },
  { value: 'both', label: '🌐 Оба языка' },
]

interface SettingsData {
  platforms: string[]
  niche: string
  language: string
  videosPerDay: number
  monetizationSettings: { affiliateLinks: string; cta: string } | null
  autopilotEnabled: boolean
}

interface StatsData {
  totalScripts: number
  todayScripts: number
  autopilotActive: boolean
}

export function DashboardContent() {
  const { data: session } = useSession() || {}
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [lastGenerated, setLastGenerated] = useState<any>(null)
  const [stats, setStats] = useState<StatsData>({ totalScripts: 0, todayScripts: 0, autopilotActive: false })
  const [settings, setSettings] = useState<SettingsData>({
    platforms: ['youtube_shorts'],
    niche: 'motivation',
    language: 'russian',
    videosPerDay: 5,
    monetizationSettings: null,
    autopilotEnabled: false,
  })

  useEffect(() => {
    fetchSettings()
    fetchStats()
  }, [])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          setSettings({
            platforms: (() => { try { return typeof data?.platforms === 'string' ? JSON.parse(data.platforms) : (data?.platforms ?? []) } catch { return [] } })(),
            niche: data?.niche ?? 'motivation',
            language: data?.language ?? 'russian',
            videosPerDay: data?.videosPerDay ?? 5,
            monetizationSettings: data?.monetizationSettings ?? null,
            autopilotEnabled: data?.autopilotEnabled ?? false,
          })
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch settings', e)
    } finally {
      setLoading(false)
    }
  }

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/analytics')
      if (res.ok) {
        const data = await res.json()
        const today = new Date().toISOString().split('T')[0]
        const todayCount = (data?.perDay ?? []).find((d: any) => d?.date === today)?.count ?? 0
        setStats({
          totalScripts: data?.totalScripts ?? 0,
          todayScripts: todayCount,
          autopilotActive: false,
        })
      }
    } catch (e: any) {
      console.error('Failed to fetch stats', e)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...(settings ?? {}),
          platforms: JSON.stringify(settings?.platforms ?? []),
        }),
      })
      if (res.ok) {
        toast.success('Настройки сохранены!')
      } else {
        toast.error('Ошибка сохранения')
      }
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const handleGenerate = async () => {
    setGenerating(true)
    setLastGenerated(null)
    try {
      const res = await fetch('/api/generate', { method: 'POST' })
      const data = await res.json()
      if (res.ok && data?.success) {
        setLastGenerated(data.script)
        toast.success('Сценарий сгенерирован!')
        fetchStats()
      } else {
        toast.error(data?.error ?? 'Ошибка генерации')
      }
    } catch {
      toast.error('Ошибка соединения')
    } finally {
      setGenerating(false)
    }
  }

  const togglePlatform = (platformId: string) => {
    setSettings((prev: SettingsData) => {
      const current = prev?.platforms ?? []
      const has = current?.includes?.(platformId)
      return {
        ...(prev ?? {}),
        platforms: has ? current?.filter?.((p: string) => p !== platformId) : [...current, platformId],
      }
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-[400px]"><div className="animate-pulse text-muted-foreground">Загрузка настроек...</div></div>
  }

  return (
    <div className="max-w-5xl">
      <PageHeader
        title="Панель управления"
        description="Настройте параметры и генерируйте видео-контент"
      />

      {/* Stats Overview */}
      <FadeIn className="mt-6">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{stats.totalScripts}</div>
                  <div className="text-xs text-muted-foreground">Всего сценариев</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500/5 to-green-500/10 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{stats.todayScripts}</div>
                  <div className="text-xs text-muted-foreground">Сегодня</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/5 to-orange-500/10 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                  <Gauge className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <div className="font-display text-2xl font-bold">{settings.videosPerDay}</div>
                  <div className="text-xs text-muted-foreground">Видео/день</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className={`bg-gradient-to-br ${settings.autopilotEnabled ? 'from-green-500/5 to-emerald-500/10 border-green-500/20' : 'from-muted/30 to-muted/50 border-border'}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${settings.autopilotEnabled ? 'bg-green-500/20' : 'bg-muted'}`}>
                  <Bot className={`w-5 h-5 ${settings.autopilotEnabled ? 'text-green-400' : 'text-muted-foreground'}`} />
                </div>
                <div>
                  <div className="font-display text-lg font-bold">{settings.autopilotEnabled ? 'Активен' : 'Выкл.'}</div>
                  <div className="text-xs text-muted-foreground">Автопилот</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </FadeIn>

      {/* Generate Now */}
      <FadeIn delay={0.05} className="mt-6">
        <Card className="border-primary/20 bg-gradient-to-r from-primary/5 via-purple-500/5 to-pink-500/5 overflow-hidden relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shadow-lg shadow-primary/25 flex-shrink-0">
                  <Wand2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-display text-lg font-semibold mb-1">Сгенерировать сценарий сейчас</h3>
                  <p className="text-sm text-muted-foreground">AI создаст вирусный сценарий на основе ваших настроек</p>
                </div>
              </div>
              <Button
                onClick={handleGenerate}
                disabled={generating}
                className="gap-2 shadow-lg shadow-primary/20 min-w-[200px]"
                size="lg"
              >
                {generating ? (
                  <><Loader2 className="w-5 h-5 animate-spin" />Генерация...</>
                ) : (
                  <><Sparkles className="w-5 h-5" />Сгенерировать</>
                )}
              </Button>
            </div>

            {/* Last generated result */}
            {lastGenerated && (
              <div className="mt-4 p-4 rounded-xl bg-card/80 border border-border/50">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-sm font-medium">Сценарий создан!</span>
                </div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline">{lastGenerated?.platform === 'tiktok' ? 'TikTok' : 'YouTube Shorts'}</Badge>
                  <Badge variant="secondary">{lastGenerated?.contentType}</Badge>
                  <span className="text-sm font-medium">{lastGenerated?.title}</span>
                </div>
                <p className="text-sm text-muted-foreground italic mb-3">«{lastGenerated?.hook}»</p>
                <Link href={`/scripts/${lastGenerated?.id}`}>
                  <Button variant="outline" size="sm" className="gap-1">
                    Открыть сценарий <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      <div className="space-y-6 mt-8">
        {/* Platforms */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Video className="w-5 h-5 text-primary" />
                Платформы
              </CardTitle>
              <CardDescription>Выберите платформы для генерации контента</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                {(PLATFORMS ?? []).map((p: any) => {
                  const isActive = settings?.platforms?.includes?.(p?.id) ?? false
                  return (
                    <button
                      key={p?.id}
                      onClick={() => togglePlatform(p?.id)}
                      className={`flex items-center gap-3 px-4 py-3 rounded-xl border-2 transition-all duration-200 cursor-pointer ${
                        isActive
                          ? `${p?.color} border-current`
                          : 'border-border/50 text-muted-foreground hover:border-border'
                      }`}
                    >
                      <span className="text-lg">{p?.icon}</span>
                      <span className="text-sm font-medium">{p?.label}</span>
                      {isActive && <CheckCircle2 className="w-4 h-4" />}
                    </button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Niche + Language */}
        <FadeIn delay={0.15}>
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Target className="w-5 h-5 text-primary" />
                  Ниша
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings?.niche ?? 'motivation'}
                  onValueChange={(v: string) => setSettings((prev: SettingsData) => ({ ...(prev ?? {}), niche: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите нишу" />
                  </SelectTrigger>
                  <SelectContent>
                    {(NICHES ?? []).map((n: any) => (
                      <SelectItem key={n?.value} value={n?.value ?? 'motivation'}>{n?.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Globe className="w-5 h-5 text-primary" />
                  Язык
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Select
                  value={settings?.language ?? 'russian'}
                  onValueChange={(v: string) => setSettings((prev: SettingsData) => ({ ...(prev ?? {}), language: v }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Выберите язык" />
                  </SelectTrigger>
                  <SelectContent>
                    {(LANGUAGES ?? []).map((l: any) => (
                      <SelectItem key={l?.value} value={l?.value ?? 'russian'}>{l?.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </CardContent>
            </Card>
          </div>
        </FadeIn>

        {/* Videos per day */}
        <FadeIn delay={0.2}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Gauge className="w-5 h-5 text-primary" />
                Количество видео в день
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-6">
                <Slider
                  value={[settings?.videosPerDay ?? 5]}
                  onValueChange={(v: number[]) => setSettings((prev: SettingsData) => ({ ...(prev ?? {}), videosPerDay: v?.[0] ?? 5 }))}
                  min={1}
                  max={20}
                  step={1}
                  className="flex-1"
                />
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="font-display text-2xl font-bold text-primary">{settings?.videosPerDay ?? 5}</span>
                </div>
              </div>
              <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                <span>1 видео</span>
                <span>10 видео</span>
                <span>20 видео</span>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Monetization */}
        <FadeIn delay={0.25}>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <DollarSign className="w-5 h-5 text-primary" />
                Монетизация
                <Badge variant="secondary" className="text-xs">Опционально</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Партнёрские ссылки</Label>
                <Input
                  placeholder="https://affiliate-link.com/..."
                  value={settings?.monetizationSettings?.affiliateLinks ?? ''}
                  onChange={(e: any) => setSettings((prev: SettingsData) => ({
                    ...(prev ?? {}),
                    monetizationSettings: {
                      affiliateLinks: e?.target?.value ?? '',
                      cta: prev?.monetizationSettings?.cta ?? '',
                    },
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label>Call-to-Action (CTA)</Label>
                <Textarea
                  placeholder="Подписывайся и ставь лайк..."
                  value={settings?.monetizationSettings?.cta ?? ''}
                  onChange={(e: any) => setSettings((prev: SettingsData) => ({
                    ...(prev ?? {}),
                    monetizationSettings: {
                      affiliateLinks: prev?.monetizationSettings?.affiliateLinks ?? '',
                      cta: e?.target?.value ?? '',
                    },
                  }))}
                  rows={2}
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Autopilot */}
        <FadeIn delay={0.3}>
          <Card className={settings?.autopilotEnabled ? 'border-green-500/30 bg-green-500/5' : ''}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Power className={`w-5 h-5 ${settings?.autopilotEnabled ? 'text-green-400' : 'text-primary'}`} />
                Автопилот
              </CardTitle>
              <CardDescription>Автоматическая генерация сценариев каждый день</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between p-4 rounded-xl bg-card/80">
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${settings?.autopilotEnabled ? 'bg-green-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <span className="font-medium">{settings?.autopilotEnabled ? 'Автопилот активен' : 'Автопилот выключен'}</span>
                </div>
                <Switch
                  checked={settings?.autopilotEnabled ?? false}
                  onCheckedChange={(v: boolean) => setSettings((prev: SettingsData) => ({ ...(prev ?? {}), autopilotEnabled: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        <FadeIn delay={0.35}>
          <Button onClick={handleSave} disabled={saving} className="gap-2 shadow-lg shadow-primary/20" size="lg">
            <Save className="w-5 h-5" />
            {saving ? 'Сохранение...' : 'Сохранить настройки'}
          </Button>
        </FadeIn>
      </div>
    </div>
  )
}
