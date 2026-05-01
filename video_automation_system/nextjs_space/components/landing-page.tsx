'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { FadeIn, SlideIn, Stagger, StaggerItem } from '@/components/ui/animate'
import {
  Zap, Video, TrendingUp, Bot, Sparkles, Target,
  Play, ArrowRight, Shield, Clock, BarChart3, Globe,
  ChevronRight, Check, Wand2, Brain, Layers,
  Rocket, Eye, MousePointerClick, RefreshCw, Users,
  Flame, Lock, Activity, Crown, Star, Infinity,
  MonitorSmartphone, Cpu, Gauge
} from 'lucide-react'

/* ────────── helper: counter animation ────────── */
function CountUp({ target, suffix = '+' }: { target: number; suffix?: string }) {
  const [val, setVal] = useState(0)
  useEffect(() => {
    let start = 0
    const step = Math.ceil(1500 / target)
    const timer = setInterval(() => {
      start++
      setVal(start)
      if (start >= target) clearInterval(timer)
    }, step)
    return () => clearInterval(timer)
  }, [target])
  return (
    <span className="font-display text-4xl md:text-5xl font-black bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">
      {val}{suffix}
    </span>
  )
}

/* ────────── section badge ────────── */
function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider">
      {children}
    </span>
  )
}

/* ────────── platform icon (TikTok SVG) ────────── */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.88 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.46V13a8.28 8.28 0 005.58 2.16v-3.44a4.85 4.85 0 01-3.77-1.68V6.69h3.77z" />
    </svg>
  )
}

function InstagramIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
      <circle cx="12" cy="12" r="5" />
      <circle cx="17.5" cy="6.5" r="1.5" fill="currentColor" stroke="none" />
    </svg>
  )
}

/* ────────── pricing data ────────── */
const pricingPlans = [
  {
    name: 'Starter',
    price: '$49',
    period: '/мес',
    desc: 'Для старта и тестирования',
    icon: Rocket,
    color: 'from-blue-500 to-cyan-500',
    popular: false,
    features: [
      '1 аккаунт',
      '5 видео в день',
      '2 платформы',
      'Базовый анализ трендов',
      'Стандартные шаблоны',
      'Email поддержка',
    ],
    missing: [
      'A/B тестирование',
      'Приоритетная поддержка',
    ],
  },
  {
    name: 'Pro',
    price: '$149',
    period: '/мес',
    desc: 'Для серьёзного роста',
    icon: Crown,
    color: 'from-primary to-purple-400',
    popular: true,
    features: [
      '5 аккаунтов',
      '30 видео в день',
      '3 платформы',
      'Продвинутый анализ трендов',
      'A/B тестирование вариантов',
      'Самообучение AI',
      'Анти-бан защита PRO',
      'Приоритетная поддержка',
    ],
    missing: [],
  },
  {
    name: 'Unlimited',
    price: '$349',
    period: '/мес',
    desc: 'Для агентств и команд',
    icon: Infinity,
    color: 'from-orange-500 to-red-500',
    popular: false,
    features: [
      'Безлимит аккаунтов',
      'Безлимит видео',
      'Все 3 платформы',
      'Real-time трендовый движок',
      'A/B тестирование + автовыбор',
      'Глубокое самообучение',
      'Максимальная анти-бан защита',
      'Персональный менеджер',
      'API доступ',
      'White-label опция',
    ],
    missing: [],
  },
]

