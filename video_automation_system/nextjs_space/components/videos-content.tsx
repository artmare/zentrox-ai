'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import Image from 'next/image'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import {
  Film, Download, Trash2, XCircle, Loader2, Search,
  Clock, CheckCircle, AlertTriangle, RefreshCw, Play
} from 'lucide-react'

type Video = {
  id: string
  scriptId?: string
  platform: string
  videoPath?: string
  thumbnailPath?: string
  durationSeconds?: number
  resolution?: string
  status?: string
  generationLog?: any
  createdAt?: string
  script?: { title?: string; platform?: string }
}

const statusConfig: Record<string, { label: string; icon: any; color: string }> = {
  pending: { label: '\u041e\u0436\u0438\u0434\u0430\u043d\u0438\u0435', icon: Clock, color: 'text-yellow-400' },
  generating: { label: '\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f', icon: Loader2, color: 'text-blue-400' },
  ready: { label: '\u0413\u043e\u0442\u043e\u0432\u043e', icon: CheckCircle, color: 'text-green-400' },
  failed: { label: '\u041e\u0448\u0438\u0431\u043a\u0430', icon: AlertTriangle, color: 'text-red-400' },
  cancelled: { label: '\u041e\u0442\u043c\u0435\u043d\u0435\u043d\u043e', icon: XCircle, color: 'text-gray-400' },
}

