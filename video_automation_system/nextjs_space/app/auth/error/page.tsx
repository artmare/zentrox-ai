'use client'

import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { AuthLayout } from '@/components/layouts/auth-layout'
import { Button } from '@/components/ui/button'
import { AlertTriangle, ArrowLeft, RefreshCw } from 'lucide-react'
import { Suspense } from 'react'

function AuthErrorContent() {
  const searchParams = useSearchParams()
  const error = searchParams?.get('error') ?? 'Unknown'

  const errorMessages: Record<string, { title: string; desc: string }> = {
    Configuration: {
      title: 'Ошибка конфигурации',
      desc: 'Google SSO ещё не настроен. Администратору необходимо добавить Google Client ID и Client Secret.',
    },
    AccessDenied: {
      title: 'Доступ запрещён',
      desc: 'Вы отказали в доступе к аккаунту Google или не имеете прав на вход.',
    },
    OAuthSignin: {
      title: 'Ошибка входа',
      desc: 'Не удалось инициировать вход через Google. Проверьте настройки OAuth.',
    },
    OAuthCallback: {
      title: 'Ошибка обратного вызова',
      desc: 'Ошибка при обработке ответа от Google. Попробуйте ещё раз.',
    },
    OAuthAccountNotLinked: {
      title: 'Аккаунт не привязан',
      desc: 'Этот email уже зарегистрирован другим способом. Войдите через email и пароль.',
    },
    Default: {
      title: 'Ошибка авторизации',
      desc: 'Произошла непредвиденная ошибка. Попробуйте ещё раз позже.',
    },
  }

  const { title, desc } = errorMessages[error] ?? errorMessages['Default']

  return (
    <AuthLayout title={title} description={desc}>
      <div className="flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertTriangle className="w-8 h-8 text-destructive" />
        </div>
        <p className="text-sm text-muted-foreground text-center">
          Код ошибки: <code className="text-xs bg-muted px-2 py-1 rounded">{error}</code>
        </p>
        <div className="flex gap-3 w-full">
          <Link href="/login" className="flex-1">
            <Button variant="outline" className="w-full gap-2">
              <ArrowLeft className="w-4 h-4" />
              Назад
            </Button>
          </Link>
          <Link href="/login" className="flex-1">
            <Button className="w-full gap-2">
              <RefreshCw className="w-4 h-4" />
              Попробовать снова
            </Button>
          </Link>
        </div>
      </div>
    </AuthLayout>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Загрузка...</div>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  )
}
