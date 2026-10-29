import { zodResolver } from '@hookform/resolvers/zod'
import { createRoute, Link } from '@tanstack/react-router'
import { LogIn } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { loginPayloadSchema, type LoginPayload } from '@/shared/api/contracts'
import { getToken } from '@/shared/api/http'
import { useCurrentUser, useLogin } from '@/features/auth/hooks'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { rootRoute } from './root'

const searchSchema = z.object({ redirect: z.string().optional().catch(undefined) })

export const loginRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/login',
  validateSearch: (search) => searchSchema.parse(search),
  component: LoginPage,
})

function LoginPage() {
  const { redirect } = loginRoute.useSearch()
  const user = useCurrentUser()
  const login = useLogin()
  const form = useForm<LoginPayload>({
    resolver: zodResolver(loginPayloadSchema),
    defaultValues: { email: '', password: '' },
  })

  useEffect(() => {
    if (user && getToken()) {
      window.location.assign(redirect ?? '/')
    }
  }, [user, redirect])

  const onSubmit = form.handleSubmit((values) => {
    login.mutate(values, {
      onSuccess: () => {
        window.location.assign(redirect ?? '/')
      },
    })
  })

  return (
    <div className="container-page max-w-md py-16">
      <h1 className="font-display text-3xl font-semibold">Entrar</h1>
      <p className="mt-2 text-sm text-text-muted">
        Acesse sua conta para favoritar, comprar e gerenciar carteiras.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-4" noValidate>
        <div>
          <Label htmlFor="email">E-mail</Label>
          <Input
            id="email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={Boolean(form.formState.errors.email)}
            aria-describedby={form.formState.errors.email ? 'email-error' : undefined}
            {...form.register('email')}
          />
          {form.formState.errors.email ? (
            <p id="email-error" className="mt-1 text-xs text-danger">
              {form.formState.errors.email.message}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="password">Senha</Label>
          <Input
            id="password"
            type="password"
            autoComplete="current-password"
            className="mt-1.5"
            aria-invalid={Boolean(form.formState.errors.password)}
            aria-describedby={form.formState.errors.password ? 'password-error' : undefined}
            {...form.register('password')}
          />
          {form.formState.errors.password ? (
            <p id="password-error" className="mt-1 text-xs text-danger">
              {form.formState.errors.password.message}
            </p>
          ) : null}
        </div>

        {login.isError ? (
          <Alert tone="danger">
            {login.error instanceof Error ? login.error.message : 'Falha ao entrar.'}
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={login.isPending}>
          <LogIn aria-hidden="true" />
          {login.isPending ? 'Entrando…' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-6 rounded-[var(--radius-control)] border border-border bg-surface p-4 text-sm">
        <p className="font-medium">Credenciais de demonstração</p>
        <p className="mt-1 text-text-muted">ana@jungle.test · jungle123</p>
        <p className="text-text-muted">bruno@jungle.test · jungle123</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              form.setValue('email', 'ana@jungle.test')
              form.setValue('password', 'jungle123')
            }}
          >
            Preencher Ana
          </Button>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => {
              form.setValue('email', 'bruno@jungle.test')
              form.setValue('password', 'jungle123')
            }}
          >
            Preencher Bruno
          </Button>
        </div>
      </div>

      <p className="mt-6 text-sm text-text-muted">
        Ainda não tem conta?{' '}
        <Link
          to="/register"
          search={{ redirect }}
          className="text-accent hover:underline"
        >
          Criar conta
        </Link>
      </p>
    </div>
  )
}
