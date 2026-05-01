'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Slider } from '@/components/ui/slider'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/layouts/page-header'
import { FadeIn } from '@/components/ui/animate'
import { toast } from 'sonner'
import {
  Upload, Shield, Globe, Clock, Save, Settings, AlertTriangle,
  Key, Server, Timer, Ban, CheckCircle2, XCircle, Wifi, Smartphone,
  Plus, Pencil, Trash2, Send, Users, History, Eye, EyeOff,
  Film, Download, Loader2, Play, Video, RefreshCw, Sparkles, Monitor
} from 'lucide-react'
import { Progress } from '@/components/ui/progress'

/* ─── types ─── */
interface SocialAccount {
  id: string
  platform: string
  accountName: string
  username: string
  proxyUrl: string | null
  isActive: boolean
  isWarmedUp: boolean
  lastPostedAt: string | null
  postsToday: number
  dailyLimit: number
  notes: string | null
  createdAt: string
  _count: { publications: number }
}

interface ScriptItem {
  id: string
  title: string
  platform: string
  hook: string
  status: string
}

interface PostingSettings {
  postingConfig: any
  antiBanConfig: any
  proxyConfig: any
  dailyPostLimit: number
  accountWarmupDone: boolean
  publications: any[]
}

/* ─── helpers ─── */
const platformIcon = (p: string) => p === 'tiktok' ? '🎵' : p === 'youtube' ? '📺' : '🌐'
const platformLabel = (p: string) => p === 'tiktok' ? 'TikTok' : p === 'youtube' ? 'YouTube' : p
const statusLabel: Record<string, string> = {
  published: 'Опубликовано',
  scheduled: 'Запланировано',
  queued: 'В очереди',
  generating: 'Генерация…',
  ready: 'Готово',
  failed: 'Ошибка',
  skipped: 'Пропущено',
  draft: 'Черновик',
  pending: 'Ожидание',
}
const statusColor: Record<string, string> = {
  published: 'bg-green-500/10 text-green-400 border-green-500/20',
  scheduled: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  queued: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
  generating: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  ready: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  skipped: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  draft: 'bg-gray-500/10 text-gray-400 border-gray-500/20',
  pending: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20',
}

/* ─── empty form defaults ─── */
const emptyAccountForm = {
  platform: 'tiktok' as string,
  accountName: '',
  username: '',
  login: '',
  password: '',
  token: '',
  proxyUrl: '',
  dailyLimit: 3,
  notes: '',
}

