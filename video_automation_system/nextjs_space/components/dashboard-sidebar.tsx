'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { signOut } from 'next-auth/react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  LayoutDashboard, FileText, BarChart3, Settings, LogOut, Zap, Bot,
  TrendingUp, Upload, Rocket, Film
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Панель управления', icon: LayoutDashboard },
  { href: '/scripts', label: 'Мои сценарии', icon: FileText },
  { href: '/videos', label: 'Мои видео', icon: Film },
  { href: '/trends', label: 'Тренды', icon: TrendingUp },
  { href: '/analytics', label: 'Аналитика', icon: BarChart3 },
  { href: '/posting', label: 'Автопостинг', icon: Upload },
  { href: '/growth', label: 'Рост и стратегия', icon: Rocket },
  { href: '/agent-settings', label: 'Настройки AI', icon: Bot },
]

export function DashboardSidebar() {
  const pathname = usePathname() ?? ''

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2.5 mb-10 px-1">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/80 to-purple-400/80 flex items-center justify-center shadow-md shadow-primary/20">
          <Zap className="w-5 h-5 text-white" />
        </div>
        <span className="font-display text-lg font-bold tracking-tight">ZentroX</span>
      </div>

      <nav className="flex-1 space-y-0.5">
        {(navItems ?? []).map((item: any) => {
          const isActive = pathname === item?.href || (item?.href !== '/dashboard' && pathname?.startsWith?.(item?.href ?? '__'))
          return (
            <Link key={item?.href} href={item?.href ?? '/dashboard'}>
              <div className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all duration-200',
                isActive
                  ? 'bg-primary/10 text-primary shadow-sm shadow-primary/5'
                  : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground'
              )}>
                <item.icon className={cn('w-[18px] h-[18px]', isActive && 'text-primary')} />
                {item?.label}
              </div>
            </Link>
          )
        })}
      </nav>

      <div className="pt-4 border-t border-border/40">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-muted-foreground hover:text-foreground text-[13px] rounded-xl"
          onClick={() => signOut?.({ callbackUrl: '/' })}
        >
          <LogOut className="w-[18px] h-[18px]" />
          Выйти
        </Button>
      </div>
    </div>
  )
}
