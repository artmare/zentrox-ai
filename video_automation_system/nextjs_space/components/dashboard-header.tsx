'use client'

import { useSession } from 'next-auth/react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'

export function DashboardHeader() {
  const { data: session } = useSession() || {}
  const name = (session?.user as any)?.name ?? session?.user?.email ?? ''
  const initials = name ? name?.split?.(' ')?.map?.((n: string) => n?.[0])?.join?.('')?.toUpperCase?.() ?? 'U' : 'U'

  return (
    <div className="flex items-center justify-between w-full">
      <div />
      <div className="flex items-center gap-3">
        <span className="text-[13px] text-muted-foreground hidden sm:block">{session?.user?.email ?? ''}</span>
        <Avatar className="w-8 h-8">
          <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
            {initials}
          </AvatarFallback>
        </Avatar>
      </div>
    </div>
  )
}