export function VideosContent() {
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState<string>('all')
  const [previewVideo, setPreviewVideo] = useState<Video | null>(null)
  const pollRef = useRef<NodeJS.Timeout | null>(null)

  const fetchVideos = useCallback(async () => {
    try {
      const res = await fetch('/api/video-generate')
      if (res.ok) setVideos(await res.json())
    } catch (e) { console.error('fetch videos', e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchVideos() }, [fetchVideos])

  useEffect(() => {
    const hasGenerating = videos.some(v => v.status === 'generating' || v.status === 'pending')
    if (hasGenerating) {
      pollRef.current = setInterval(fetchVideos, 3000)
    } else if (pollRef.current) {
      clearInterval(pollRef.current); pollRef.current = null
    }
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [videos, fetchVideos])

  const handleCancel = async (videoId: string) => {
    try {
      const res = await fetch(`/api/video-generate?videoId=${videoId}`, { method: 'DELETE' })
      if (res.ok) { toast.success('\u0413\u0435\u043d\u0435\u0440\u0430\u0446\u0438\u044f \u043e\u0442\u043c\u0435\u043d\u0435\u043d\u0430'); fetchVideos() }
      else { const d = await res.json(); toast.error(d.error ?? '\u041d\u0435 \u0443\u0434\u0430\u043b\u043e\u0441\u044c \u043e\u0442\u043c\u0435\u043d\u0438\u0442\u044c') }
    } catch { toast.error('\u041e\u0448\u0438\u0431\u043a\u0430 \u0441\u043e\u0435\u0434\u0438\u043d\u0435\u043d\u0438\u044f') }
  }

  const handleDelete = async (videoId: string) => {
    if (!confirm('\u0423\u0434\u0430\u043b\u0438\u0442\u044c \u044d\u0442\u043e \u0432\u0438\u0434\u0435\u043e?')) return
    try {
      const res = await fetch(`/api/video-generate?videoId=${videoId}&delete=true`, { method: 'DELETE' })
      if (res.ok) { toast.success('\u0412\u0438\u0434\u0435\u043e \u0443\u0434\u0430\u043b\u0435\u043d\u043e'); fetchVideos() }
    } catch { toast.error('\u041e\u0448\u0438\u0431\u043a\u0430') }
  }

  const filtered = videos.filter(v => {
    if (filter !== 'all' && v.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      return (v.script?.title ?? '').toLowerCase().includes(q) || (v.platform ?? '').toLowerCase().includes(q)
    }
    return true
  })

  const stats = {
    total: videos.length,
    ready: videos.filter(v => v.status === 'ready').length,
    generating: videos.filter(v => v.status === 'generating' || v.status === 'pending').length,
    failed: videos.filter(v => v.status === 'failed').length,
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-display font-bold tracking-tight">\u041c\u043e\u0438 \u0432\u0438\u0434\u0435\u043e</h1>
        <p className="text-sm text-muted-foreground mt-1">\u0412\u0441\u0435 \u0441\u0433\u0435\u043d\u0435\u0440\u0438\u0440\u043e\u0432\u0430\u043d\u043d\u044b\u0435 \u0432\u0438\u0434\u0435\u043e \u0438 \u0438\u0445 \u0441\u0442\u0430\u0442\u0443\u0441</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: '\u0412\u0441\u0435\u0433\u043e', value: stats.total, color: 'text-foreground' },
          { label: '\u0413\u043e\u0442\u043e\u0432\u043e', value: stats.ready, color: 'text-green-400' },
          { label: '\u0412 \u043f\u0440\u043e\u0446\u0435\u0441\u0441\u0435', value: stats.generating, color: 'text-blue-400' },
          { label: '\u041e\u0448\u0438\u0431\u043a\u0438', value: stats.failed, color: 'text-red-400' },
        ].map(s => (
          <Card key={s.label}>
            <CardContent className="p-4 text-center">
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{s.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="\u041f\u043e\u0438\u0441\u043a \u043f\u043e \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044e..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          {['all', 'ready', 'generating', 'pending', 'failed', 'cancelled'].map(f => (
            <Button key={f} variant={filter === f ? 'default' : 'outline'} size="sm" onClick={() => setFilter(f)} className="text-xs">
              {f === 'all' ? '\u0412\u0441\u0435' : (statusConfig[f]?.label ?? f)}
            </Button>
          ))}
          <Button variant="outline" size="sm" onClick={fetchVideos} className="gap-1.5 ml-auto">
            <RefreshCw className="w-3.5 h-3.5" /> <span className="hidden sm:inline">\u041e\u0431\u043d\u043e\u0432\u0438\u0442\u044c</span>
          </Button>
        </div>
      </div>

      {/* Video List */}
      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Film className="w-12 h-12 text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">{videos.length === 0 ? '\u0421\u043e\u0437\u0434\u0430\u0439\u0442\u0435 \u0432\u0438\u0434\u0435\u043e \u0432 \u0440\u0430\u0437\u0434\u0435\u043b\u0435 \u00ab\u0410\u0432\u0442\u043e\u043f\u043e\u0441\u0442\u0438\u043d\u0433\u00bb' : '\u041f\u043e\u043f\u0440\u043e\u0431\u0443\u0439\u0442\u0435 \u0438\u0437\u043c\u0435\u043d\u0438\u0442\u044c \u0444\u0438\u043b\u044c\u0442\u0440\u044b'}</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map(v => {
            const cfg = statusConfig[v.status ?? 'pending'] ?? statusConfig.pending
            const Icon = cfg.icon
            const log = v.generationLog as any
            const progress = log?.progress ?? 0
            const isActive = v.status === 'generating' || v.status === 'pending'

            return (
              <Card key={v.id} className="overflow-hidden hover:border-primary/20 transition-colors">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-3 sm:gap-4">
                    {/* Thumbnail / Preview trigger */}
                    <button
                      onClick={() => v.status === 'ready' && v.videoPath ? setPreviewVideo(v) : undefined}
                      className={`w-20 h-14 sm:w-24 sm:h-16 rounded-lg bg-muted/50 overflow-hidden flex-shrink-0 flex items-center justify-center relative group ${v.status === 'ready' ? 'cursor-pointer' : ''}`}
                    >
                      {v.thumbnailPath ? (
                        <Image
                          src={v.thumbnailPath}
                          alt="Video thumbnail"
                          fill
                          sizes="96px"
                          className="object-cover"
                        />
                      ) : (
                        <Film className="w-6 h-6 text-muted-foreground/30" />
                      )}
                      {v.status === 'ready' && v.videoPath && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <Play className="w-6 h-6 text-white" fill="white" />
                        </div>
                      )}
                    </button>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="text-sm font-semibold truncate">{v.script?.title ?? '\u0411\u0435\u0437 \u043d\u0430\u0437\u0432\u0430\u043d\u0438\u044f'}</h3>
                        <span className={`inline-flex items-center gap-1 text-xs font-medium ${cfg.color}`}>
                          <Icon className={`w-3 h-3 ${v.status === 'generating' ? 'animate-spin' : ''}`} />
                          {cfg.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 sm:gap-3 text-xs text-muted-foreground flex-wrap">
                        <span className="capitalize">{v.platform}</span>
                        {v.durationSeconds ? <span>{Math.round(v.durationSeconds)}\u0441\u0435\u043a</span> : null}
                        {v.createdAt && (
                          <span>{new Date(v.createdAt).toLocaleDateString('ru-RU', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                        )}
                      </div>
                      {/* Progress bar */}
                      {isActive && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-muted-foreground">{log?.step ?? '\u041f\u043e\u0434\u0433\u043e\u0442\u043e\u0432\u043a\u0430...'}</span>
                            <span className="text-xs font-mono text-primary">{progress}%</span>
                          </div>
                          <Progress value={progress} className="h-1.5" />
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {v.status === 'ready' && v.videoPath && (
                        <>
                          <Button variant="outline" size="sm" className="gap-1.5 text-xs hidden sm:flex" onClick={() => setPreviewVideo(v)}>
                            <Play className="w-3.5 h-3.5" /> \u0421\u043c\u043e\u0442\u0440\u0435\u0442\u044c
                          </Button>
                          <a href={v.videoPath} download>
                            <Button variant="ghost" size="sm"><Download className="w-4 h-4" /></Button>
                          </a>
                        </>
                      )}
                      {isActive && (
                        <Button variant="ghost" size="sm" onClick={() => handleCancel(v.id)} className="text-red-400 hover:text-red-300" title="\u041e\u0442\u043c\u0435\u043d\u0438\u0442\u044c">
                          <XCircle className="w-4 h-4" />
                        </Button>
                      )}
                      {/* Delete for all statuses */}
                      <Button variant="ghost" size="sm" onClick={() => handleDelete(v.id)} className="text-muted-foreground hover:text-red-400" title="\u0423\u0434\u0430\u043b\u0438\u0442\u044c">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}

      {/* Video Preview Modal */}
      <Dialog open={!!previewVideo} onOpenChange={(open) => { if (!open) setPreviewVideo(null) }}>
        <DialogContent className="max-w-2xl p-0 overflow-hidden bg-black border-border/50">
          <DialogHeader className="p-4 pb-2">
            <DialogTitle className="text-sm text-white truncate pr-8">
              {previewVideo?.script?.title ?? '\u041f\u0440\u043e\u0441\u043c\u043e\u0442\u0440 \u0432\u0438\u0434\u0435\u043e'}
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center bg-black px-4 pb-4">
            {previewVideo?.videoPath && (
              <video
                key={previewVideo.id}
                src={previewVideo.videoPath}
                controls
                autoPlay
                className="max-h-[70vh] rounded-lg"
                style={{ maxWidth: '100%' }}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