/* ────────── features data ────────── */
const features = [
  { icon: Bot, title: 'Полная автономия 24/7', desc: 'Бот работает без остановки. Создаёт, оптимизирует и публикует видео пока ты спишь. Минимум вмешательства — максимум результата.', gradient: 'from-violet-500 to-purple-600' },
  { icon: Users, title: 'Мульти-аккаунт постинг', desc: 'Публикуй на десятки аккаунтов одновременно. Уникализация контента для каждого канала. Масштабируй без ограничений.', gradient: 'from-blue-500 to-cyan-500' },
  { icon: TrendingUp, title: 'Real-time анализ трендов', desc: 'AI мониторит тренды в реальном времени. Ловит волну до того, как она взлетит. Твои видео всегда в топе актуального.', gradient: 'from-green-500 to-emerald-500' },
  { icon: Sparkles, title: 'Топовое качество видео', desc: 'Генерация на лучших AI-моделях 2026 года. Cinematic визуал, синхронные субтитры, динамичный монтаж уровня студии.', gradient: 'from-amber-500 to-orange-500' },
  { icon: Brain, title: 'Самообучение AI', desc: 'Бот анализирует результаты каждого видео и учится. Усиливает паттерны успеха, отсекает неработающие стратегии. Становится умнее с каждым днём.', gradient: 'from-pink-500 to-rose-500' },
  { icon: RefreshCw, title: 'A/B тестирование', desc: 'Генерирует несколько вариантов хуков и сценариев. Тестирует разные версии. Автоматически масштабирует лучший вариант.', gradient: 'from-teal-500 to-cyan-600' },
  { icon: Shield, title: 'Анти-бан защита', desc: 'Имитация человеческого поведения: рандомные задержки, лимиты постинга, уникализация метаданных. Твои аккаунты в безопасности.', gradient: 'from-red-500 to-orange-600' },
  { icon: Globe, title: 'TikTok + Shorts + Reels', desc: 'Одна идея — три платформы. Автоматическая адаптация формата и стиля под алгоритмы каждой площадки.', gradient: 'from-indigo-500 to-violet-500' },
  { icon: Gauge, title: 'Мощная аналитика', desc: 'Дашборд с метриками: просмотры, вовлечённость, рост подписчиков. Видишь что работает — в реальном времени.', gradient: 'from-sky-500 to-blue-600' },
  { icon: Wand2, title: 'Умные сценарии', desc: '5 вариантов хуков на каждую идею. AI выбирает лучший. Результат: видео, которые цепляют с первой секунды.', gradient: 'from-fuchsia-500 to-pink-600' },
]

/* ────────── advantages data ────────── */
const advantages = [
  { title: 'Другие инструменты', items: ['Нужно самому писать сценарии', 'Ручная публикация', 'Нет анализа результатов', 'Один аккаунт за раз', 'Риск бана при массовом постинге', 'Нет адаптации под тренды'], bad: true },
  { title: 'ZentroX AI', items: ['AI генерирует всё сам', 'Автопубликация 24/7', 'Самообучение на данных', 'Безлимит аккаунтов', 'Встроенная анти-бан система', 'Real-time тренды'], bad: false },
]

