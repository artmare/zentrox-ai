import { cn } from '@/lib/utils'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap } from 'lucide-react'
import Link from 'next/link'

export function AuthLayout({
  title,
  description,
  children,
  className,
}: {
  title: string
  description?: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div className="min-h-screen flex items-center justify-center p-4 hero-gradient relative">
      {/* Soft ambient glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="relative w-full max-w-[420px]">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/80 to-purple-400/80 flex items-center justify-center shadow-lg shadow-primary/20">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="font-display text-xl font-bold tracking-tight">ZentroX</span>
        </Link>

        <Card className={cn('border-border/40 shadow-2xl shadow-black/20 bg-card/80 backdrop-blur-sm', className)}>
          <CardHeader className="text-center pb-2 pt-7 px-7">
            <CardTitle className="font-display text-xl tracking-tight">{title}</CardTitle>
            {description && (
              <CardDescription className="text-sm text-muted-foreground mt-1.5">{description}</CardDescription>
            )}
          </CardHeader>
          <CardContent className="px-7 pb-7">
            {children}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