export function PostingContent() {
  /* ── accounts state ── */
  const [accounts, setAccounts] = useState<SocialAccount[]>([])
  const [accountsLoading, setAccountsLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({ ...emptyAccountForm })
  const [formSaving, setFormSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  /* ── publish state ── */
  const [scripts, setScripts] = useState<ScriptItem[]>([])
  const [selectedScript, setSelectedScript] = useState<string>('')
  const [selectedAccounts, setSelectedAccounts] = useState<Set<string>>(new Set())
  const [publishing, setPublishing] = useState(false)
  const [generating, setGenerating] = useState(false)
  const [generatedVideos, setGeneratedVideos] = useState<any[]>([])
  const [generatingNewIdeas, setGeneratingNewIdeas] = useState(false)
  const [publishSimulation, setPublishSimulation] = useState<{ active: boolean; steps: string[]; currentStep: number; mode: string } | null>(null)

  /* ── history state ── */
  const [publications, setPublications] = useState<any[]>([])

  /* ── posting settings state ── */
  const [settingsData, setSettingsData] = useState<PostingSettings | null>(null)
  const [savingSettings, setSavingSettings] = useState(false)
  const [proxyEnabled, setProxyEnabled] = useState(false)
  const [proxyUrl, setProxyUrl] = useState('')
  const [ipRotation, setIpRotation] = useState(true)
  const [minDelay, setMinDelay] = useState(30)
  const [maxDelay, setMaxDelay] = useState(120)
  const [humanBehavior, setHumanBehavior] = useState(true)
  const [headlessBrowser, setHeadlessBrowser] = useState(true)
  const [mobileEmulation, setMobileEmulation] = useState(false)

  /* ── data fetching ── */
  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch('/api/accounts')
      if (res.ok) setAccounts(await res.json())
    } catch (e) { console.error('fetch accounts', e) }
    finally { setAccountsLoading(false) }
  }, [])

  const fetchScripts = useCallback(async () => {
    try {
      const res = await fetch('/api/scripts')
      if (res.ok) {
        const data = await res.json()
        setScripts(Array.isArray(data) ? data : data?.scripts ?? [])
      }
    } catch (e) { console.error('fetch scripts', e) }
  }, [])

  const fetchPostingData = useCallback(async () => {
    try {
      const res = await fetch('/api/posting')
      if (res.ok) {
        const d = await res.json()
        setSettingsData(d)
        setPublications(d?.publications ?? [])
        const proxy = d?.proxyConfig ?? {}
        setProxyEnabled(proxy?.enabled ?? false)
        setProxyUrl(proxy?.url ?? '')
        setIpRotation(proxy?.ipRotation ?? true)
        const ab = d?.antiBanConfig ?? {}
        setMinDelay(ab?.minDelay ?? 30)
        setMaxDelay(ab?.maxDelay ?? 120)
        setHumanBehavior(ab?.humanBehavior ?? true)
        const pc = d?.postingConfig ?? {}
        setHeadlessBrowser(pc?.headlessBrowser ?? true)
        setMobileEmulation(pc?.mobileEmulation ?? false)
      }
    } catch (e) { console.error('fetch posting', e) }
  }, [])

  const fetchGeneratedVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/video-generate')
      if (res.ok) setGeneratedVideos(await res.json())
    } catch (e) { console.error('fetch videos', e) }
  }, [])

  useEffect(() => {
    fetchAccounts()
    fetchScripts()
    fetchPostingData()
    fetchGeneratedVideos()
  }, [fetchAccounts, fetchScripts, fetchPostingData, fetchGeneratedVideos])

  /* ── account CRUD ── */
  const openAddDialog = () => {
    setEditingId(null)
    setForm({ ...emptyAccountForm })
    setShowPassword(false)
    setDialogOpen(true)
  }

  const openEditDialog = (acc: SocialAccount) => {
    setEditingId(acc.id)
    setForm({
      platform: acc.platform,
      accountName: acc.accountName,
      username: acc.username,
      login: '',
      password: '',
      token: '',
      proxyUrl: acc.proxyUrl ?? '',
      dailyLimit: acc.dailyLimit,
      notes: acc.notes ?? '',
    })
    setShowPassword(false)
    setDialogOpen(true)
  }

  const handleSaveAccount = async () => {
    if (!form.accountName.trim()) {
      toast.error('Введите название аккаунта')
      return
    }
    setFormSaving(true)
    try {
      const credentials: Record<string, string> = {}
      if (form.login) credentials.login = form.login
      if (form.password) credentials.password = form.password
      if (form.token) credentials.token = form.token

      const payload: any = {
        platform: form.platform,
        accountName: form.accountName.trim(),
        username: form.username.trim(),
        proxyUrl: form.proxyUrl.trim() || null,
        dailyLimit: form.dailyLimit,
        notes: form.notes.trim() || null,
      }
      // Only include credentials if at least one field is filled
      if (Object.keys(credentials).length > 0) {
        payload.credentials = credentials
      }

      if (editingId) {
        payload.id = editingId
        const res = await fetch('/api/accounts', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) { toast.success('Аккаунт обновлён'); setDialogOpen(false); fetchAccounts() }
        else toast.error('Ошибка обновления')
      } else {
        payload.credentials = credentials
        const res = await fetch('/api/accounts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
        if (res.ok) { toast.success('Аккаунт добавлен'); setDialogOpen(false); fetchAccounts() }
        else toast.error('Ошибка добавления')
      }
    } catch { toast.error('Ошибка соединения') }
    finally { setFormSaving(false) }
  }

  const handleDelete = async (id: string) => {
    setDeletingId(id)
    try {
      const res = await fetch(`/api/accounts?id=${id}`, { method: 'DELETE' })
      if (res.ok) { toast.success('Аккаунт удалён'); fetchAccounts() }
      else toast.error('Ошибка удаления')
    } catch { toast.error('Ошибка соединения') }
    finally { setDeletingId(null) }
  }

  const handleToggleActive = async (acc: SocialAccount) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, isActive: !acc.isActive }),
      })
      if (res.ok) fetchAccounts()
    } catch { /* ignore */ }
  }

  const handleToggleWarmup = async (acc: SocialAccount) => {
    try {
      const res = await fetch('/api/accounts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: acc.id, isWarmedUp: !acc.isWarmedUp }),
      })
      if (res.ok) fetchAccounts()
    } catch { /* ignore */ }
  }

  /* ── generate new script idea ── */
  const handleGenerateNewIdea = async () => {
    setGeneratingNewIdeas(true)
    try {
      const res = await fetch('/api/generate', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}' })
      const data = await res.json()
      if (res.ok && data.script) {
        toast.success(`Новый сценарий: ${data.script.title}`)
        fetchScripts()
      } else {
        toast.error(data.error ?? 'Ошибка генерации сценария')
      }
    } catch { toast.error('Ошибка соединения') }
    finally { setGeneratingNewIdeas(false) }
  }

  /* ── video generation (async with polling) ── */
  const generatingVideoIdRef = useRef<string | null>(null)
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const [genProgress, setGenProgress] = useState<{ step: string; progress: number } | null>(null)

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) { clearInterval(pollIntervalRef.current); pollIntervalRef.current = null }
    generatingVideoIdRef.current = null
    setGenProgress(null)
  }, [])

  const startPolling = useCallback((videoId: string) => {
    generatingVideoIdRef.current = videoId
    pollIntervalRef.current = setInterval(async () => {
      try {
        const res = await fetch(`/api/video-generate?videoId=${videoId}`)
        if (!res.ok) return
        const vid = await res.json()
        if (!vid) return
        const log = vid.generationLog ?? {}
        setGenProgress({ step: log.step ?? '', progress: log.progress ?? 0 })
        if (vid.status === 'ready') {
          toast.success('Видео готово!')
          stopPolling()
          setGenerating(false)
          fetchGeneratedVideos()
          fetchScripts()
        } else if (vid.status === 'failed') {
          toast.error('Ошибка генерации видео')
          stopPolling()
          setGenerating(false)
          fetchGeneratedVideos()
        } else if (vid.status === 'cancelled') {
          stopPolling()
          setGenerating(false)
          fetchGeneratedVideos()
        }
      } catch { /* ignore poll errors */ }
    }, 3000)
  }, [stopPolling, fetchGeneratedVideos, fetchScripts])

  useEffect(() => { return () => stopPolling() }, [stopPolling])

  const handleGenerateVideo = async () => {
    if (!selectedScript) { toast.error('Выберите сценарий'); return }
    setGenerating(true)
    setGenProgress({ step: 'Запуск...', progress: 0 })
    try {
      const res = await fetch('/api/video-generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scriptId: selectedScript }),
      })
      const data = await res.json()
      if (res.ok && data.videoId) {
        toast.success('Генерация видео запущена')
        startPolling(data.videoId)
        fetchGeneratedVideos()
      } else {
        toast.error(data.error ?? 'Ошибка генерации видео')
        setGenerating(false)
        setGenProgress(null)
      }
    } catch { toast.error('Ошибка соединения'); setGenerating(false); setGenProgress(null) }
  }

  const handleCancelGeneration = async () => {
    const vid = generatingVideoIdRef.current
    if (!vid) return
    try {
      await fetch(`/api/video-generate?videoId=${vid}`, { method: 'DELETE' })
      toast.success('Генерация отменена')
      stopPolling()
      setGenerating(false)
      fetchGeneratedVideos()
    } catch { toast.error('Ошибка отмены') }
  }

  const getVideoForScript = (scriptId: string) => {
    return generatedVideos.find((v: any) => v.scriptId === scriptId)
  }

  /* ── publish ── */
  const toggleAccountSelection = (id: string) => {
    setSelectedAccounts(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const selectAllActive = () => {
    const active = accounts.filter(a => a.isActive)
    setSelectedAccounts(new Set(active.map(a => a.id)))
  }

  const runPublishSimulation = async (mode: string, pubCount: number) => {
    const steps = mode === 'mobile'
      ? ['Запуск эмулятора мобильного устройства...', 'Открытие приложения...', 'Авторизация в аккаунте...', 'Загрузка видео...', 'Добавление описания и хештегов...', 'Нажатие «Опубликовать»...', 'Проверка публикации...', 'Готово!']
      : ['Запуск headless браузера...', 'Навигация на платформу...', 'Вход в аккаунт...', 'Переход к загрузке видео...', 'Выбор файла видео...', 'Заполнение описания и хештегов...', 'Публикация контента...', 'Верификация...', 'Готово!']
    setPublishSimulation({ active: true, steps, currentStep: 0, mode })
    for (let i = 0; i < steps.length; i++) {
      await new Promise(r => setTimeout(r, 600 + Math.random() * 900))
      setPublishSimulation(prev => prev ? { ...prev, currentStep: i } : null)
    }
    await new Promise(r => setTimeout(r, 500))
    setPublishSimulation(null)
  }

  const handlePublish = async () => {
    if (!selectedScript) { toast.error('Выберите сценарий'); return }
    if (selectedAccounts.size === 0) { toast.error('Выберите хотя бы один аккаунт'); return }
    setPublishing(true)

    // Show simulation UI
    const simMode = mobileEmulation ? 'mobile' : headlessBrowser ? 'headless' : 'api'
    if (simMode !== 'api') {
      runPublishSimulation(simMode, selectedAccounts.size)
    }

    try {
      const res = await fetch('/api/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          scriptId: selectedScript,
          accountIds: Array.from(selectedAccounts),
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        toast.success(`Публикация: ${data.publications?.length ?? 0} аккаунтов`)
        setSelectedScript('')
        setSelectedAccounts(new Set())
        fetchAccounts()
        fetchPostingData()
        fetchGeneratedVideos()
      } else {
        toast.error(data.error ?? 'Ошибка публикации')
      }
    } catch { toast.error('Ошибка соединения') }
    finally { setPublishing(false) }
  }

  /* ── save posting settings ── */
  const handleSaveSettings = async () => {
    setSavingSettings(true)
    try {
      const res = await fetch('/api/posting', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          proxyConfig: { enabled: proxyEnabled, url: proxyUrl, ipRotation },
          antiBanConfig: { minDelay, maxDelay, humanBehavior },
          postingConfig: { headlessBrowser, mobileEmulation },
        }),
      })
      if (res.ok) toast.success('Настройки сохранены!')
      else toast.error('Ошибка сохранения')
    } catch { toast.error('Ошибка соединения') }
    finally { setSavingSettings(false) }
  }

  /* ── render: loading ── */
  if (accountsLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <p className="text-sm text-gray-400">Загрузка...</p>
        </div>
      </div>
    )
  }

  const activeAccounts = accounts.filter(a => a.isActive)

  return (
    <div>
      <PageHeader
        title="Постинг и аккаунты"
        description="Управление аккаунтами, публикация контента и история"
      />

      <Tabs defaultValue="accounts" className="mt-6">
        <TabsList className="grid w-full grid-cols-4 mb-6">
          <TabsTrigger value="accounts" className="gap-1.5 text-xs sm:text-sm">
            <Users className="w-4 h-4" /> Аккаунты
          </TabsTrigger>
          <TabsTrigger value="publish" className="gap-1.5 text-xs sm:text-sm">
            <Send className="w-4 h-4" /> Опубликовать
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-1.5 text-xs sm:text-sm">
            <History className="w-4 h-4" /> История
          </TabsTrigger>
          <TabsTrigger value="settings" className="gap-1.5 text-xs sm:text-sm">
            <Settings className="w-4 h-4" /> Настройки
          </TabsTrigger>
        </TabsList>

        {/* ═══════ TAB: ACCOUNTS ═══════ */}
        <TabsContent value="accounts">
          <FadeIn>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm text-gray-400">
                {accounts.length === 0 ? 'Нет аккаунтов' : `${accounts.length} аккаунтов`}
              </p>
              <Button onClick={openAddDialog} size="sm" className="gap-1.5">
                <Plus className="w-4 h-4" /> Добавить аккаунт
              </Button>
            </div>

            {accounts.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-300 font-medium mb-1">Нет добавленных аккаунтов</p>
                  <p className="text-sm text-gray-500 mb-4">Добавьте аккаунт TikTok или YouTube для публикации контента</p>
                  <Button onClick={openAddDialog} size="sm" className="gap-1.5">
                    <Plus className="w-4 h-4" /> Добавить первый аккаунт
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-3">
                {accounts.map((acc) => (
                  <Card key={acc.id} className={`transition-all ${!acc.isActive ? 'opacity-60' : ''}`}>
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 text-lg">
                            {platformIcon(acc.platform)}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm text-gray-200 truncate">{acc.accountName}</p>
                              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                                acc.isActive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                              }`}>
                                {acc.isActive ? 'Активен' : 'Отключён'}
                              </span>
                              {acc.isWarmedUp && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border bg-orange-500/10 text-orange-400 border-orange-500/20">
                                  🔥 Прогрет
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {platformLabel(acc.platform)} • @{acc.username || '—'}
                              {acc.proxyUrl && ' • 🔒 Прокси'}
                            </p>
                            <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                              <span>📊 {acc.postsToday}/{acc.dailyLimit} сегодня</span>
                              <span>📦 {acc._count?.publications ?? 0} всего</span>
                              {acc.lastPostedAt && (
                                <span>🕐 {new Date(acc.lastPostedAt).toLocaleDateString('ru-RU')}</span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => handleToggleActive(acc)}
                            title={acc.isActive ? 'Отключить' : 'Включить'}
                          >
                            {acc.isActive ? <Eye className="w-4 h-4 text-green-400" /> : <EyeOff className="w-4 h-4 text-gray-500" />}
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => openEditDialog(acc)}
                          >
                            <Pencil className="w-4 h-4 text-gray-400" />
                          </Button>
                          <Button
                            variant="ghost" size="icon" className="h-8 w-8"
                            onClick={() => handleDelete(acc.id)}
                            disabled={deletingId === acc.id}
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </FadeIn>
        </TabsContent>

        {/* ═══════ TAB: PUBLISH ═══════ */}
        <TabsContent value="publish">
          <FadeIn>
            <div className="space-y-5">
              {/* Script selector */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Upload className="w-4 h-4 text-primary" />
                      </div>
                      Выберите сценарий
                    </CardTitle>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => fetchScripts()} className="gap-1.5 text-xs text-muted-foreground" title="Обновить список">
                        <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">Обновить</span>
                      </Button>
                      <Button
                        variant="outline" size="sm"
                        disabled={generatingNewIdeas}
                        onClick={handleGenerateNewIdea}
                        className="gap-1.5 text-xs"
                        title="Сгенерировать новый сценарий"
                      >
                        {generatingNewIdeas ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">Новая идея</span>
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {scripts.length === 0 ? (
                    <p className="text-sm text-gray-500">Нет доступных сценариев. Создайте сценарий в разделе «Сценарии».</p>
                  ) : (
                    <Select value={selectedScript} onValueChange={setSelectedScript}>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Выберите сценарий для публикации" />
                      </SelectTrigger>
                      <SelectContent>
                        {scripts.map(s => (
                          <SelectItem key={s.id} value={s.id}>
                            <span className="flex items-center gap-2">
                              {platformIcon(s.platform)} {s.title}
                              <span className="text-gray-500 text-xs">({statusLabel[s.status] ?? s.status})</span>
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </CardContent>
              </Card>

              {/* Account selection */}
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                      Аккаунты для публикации
                    </CardTitle>
                    {activeAccounts.length > 0 && (
                      <Button variant="ghost" size="sm" onClick={selectAllActive} className="text-xs">
                        Выбрать все ({activeAccounts.length})
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {activeAccounts.length === 0 ? (
                    <p className="text-sm text-gray-500">Нет активных аккаунтов. Добавьте аккаунт во вкладке «Аккаунты».</p>
                  ) : (
                    <div className="space-y-2">
                      {activeAccounts.map(acc => (
                        <label
                          key={acc.id}
                          className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${
                            selectedAccounts.has(acc.id)
                              ? 'bg-primary/5 border border-primary/20'
                              : 'bg-muted/30 border border-transparent hover:bg-muted/50'
                          }`}
                        >
                          <Checkbox
                            checked={selectedAccounts.has(acc.id)}
                            onCheckedChange={() => toggleAccountSelection(acc.id)}
                          />
                          <span className="text-base">{platformIcon(acc.platform)}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-200 truncate">{acc.accountName}</p>
                            <p className="text-xs text-gray-500">@{acc.username || '—'} • {acc.postsToday}/{acc.dailyLimit} сегодня</p>
                          </div>
                          {acc.postsToday >= acc.dailyLimit && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium border bg-red-500/10 text-red-400 border-red-500/20">
                              Лимит
                            </span>
                          )}
                        </label>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Video status for selected script */}
              {selectedScript && (() => {
                const vid = getVideoForScript(selectedScript)
                return (
                  <Card>
                    <CardContent className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
                            <Film className="w-5 h-5 text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-200">Видео</p>
                            <p className="text-xs text-gray-500">
                              {vid
                                ? vid.status === 'ready'
                                  ? `✅ Готово — ${vid.durationSeconds ?? 0}сек`
                                  : vid.status === 'generating'
                                  ? '⏳ Генерация...'
                                  : vid.status === 'failed'
                                  ? '❌ Ошибка'
                                  : statusLabel[vid.status] ?? vid.status
                                : 'Видео не создано'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {vid?.status === 'ready' && vid.videoPath && (
                            <a href={vid.videoPath} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="gap-1.5">
                                <Download className="w-4 h-4" /> Скачать
                              </Button>
                            </a>
                          )}
                          {generating && (
                            <Button variant="ghost" size="sm" onClick={handleCancelGeneration} className="gap-1.5 text-red-400 hover:text-red-300">
                              <XCircle className="w-4 h-4" /> Отменить
                            </Button>
                          )}
                          <Button
                            onClick={handleGenerateVideo}
                            disabled={generating}
                            size="sm"
                            variant={vid?.status === 'ready' ? 'outline' : 'default'}
                            className="gap-1.5"
                          >
                            {generating ? (
                              <><Loader2 className="w-4 h-4 animate-spin" /> Генерация...</>
                            ) : vid?.status === 'ready' ? (
                              <><Film className="w-4 h-4" /> Пересоздать</>
                            ) : (
                              <><Video className="w-4 h-4" /> Создать видео</>
                            )}
                          </Button>
                        </div>
                      </div>
                      {/* Progress bar */}
                      {generating && genProgress && (
                        <div>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{genProgress.step}</span>
                            <span className="text-xs font-mono text-primary">{genProgress.progress}%</span>
                          </div>
                          <Progress value={genProgress.progress} className="h-1.5" />
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )
              })()}

              {/* Publishing Simulation Viewer */}
              {publishSimulation?.active && (
                <Card className="border-primary/30 overflow-hidden">
                  <CardContent className="p-0">
                    <div className="bg-muted/60 px-4 py-2 flex items-center gap-2 border-b border-border/40">
                      <div className="flex gap-1.5">
                        <div className="w-2.5 h-2.5 rounded-full bg-red-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/70" />
                        <div className="w-2.5 h-2.5 rounded-full bg-green-500/70" />
                      </div>
                      <span className="text-xs text-muted-foreground ml-2 flex items-center gap-1.5">
                        {publishSimulation.mode === 'mobile' ? (
                          <><Smartphone className="w-3.5 h-3.5" /> Mobile Emulator</>
                        ) : (
                          <><Monitor className="w-3.5 h-3.5" /> Headless Browser</>
                        )}
                      </span>
                      <span className="text-[10px] text-muted-foreground/50 ml-auto">Только просмотр</span>
                    </div>
                    <div className={`p-4 min-h-[140px] font-mono text-xs space-y-1.5 ${publishSimulation.mode === 'mobile' ? 'bg-zinc-950 max-w-[320px] mx-auto rounded-b-2xl border-x border-b border-border/30' : 'bg-zinc-950'}`}>
                      {publishSimulation.steps.map((step, i) => (
                        <div key={i} className={`flex items-center gap-2 transition-all duration-300 ${i > publishSimulation.currentStep ? 'opacity-0' : i === publishSimulation.currentStep ? 'text-primary' : 'text-green-400/70'}`}>
                          {i < publishSimulation.currentStep ? (
                            <CheckCircle2 className="w-3 h-3 text-green-400/70 flex-shrink-0" />
                          ) : i === publishSimulation.currentStep ? (
                            <Loader2 className="w-3 h-3 animate-spin text-primary flex-shrink-0" />
                          ) : (
                            <div className="w-3 h-3 flex-shrink-0" />
                          )}
                          <span>{step}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={handlePublish}
                  disabled={publishing || !selectedScript || selectedAccounts.size === 0}
                  size="lg"
                  className="gap-2 flex-1"
                >
                  <Send className="w-5 h-5" />
                  {publishing ? 'Публикация...' : `Опубликовать на ${selectedAccounts.size} акк.`}
                </Button>
              </div>
            </div>
          </FadeIn>
        </TabsContent>

        {/* ═══════ TAB: HISTORY ═══════ */}
        <TabsContent value="history">
          <FadeIn>
            {publications.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <History className="w-12 h-12 mx-auto mb-3 text-gray-600" />
                  <p className="text-gray-300 font-medium">Нет публикаций</p>
                  <p className="text-sm text-gray-500 mt-1">Опубликуйте контент — он появится здесь</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {publications.map((p: any) => (
                  <div key={p.id} className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30 border border-transparent">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-base">{platformIcon(p.platform)}</span>
                      <div className="min-w-0">
                        <p className="text-sm text-gray-200 truncate max-w-[280px]">{p.caption ?? 'Без описания'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {p.account?.accountName && <span className="text-gray-400">{p.account.accountName} · </span>}
                          {new Date(p.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium border ${
                      statusColor[p.status] ?? 'bg-gray-500/10 text-gray-400 border-gray-500/20'
                    }`}>
                      {statusLabel[p.status] ?? p.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </FadeIn>
        </TabsContent>

        {/* ═══════ TAB: SETTINGS ═══════ */}
        <TabsContent value="settings">
          <FadeIn>
            <div className="space-y-5">
              {/* Posting Method */}
              <Card>
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
                      <Upload className="w-4 h-4 text-blue-500" />
                    </div>
                    Метод публикации
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Globe className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">Headless Browser</p>
                        <p className="text-xs text-gray-500">Автоматический логин + загрузка + публикация</p>
                      </div>
                    </div>
                    <Switch checked={headlessBrowser} onCheckedChange={setHeadlessBrowser} />
                  </div>
                  <div className="flex items-center justify-between p-3.5 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-3">
                      <Smartphone className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">Mobile Simulation</p>
                        <p className="text-xs text-gray-500">Эмуляция мобильного устройства</p>
                      </div>
                    </div>
                    <Switch checked={mobileEmulation} onCheckedChange={setMobileEmulation} />
                  </div>
                </CardContent>
              </Card>

              {/* Anti-Ban */}
              <Card className="border-orange-500/20">
                <CardHeader className="pb-4">
                  <CardTitle className="flex items-center gap-2.5 text-base">
                    <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                      <Shield className="w-4 h-4 text-orange-500" />
                    </div>
                    Анти-бан защита
                  </CardTitle>
                  <CardDescription className="ml-[42px]">Прокси, ротация IP, задержки</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className={`p-4 rounded-xl border transition-colors ${proxyEnabled ? 'bg-orange-500/5 border-orange-500/15' : 'bg-muted/30 border-transparent'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Server className="w-4 h-4 text-orange-400" />
                        <span className="text-sm font-medium text-gray-300">Прокси-сервер</span>
                      </div>
                      <Switch checked={proxyEnabled} onCheckedChange={setProxyEnabled} />
                    </div>
                    {proxyEnabled && (
                      <div className="space-y-3 mt-2">
                        <Input
                          placeholder="socks5://user:pass@ip:port"
                          value={proxyUrl}
                          onChange={(e: any) => setProxyUrl(e?.target?.value ?? '')}
                        />
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Wifi className="w-4 h-4 text-gray-400" />
                            <span className="text-sm text-gray-300">Ротация IP</span>
                          </div>
                          <Switch checked={ipRotation} onCheckedChange={setIpRotation} />
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-2 mb-3">
                      <Timer className="w-4 h-4 text-orange-400" />
                      <span className="text-sm font-medium text-gray-300">Задержки между действиями</span>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-xs text-gray-500">Мин (секунды)</Label>
                        <Input type="number" value={minDelay} onChange={(e: any) => setMinDelay(Number(e?.target?.value) || 30)} />
                      </div>
                      <div>
                        <Label className="text-xs text-gray-500">Макс (секунды)</Label>
                        <Input type="number" value={maxDelay} onChange={(e: any) => setMaxDelay(Number(e?.target?.value) || 120)} />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                    <div className="flex items-center gap-2">
                      <Ban className="w-4 h-4 text-orange-400" />
                      <div>
                        <p className="text-sm font-medium text-gray-300">Имитация поведения человека</p>
                        <p className="text-xs text-gray-500">Рандомные паузы, скролл, клики</p>
                      </div>
                    </div>
                    <Switch checked={humanBehavior} onCheckedChange={setHumanBehavior} />
                  </div>
                </CardContent>
              </Card>

              <Button onClick={handleSaveSettings} disabled={savingSettings} className="gap-2" size="lg">
                <Save className="w-5 h-5" />
                {savingSettings ? 'Сохранение...' : 'Сохранить настройки'}
              </Button>
            </div>
          </FadeIn>
        </TabsContent>
      </Tabs>

      {/* ═══════ ADD/EDIT ACCOUNT DIALOG ═══════ */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Редактировать аккаунт' : 'Добавить аккаунт'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Платформа</Label>
              <Select value={form.platform} onValueChange={(v) => setForm(f => ({ ...f, platform: v }))}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="tiktok">🎵 TikTok</SelectItem>
                  <SelectItem value="youtube">📺 YouTube</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Название аккаунта *</Label>
              <Input
                placeholder="Например: Основной TikTok"
                value={form.accountName}
                onChange={(e: any) => setForm(f => ({ ...f, accountName: e?.target?.value ?? '' }))}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Имя пользователя</Label>
              <Input
                placeholder="@username"
                value={form.username}
                onChange={(e: any) => setForm(f => ({ ...f, username: e?.target?.value ?? '' }))}
              />
            </div>

            <div className="space-y-3 p-3 rounded-xl bg-muted/30">
              <p className="text-xs font-medium text-gray-400 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5" /> Данные для входа {editingId && <span className="text-gray-600">(оставьте пустым, чтобы не менять)</span>}
              </p>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Логин / Email</Label>
                <Input
                  placeholder="login@example.com"
                  value={form.login}
                  onChange={(e: any) => setForm(f => ({ ...f, login: e?.target?.value ?? '' }))}
                />
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">Пароль</Label>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={form.password}
                    onChange={(e: any) => setForm(f => ({ ...f, password: e?.target?.value ?? '' }))}
                  />
                  <button
                    type="button"
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <div>
                <Label className="text-xs text-gray-500 mb-1 block">API Токен / Cookie</Label>
                <Input
                  placeholder="Опционально"
                  value={form.token}
                  onChange={(e: any) => setForm(f => ({ ...f, token: e?.target?.value ?? '' }))}
                />
              </div>
            </div>

            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Прокси-сервер</Label>
              <Input
                placeholder="socks5://user:pass@ip:port"
                value={form.proxyUrl}
                onChange={(e: any) => setForm(f => ({ ...f, proxyUrl: e?.target?.value ?? '' }))}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Лимит постов в день: {form.dailyLimit}</Label>
              <Slider
                value={[form.dailyLimit]}
                onValueChange={(v) => setForm(f => ({ ...f, dailyLimit: v[0] }))}
                min={1} max={20} step={1}
              />
            </div>

            <div>
              <Label className="text-xs text-gray-400 mb-1.5 block">Заметки</Label>
              <Textarea
                placeholder="Дополнительная информация..."
                value={form.notes}
                onChange={(e: any) => setForm(f => ({ ...f, notes: e?.target?.value ?? '' }))}
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>Отмена</Button>
            <Button onClick={handleSaveAccount} disabled={formSaving} className="gap-1.5">
              {formSaving ? 'Сохранение...' : editingId ? 'Сохранить' : 'Добавить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