/* ────────── MAIN COMPONENT ────────── */
export function LandingPage() {
  const { data: session, status } = useSession() || {}
  const router = useRouter()

  useEffect(() => {
    if (status === 'authenticated') {
      router.replace('/dashboard')
    }
  }, [status, router])

  if (status === 'loading' || status === 'authenticated') {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* ═══════════════════ HEADER ═══════════════════ */}
      <header className="sticky top-0 z-50 border-b border-border/30 bg-background/60 backdrop-blur-2xl">
        <div className="mx-auto max-w-[1200px] flex items-center justify-between px-5 h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-purple-400/80 flex items-center justify-center shadow-md shadow-primary/15">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-lg font-bold tracking-tight">ZentroX</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
            <a href="#how-it-works" className="hover:text-foreground transition-colors">Как работает</a>
            <a href="#features" className="hover:text-foreground transition-colors">Возможности</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Тарифы</a>
          </nav>
          <div className="flex gap-3">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">Войти</Button>
            </Link>
            <Link href="/signup">
              <Button size="sm" className="shadow-md shadow-primary/15 rounded-lg">Начать бесплатно</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* ═══════════════════ 1. HERO ═══════════════════ */}
      <section className="relative overflow-hidden">
        {/* animated bg glows */}
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-10 left-[15%] w-[500px] h-[500px] bg-primary/8 rounded-full blur-[180px]" />
        <div className="absolute bottom-0 right-[10%] w-[600px] h-[600px] bg-purple-500/6 rounded-full blur-[200px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[700px] bg-gradient-to-br from-primary/4 to-transparent rounded-full blur-[150px]" />

        <div className="mx-auto max-w-[1200px] px-4 pt-20 pb-28 md:pt-32 md:pb-40 text-center relative">
          <FadeIn>
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
              <Flame className="w-4 h-4" />
              Автономная AI-фабрика вирусного контента
              <ChevronRight className="w-3 h-3" />
            </div>
          </FadeIn>

          <FadeIn delay={0.1}>
            <h1 className="font-display text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black tracking-tight mb-6 max-w-5xl mx-auto leading-[1.08]">
              Создаёт и выкладывает{' '}
              <span className="relative inline-block">
                <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">вирусные видео</span>
                <span className="absolute -bottom-1 left-0 right-0 h-1 bg-gradient-to-r from-primary via-purple-400 to-pink-400 rounded-full opacity-40" />
              </span>{' '}
              24/7 пока ты спишь
            </h1>
          </FadeIn>

          <FadeIn delay={0.2}>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
              ZentroX — AI-система, которая <strong className="text-foreground">анализирует тренды</strong>,{' '}
              <strong className="text-foreground">генерирует сценарии</strong>,{' '}
              <strong className="text-foreground">создаёт видео</strong> и{' '}
              <strong className="text-foreground">публикует</strong> их на TikTok, YouTube Shorts и Instagram Reels.{' '}
              Без участия человека. Полный автопилот.
            </p>
          </FadeIn>

          <FadeIn delay={0.3}>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/signup">
                <Button size="lg" className="gap-2 text-base px-10 h-13 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all rounded-xl font-semibold">
                  <Rocket className="w-5 h-5" />
                  Запустить бесплатно
                </Button>
              </Link>
              <Link href="#how-it-works">
                <Button variant="outline" size="lg" className="gap-2 text-base px-8 h-13 backdrop-blur-sm rounded-xl">
                  Как это работает
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </FadeIn>

          {/* Platform badges */}
          <FadeIn delay={0.4}>
            <div className="flex flex-wrap items-center justify-center gap-3 mt-12">
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-red-500/10 text-red-400 border border-red-500/20">
                <Play className="w-4 h-4 fill-current" />
                YouTube Shorts
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                <TikTokIcon className="w-4 h-4" />
                TikTok
              </span>
              <span className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium bg-pink-500/10 text-pink-400 border border-pink-500/20">
                <InstagramIcon className="w-4 h-4" />
                Instagram Reels
              </span>
            </div>
          </FadeIn>

          {/* Social proof numbers */}
          <FadeIn delay={0.5}>
            <div className="flex flex-wrap items-center justify-center gap-8 md:gap-14 mt-14 text-center">
              <div>
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">10,000+</div>
                <div className="text-xs text-muted-foreground mt-1">Видео создано</div>
              </div>
              <div className="w-px h-10 bg-border/50 hidden md:block" />
              <div>
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">24/7</div>
                <div className="text-xs text-muted-foreground mt-1">Работает автономно</div>
              </div>
              <div className="w-px h-10 bg-border/50 hidden md:block" />
              <div>
                <div className="font-display text-2xl md:text-3xl font-bold text-foreground">3</div>
                <div className="text-xs text-muted-foreground mt-1">Платформы</div>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ 2. HOW IT WORKS ═══════════════════ */}
      <section id="how-it-works" className="py-24 md:py-32 relative">
        <div className="mx-auto max-w-[1200px] px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <SectionBadge>Как это работает</SectionBadge>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">
                От тренда до публикации — <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">5 шагов</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Полностью автоматический конвейер. Ты настраиваешь один раз — AI делает всё остальное.</p>
            </div>
          </FadeIn>

          <Stagger className="grid md:grid-cols-5 gap-4" staggerDelay={0.1}>
            {[
              { step: '01', icon: TrendingUp, title: 'Анализ трендов', desc: 'AI мониторит топовые видео и находит паттерны, которые набирают просмотры', color: 'from-green-500 to-emerald-500' },
              { step: '02', icon: Wand2, title: 'Генерация сценариев', desc: '5 вариантов хуков → AI выбирает лучший → создаёт полный сценарий из 5 сцен', color: 'from-purple-500 to-pink-500' },
              { step: '03', icon: Video, title: 'Создание видео', desc: 'Cinematic визуал, субтитры, музыка, переходы — автоматически за минуты', color: 'from-blue-500 to-cyan-500' },
              { step: '04', icon: Rocket, title: 'Автопубликация', desc: 'Публикация на все платформы с оптимальным временем, хештегами и описанием', color: 'from-orange-500 to-red-500' },
              { step: '05', icon: Brain, title: 'Оптимизация', desc: 'AI анализирует метрики, учится и улучшает следующие видео автоматически', color: 'from-violet-500 to-purple-600' },
            ].map((item, i) => (
              <StaggerItem key={i}>
                <div className="relative group h-full">
                  <Card className="bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/30 transition-all duration-300 h-full group-hover:shadow-xl group-hover:shadow-primary/5">
                    <CardContent className="p-5 text-center">
                      <div className="text-[10px] font-mono text-muted-foreground/60 mb-3 tracking-widest">ШАГ {item.step}</div>
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mx-auto mb-4 shadow-lg`}>
                        <item.icon className="w-7 h-7 text-white" />
                      </div>
                      <h3 className="font-display text-sm font-semibold mb-2">{item.title}</h3>
                      <p className="text-muted-foreground text-xs leading-relaxed">{item.desc}</p>
                    </CardContent>
                  </Card>
                  {/* connector arrow */}
                  {i < 4 && (
                    <div className="hidden md:flex absolute -right-3 top-1/2 -translate-y-1/2 z-10">
                      <ChevronRight className="w-5 h-5 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══════════════════ 3. FEATURES (10 cards) ═══════════════════ */}
      <section id="features" className="py-24 md:py-32 bg-muted/20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="mx-auto max-w-[1200px] px-4 relative">
          <FadeIn>
            <div className="text-center mb-16">
              <SectionBadge>Возможности</SectionBadge>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">
                10 причин выбрать <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">ZentroX</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Каждая функция — это конкурентное преимущество. Все вместе — непобедимая система.</p>
            </div>
          </FadeIn>

          <Stagger className="grid md:grid-cols-2 lg:grid-cols-3 gap-5" staggerDelay={0.06}>
            {features.map((f, i) => (
              <StaggerItem key={i}>
                <Card className="bg-card/80 backdrop-blur-sm hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 h-full border-border/50 hover:border-primary/20 group">
                  <CardContent className="p-6">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-105 transition-transform`}>
                      <f.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-display text-base font-semibold mb-2">{f.title}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══════════════════ 4. COMPETITIVE ADVANTAGES ═══════════════════ */}
      <section className="py-24 md:py-32 relative">
        <div className="mx-auto max-w-[1200px] px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <SectionBadge>Сравнение</SectionBadge>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">
                Почему ZentroX <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">побеждает</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Честное сравнение с любым другим инструментом на рынке.</p>
            </div>
          </FadeIn>

          <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {advantages.map((col, ci) => (
              <FadeIn key={ci} delay={ci * 0.15}>
                <Card className={`h-full ${col.bad ? 'bg-card/40 border-border/40' : 'bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20 shadow-lg shadow-primary/5'}`}>
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-6">
                      {col.bad ? (
                        <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                          <MonitorSmartphone className="w-5 h-5 text-muted-foreground" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-400 flex items-center justify-center shadow-md">
                          <Zap className="w-5 h-5 text-white" />
                        </div>
                      )}
                      <h3 className={`font-display text-lg font-bold ${col.bad ? 'text-muted-foreground' : 'text-foreground'}`}>{col.title}</h3>
                    </div>
                    <div className="space-y-3">
                      {col.items.map((item, ii) => (
                        <div key={ii} className="flex items-start gap-3">
                          {col.bad ? (
                            <div className="w-5 h-5 rounded-full bg-destructive/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <span className="text-destructive text-xs">✕</span>
                            </div>
                          ) : (
                            <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                              <Check className="w-3 h-3 text-primary" />
                            </div>
                          )}
                          <span className={`text-sm ${col.bad ? 'text-muted-foreground line-through decoration-muted-foreground/30' : 'text-foreground'}`}>{item}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════ 5. RESULTS / OUTCOMES ═══════════════════ */}
      <section className="py-24 md:py-32 bg-muted/20 relative">
        <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
        <div className="mx-auto max-w-[1200px] px-4 relative">
          <FadeIn>
            <div className="text-center mb-16">
              <SectionBadge>Результаты</SectionBadge>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">
                Что получают наши <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">пользователи</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Цифры говорят громче слов. Вот что ZentroX делает для бизнеса.</p>
            </div>
          </FadeIn>

          <Stagger className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16" staggerDelay={0.1}>
            {[
              { value: 50, suffix: '+', label: 'Видео в день на автопилоте', icon: Video },
              { value: 3, suffix: '', label: 'Платформы одновременно', icon: Globe },
              { value: 10, suffix: 'x', label: 'Быстрее ручного постинга', icon: Clock },
              { value: 99, suffix: '%', label: 'Uptime — работает всегда', icon: Activity },
            ].map((s, i) => (
              <StaggerItem key={i}>
                <Card className="bg-card/60 backdrop-blur-sm border-border/50 hover:border-primary/20 transition-all">
                  <CardContent className="text-center p-6">
                    <s.icon className="w-7 h-7 text-primary mx-auto mb-4" />
                    <CountUp target={s.value} suffix={s.suffix} />
                    <p className="text-muted-foreground text-sm mt-2">{s.label}</p>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>

          {/* What you get list */}
          <div className="grid md:grid-cols-2 gap-12 items-start max-w-4xl mx-auto">
            <FadeIn>
              <h3 className="font-display text-xl font-bold mb-6">AI делает за тебя:</h3>
              <div className="space-y-4">
                {[
                  'Мониторинг трендов по всем платформам',
                  'Генерация сценариев с мощными хуками',
                  'Создание видео studio-качества',
                  'Оптимизация описаний и хештегов',
                  'Публикация в оптимальное время',
                  'Анализ метрик и самообучение',
                  'A/B тестирование вариантов контента',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
            <FadeIn delay={0.15}>
              <h3 className="font-display text-xl font-bold mb-6">Ты получаешь:</h3>
              <div className="space-y-4">
                {[
                  'Рост аудитории на автопилоте',
                  'Экономия 40+ часов в неделю',
                  'Контент, который набирает просмотры',
                  'Масштабирование без найма команды',
                  'Монетизация встроена в каждое видео',
                  'Полный контроль через дашборд',
                  'Анти-бан защита аккаунтов',
                ].map((item, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-green-500/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Star className="w-3.5 h-3.5 text-green-400" />
                    </div>
                    <span className="text-sm text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ═══════════════════ 6. PRICING ═══════════════════ */}
      <section id="pricing" className="py-24 md:py-32 relative">
        <div className="mx-auto max-w-[1200px] px-4">
          <FadeIn>
            <div className="text-center mb-16">
              <SectionBadge>Тарифы</SectionBadge>
              <h2 className="font-display text-3xl md:text-5xl font-bold tracking-tight mt-4 mb-4">
                Выбери свой <span className="bg-gradient-to-r from-primary to-purple-400 bg-clip-text text-transparent">масштаб</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto text-lg">Начни бесплатно. Масштабируй когда будешь готов.</p>
            </div>
          </FadeIn>

          <Stagger className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto" staggerDelay={0.1}>
            {pricingPlans.map((plan, i) => (
              <StaggerItem key={i}>
                <Card className={`relative h-full transition-all duration-300 ${plan.popular ? 'bg-gradient-to-b from-primary/5 via-card to-card border-primary/30 shadow-xl shadow-primary/10 scale-[1.02]' : 'bg-card/70 border-border/50 hover:border-primary/20 hover:shadow-lg'}`}>
                  {plan.popular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="inline-flex items-center gap-1 px-4 py-1 rounded-full bg-primary text-primary-foreground text-xs font-bold uppercase tracking-wider shadow-lg shadow-primary/25">
                        <Flame className="w-3 h-3" />
                        Популярный
                      </span>
                    </div>
                  )}
                  <CardContent className="p-6 pt-8">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${plan.color} flex items-center justify-center mb-4 shadow-lg`}>
                      <plan.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-display text-xl font-bold">{plan.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1 mb-4">{plan.desc}</p>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="font-display text-4xl font-black">{plan.price}</span>
                      <span className="text-muted-foreground text-sm">{plan.period}</span>
                    </div>

                    <Link href="/signup" className="block mb-6">
                      <Button className={`w-full rounded-xl h-11 font-semibold ${plan.popular ? 'shadow-md shadow-primary/20' : ''}`} variant={plan.popular ? 'default' : 'outline'}>
                        Начать сейчас
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    </Link>

                    <div className="space-y-3">
                      {plan.features.map((f, fi) => (
                        <div key={fi} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-primary/15 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Check className="w-3 h-3 text-primary" />
                          </div>
                          <span className="text-sm text-foreground/80">{f}</span>
                        </div>
                      ))}
                      {plan.missing.map((m, mi) => (
                        <div key={mi} className="flex items-start gap-2.5">
                          <div className="w-5 h-5 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Lock className="w-3 h-3 text-muted-foreground/50" />
                          </div>
                          <span className="text-sm text-muted-foreground/60">{m}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </StaggerItem>
            ))}
          </Stagger>
        </div>
      </section>

      {/* ═══════════════════ 7. FINAL CTA ═══════════════════ */}
      <section className="py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 hero-gradient" />
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/6 rounded-full blur-[200px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-purple-500/5 rounded-full blur-[180px]" />

        <div className="mx-auto max-w-[1200px] px-4 text-center relative">
          <FadeIn>
            <div className="max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-primary text-sm font-medium mb-8 backdrop-blur-sm">
                <Sparkles className="w-4 h-4" />
                Готов к запуску?
              </div>
              <h2 className="font-display text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-6 leading-[1.1]">
                Пока ты думаешь —{' '}
                <span className="bg-gradient-to-r from-primary via-purple-400 to-pink-400 bg-clip-text text-transparent">конкуренты уже постят</span>
              </h2>
              <p className="text-muted-foreground text-lg md:text-xl mb-10 max-w-2xl mx-auto leading-relaxed">
                Каждый день без ZentroX — это упущенные просмотры, подписчики и деньги. Настройка занимает 2 минуты. Первые видео — уже сегодня.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link href="/signup">
                  <Button size="lg" className="gap-2 text-base px-10 h-14 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/25 transition-all rounded-xl font-bold">
                    <Zap className="w-5 h-5" />
                    Запустить AI-фабрику
                  </Button>
                </Link>
              </div>
              <p className="text-xs text-muted-foreground/60 mt-6">
                Бесплатный старт · Не нужна карта · Результат за минуты
              </p>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ═══════════════════ FOOTER ═══════════════════ */}
      <footer className="border-t border-border/30 py-8 bg-card/30">
        <div className="mx-auto max-w-[1200px] px-5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary/70 to-purple-400/70 flex items-center justify-center">
              <Zap className="w-4 h-4 text-white" />
            </div>
            <span className="font-display font-semibold text-sm">ZentroX</span>
          </div>
          <div className="flex items-center gap-6">
            <a href="#features" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Возможности</a>
            <a href="#pricing" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Тарифы</a>
            <Link href="/login" className="text-xs text-muted-foreground hover:text-foreground transition-colors">Войти</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 ZentroX. Все права защищены.</p>
        </div>
      </footer>
    </div>
  )
}