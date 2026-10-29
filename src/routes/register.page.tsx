import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { UserPlus } from 'lucide-react'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { getToken } from '@/shared/api/http'
import { useCurrentUser, useRegister } from '@/features/auth/hooks'
import { Alert } from '@/shared/ui/alert'
import { Button } from '@/shared/ui/button'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { registerRoute } from './register'


const registerSchema = z
  .object({
    name: z.string().trim().min(2, 'Informe seu nome completo'),
    email: z.email('E-mail inválido'),
    password: z.string().min(8, 'Mínimo de 8 caracteres'),
    confirmPassword: z.string().min(8, 'Confirme a senha'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ['confirmPassword'],
    message: 'As senhas não coincidem',
  })

type RegisterForm = z.infer<typeof registerSchema>


export function RegisterPage() {
  const { redirect } = registerRoute.useSearch()
  const user = useCurrentUser()
  const register = useRegister()
  const form = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '', confirmPassword: '' },
  })

  useEffect(() => {
    if (user && getToken()) window.location.assign(redirect ?? '/')
  }, [user, redirect])

  const onSubmit = form.handleSubmit((values) => {
    register.mutate(
      { name: values.name, email: values.email, password: values.password },
      {
        onSuccess: () => {
          window.location.assign(redirect ?? '/')
        },
      },
    )
  })

  const fieldError = (field: keyof RegisterForm) => form.formState.errors[field]?.message

  const conflict =
    register.isError &&
    'status' in register.error &&
    (register.error as { status: number }).status === 409

  return (
    <div className="container-page grid min-h-[calc(100dvh-4rem)] items-center gap-12 py-10 lg:grid-cols-[1.05fr_0.95fr]">
      <aside className="hidden flex-col gap-5 lg:flex">
        <p className="text-xs font-medium tracking-[0.18em] text-text-muted uppercase">
          Bem-vindo à Kurio
        </p>
        <h2 className="font-display text-4xl leading-[1.08] font-bold uppercase">
          Sua coleção começa aqui
        </h2>
        <p className="max-w-md text-sm leading-relaxed text-text-muted">
          Descubra NFTs selecionados de criadores emergentes e consagrados. Colecione arte
          digital e faça parte do novo futuro da cultura.
        </p>
        <img
          src="/assets/nfts/nft-06.svg"
          alt=""
          width={640}
          height={640}
          className="aspect-square w-full max-w-md rounded-[var(--radius-card)] border border-border object-cover"
        />
      </aside>

      <div className="w-full max-w-md justify-self-center">
        <div className="rounded-[var(--radius-card)] border border-border bg-surface p-6 shadow-[var(--shadow-pop)] sm:p-10">
          <div className="mb-6 flex gap-6 border-b border-border text-sm">
            <Link
              to="/login"
              search={{ redirect }}
              className="pb-3 text-text-muted transition-colors hover:text-text"
            >
              Entrar
            </Link>
            <span className="border-b-2 border-accent pb-3 font-medium text-text">Criar conta</span>
          </div>

          <h1 className="font-display text-2xl font-semibold">Criar conta</h1>
          <p className="mt-1 text-sm text-text-muted">
            Leva menos de um minuto. Você poderá favoritar, comprar e cadastrar carteiras.
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-4" noValidate>
        <div>
          <Label htmlFor="name">Nome</Label>
          <Input
            id="name"
            autoComplete="name"
            className="mt-1.5"
            aria-invalid={Boolean(fieldError('name'))}
            aria-describedby={fieldError('name') ? 'name-error' : undefined}
            {...form.register('name')}
          />
          {fieldError('name') ? (
            <p id="name-error" className="mt-1 text-xs text-danger">
              {fieldError('name')}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="register-email">E-mail</Label>
          <Input
            id="register-email"
            type="email"
            autoComplete="email"
            className="mt-1.5"
            aria-invalid={Boolean(fieldError('email')) || conflict}
            aria-describedby={fieldError('email') ? 'register-email-error' : undefined}
            {...form.register('email')}
          />
          {fieldError('email') ? (
            <p id="register-email-error" className="mt-1 text-xs text-danger">
              {fieldError('email')}
            </p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="register-password">Senha</Label>
          <Input
            id="register-password"
            type="password"
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={Boolean(fieldError('password'))}
            aria-describedby="register-password-help"
            {...form.register('password')}
          />
          <p id="register-password-help" className="mt-1 text-xs text-text-muted">
            Mínimo de 8 caracteres. A senha é armazenada com hash no mock.
          </p>
          {fieldError('password') ? (
            <p className="mt-1 text-xs text-danger">{fieldError('password')}</p>
          ) : null}
        </div>

        <div>
          <Label htmlFor="confirm-password">Confirmar senha</Label>
          <Input
            id="confirm-password"
            type="password"
            autoComplete="new-password"
            className="mt-1.5"
            aria-invalid={Boolean(fieldError('confirmPassword'))}
            aria-describedby={
              fieldError('confirmPassword') ? 'confirm-error' : undefined
            }
            {...form.register('confirmPassword')}
          />
          {fieldError('confirmPassword') ? (
            <p id="confirm-error" className="mt-1 text-xs text-danger">
              {fieldError('confirmPassword')}
            </p>
          ) : null}
        </div>

        {register.isError ? (
          <Alert tone="danger">
            {register.error instanceof Error ? register.error.message : 'Falha ao criar conta.'}
          </Alert>
        ) : null}

        <Button type="submit" className="w-full" disabled={register.isPending}>
          <UserPlus aria-hidden="true" />
          {register.isPending ? 'Criando conta…' : 'Criar conta'}
        </Button>
      </form>

      <p className="mt-6 text-sm text-text-muted">
        Já tem conta?{' '}
        <Link to="/login" search={{ redirect }} className="text-accent hover:underline">
          Entrar
        </Link>
      </p>
        </div>
      </div>
    </div>
  )
}
