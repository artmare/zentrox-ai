'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layouts/page-header'
import { FadeIn, SlideIn } from '@/components/ui/animate'
import { toast } from 'sonner'
import {
  Bot, Power, Clock, Layers, Save, Sparkles, Shield, Zap,
  CheckCircle2, XCircle, Activity, Info, Play, Loader2
} from 'lucide-react'

const STRATEGIES = [
  { value: 'mixed', label: 'Смешанная стратегия', icon: '🎲', desc: 'Комбинирует трендовые и вечнозелёные темы для максимального охвата' },
  { value: 'trend_based', label: 'На основе трендов', icon: '📈', desc: 'Использует актуальные вирусные форматы и темы' },
  { value: 'evergreen', label: 'Вечнозеленый контент', icon: '🌲', desc: 'Темы, которые актуальны всегда и набирают просмотры со временем' },
  { value: 'educational', label: 'Образовательный', icon: '🎓', desc: 'Контент с фокусом на пользу и практические советы' },
  { value: 'viral', label: 'Вирусный фокус', icon: '🚀', desc: 'Максимально цепляющие хуки и эмоциональные триггеры' },
]

interface AgentSettings {
  autopilotEnabled: boolean
  scheduleTime: string
  contentStrategy: string
}

export function AgentSettingsContent() {
  const [settings, setSettings] = useState<AgentSettings>({
    autopilotEnabled: false,
    scheduleTime: '09:00',
    contentStrategy: 'mixed',
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [hasChanges, setHasChanges] = useState(false)
  const [testRunning, setTestRunning] = useState(false)

  const handleTestRun = async () => {
    setTestRunning(true)
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (res.ok && data.script) {
        toast.success(`Тест пройден! Создан сценарий: ${data.script.title}`)
      } else {
        toast.error(data.error ?? 'Ошибка тестового запуска')
      }
    } catch { toast.error('Ошибка соединения') }
    finally { setTestRunning(false) }
  }
  const [originalSettings, setOriginalSettings] = useState<AgentSettings | null>(null)

  useEffect(() => {
    fetchSettings()
  }, [])

  useEffect(() => {
    if (originalSettings) {
      const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings)
      setHasChanges(changed)
    }
  }, [settings, originalSettings])

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/settings')
      if (res.ok) {
        const data = await res.json()
        if (data) {
          const s = {
            autopilotEnabled: data?.autopilotEnabled ?? false,
            scheduleTime: data?.scheduleTime ?? '09:00',
            contentStrategy: data?.contentStrategy ?? 'mixed',
          }
          setSettings(s)
          setOriginalSettings(s)
        }
      }
    } catch (e: any) {
      console.error('Failed to fetch settings', e)
    } finally {
      setLoading(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })
      if (res.ok) {
        toast.success('Настройки AI-агента сохранены!')
        setOriginalSettings({ ...settings })
        setHasChanges(false)
      } else {
        toast.error('Ошибка сохранения')
      }
    } catch {
      toast.error('Ошибка сохранения')
    } finally {
      setSaving(false)
    }
  }

  const activeStrategy = STRATEGIES.find(s => s.value === (settings?.contentStrategy ?? 'mixed'))

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-muted-foreground">Загрузка настроек...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        title="Настройки AI-агента"
        description="Управление автопилотом, расписанием и стратегией контента"
      />

      {/* Agent Status Banner */}
      <SlideIn from="bottom" delay={0} className="mt-6">
        <div className={`relative overflow-hidden rounded-2xl p-5 ${
          settings?.autopilotEnabled
            ? 'bg-gradient-to-r from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20'
            : 'bg-gradient-to-r from-muted/50 via-muted/30 to-transparent border border-border'
        }`}>
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
              settings?.autopilotEnabled ? 'bg-emerald-500/15' : 'bg-muted'
            }`}>
              <Bot className={`w-6 h-6 ${settings?.autopilotEnabled ? 'text-emerald-500' : 'text-muted-foreground'}`} />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h3 className="font-display font-semibold">
                  {settings?.autopilotEnabled ? 'Агент активен' : 'Агент на паузе'}
                </h3>
                <div className={`w-2.5 h-2.5 rounded-full ${settings?.autopilotEnabled ? 'bg-emerald-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">
                {settings?.autopilotEnabled
                  ? `Генерация каждый день в ${settings?.scheduleTime ?? '09:00'} · Стратегия: ${activeStrategy?.label ?? 'Смешанная'}`
                  : 'Включите автопилот для автоматической генерации контента'
                }
              </p>
            </div>
            <div className="flex items-center gap-2">
              {settings?.autopilotEnabled ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              ) : (
                <XCircle className="w-5 h-5 text-muted-foreground/40" />
              )}
            </div>
          </div>
        </div>
      </SlideIn>

      <div className="space-y-5 mt-6">
        {/* Autopilot Toggle */}
        <FadeIn delay={0.05}>
          <Card className="overflow-hidden">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Power className="w-4 h-4 text-primary" />
                </div>
                Автопилот
              </CardTitle>
              <CardDescription className="ml-[42px]">
                Автоматическая генерация сценариев по расписанию
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className={`flex items-center justify-between p-4 rounded-xl transition-colors ${
                settings?.autopilotEnabled ? 'bg-emerald-500/5 border border-emerald-500/15' : 'bg-muted/30 border border-transparent'
              }`}>
                <div className="flex items-center gap-3">
                  <Activity className={`w-5 h-5 ${settings?.autopilotEnabled ? 'text-emerald-500' : 'text-muted-foreground/50'}`} />
                  <div>
                    <span className="font-medium text-sm">
                      {settings?.autopilotEnabled ? 'Автопилот включён' : 'Автопилот выключен'}
                    </span>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {settings?.autopilotEnabled ? 'AI генерирует контент автоматически' : 'Только ручная генерация'}
                    </p>
                  </div>
                </div>
                <Switch
                  checked={settings?.autopilotEnabled ?? false}
                  onCheckedChange={(v: boolean) => setSettings((prev: AgentSettings) => ({ ...(prev ?? {}), autopilotEnabled: v }))}
                />
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Schedule */}
        <FadeIn delay={0.1}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                  <Clock className="w-4 h-4 text-blue-500" />
                </div>
                Расписание генерации
              </CardTitle>
              <CardDescription className="ml-[42px]">
                Время ежедневного запуска AI-агента
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-end gap-4">
                <div className="flex-1 max-w-[200px]">
                  <Label className="text-xs text-muted-foreground mb-1.5 block">Время запуска</Label>
                  <Input
                    type="time"
                    value={settings?.scheduleTime ?? '09:00'}
                    onChange={(e: any) => setSettings((prev: AgentSettings) => ({ ...(prev ?? {}), scheduleTime: e?.target?.value ?? '09:00' }))}
                  />
                </div>
                <div className="flex items-center gap-2 pb-2">
                  <Info className="w-4 h-4 text-muted-foreground/50" />
                  <span className="text-xs text-muted-foreground">UTC timezone</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </FadeIn>

        {/* Content Strategy */}
        <FadeIn delay={0.15}>
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2.5 text-base">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                  <Layers className="w-4 h-4 text-purple-500" />
                </div>
                Стратегия контента
              </CardTitle>
              <CardDescription className="ml-[42px]">
                Определяет как агент выбирает темы
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {(STRATEGIES ?? []).map((s) => (
                  <button
                    key={s.value}
                    onClick={() => setSettings((prev: AgentSettings) => ({ ...(prev ?? {}), contentStrategy: s.value }))}
                    className={`text-left p-3.5 rounded-xl border transition-all ${
                      settings?.contentStrategy === s.value
                        ? 'border-primary/40 bg-primary/5 shadow-sm'
                        : 'border-transparent bg-muted/30 hover:bg-muted/50'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{s.icon}</span>
                      <span className="text-sm font-medium">{s.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 ml-7 line-clamp-2">{s.desc}</p>
                  </button>
                ))}
              </div>

              {activeStrategy && (
                <div className="p-4 rounded-xl bg-primary/5 border border-primary/10">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium">Активная стратегия</span>
                  </div>
                  <p className="text-sm text-muted-foreground ml-6">
                    {activeStrategy.icon} {activeStrategy.label} — {activeStrategy.desc.toLowerCase()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </FadeIn>

        {/* Save + Test Run Buttons */}
        <FadeIn delay={0.2}>
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
            <Button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="gap-2"
              size="lg"
            >
              <Save className="w-5 h-5" />
              {saving ? 'Сохранение...' : 'Сохранить настройки'}
            </Button>
            <Button
              variant="outline"
              onClick={handleTestRun}
              disabled={testRunning}
              className="gap-2"
              size="lg"
            >
              {testRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" />}
              {testRunning ? 'Генерация...' : 'Тестовый запуск'}
            </Button>
            {hasChanges && (
              <span className="text-xs text-amber-500 flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                Есть несохранённые изменения
              </span>
            )}
          </div>
        </FadeIn>
      </div>
    </div>
  )
}
