import { zodResolver } from '@hookform/resolvers/zod'
import { Loader2, Save, Upload } from 'lucide-react'
import { useRef, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  passwordPayloadSchema,
  profilePayloadSchema,
  type PasswordPayload,
  type ProfilePayload,
} from '@/shared/api/contracts'
import { cn } from '@/shared/lib/cn'
import { formatDate, initials } from '@/shared/lib/format'
import { Avatar, AvatarFallback, AvatarImage } from '@/shared/ui/avatar'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Separator } from '@/shared/ui/separator'
import { Textarea } from '@/shared/ui/textarea'
import { useCurrentUser } from '@/features/auth/hooks'
import {
  useChangePassword,
  useUpdateAvatar,
  useUpdateProfile,
} from '@/features/profile/hooks'


const AVATAR_PRESETS = [
  '/assets/avatars/avatar-01.svg',
  '/assets/avatars/avatar-02.svg',
  '/assets/avatars/avatar-03.svg',
  '/assets/avatars/avatar-04.svg',
]

export function ProfilePage() {
  const user = useCurrentUser()
  const updateProfile = useUpdateProfile()
  const updateAvatar = useUpdateAvatar()
  const changePassword = useChangePassword()
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadError, setUploadError] = useState<string | null>(null)

  const profileForm = useForm<ProfilePayload>({
    resolver: zodResolver(profilePayloadSchema),
    values: { name: user?.name ?? '', bio: user?.bio ?? '' },
  })

  const passwordForm = useForm<PasswordPayload>({
    resolver: zodResolver(passwordPayloadSchema),
    defaultValues: { currentPassword: '', newPassword: '', confirmPassword: '' },
  })

  if (!user) return null

  const onUpload = (file: File | undefined) => {
    setUploadError(null)
    if (!file) return
    if (!file.type.startsWith('image/')) {
      setUploadError('Selecione um arquivo de imagem.')
      return
    }
    if (file.size > 200 * 1024) {
      setUploadError('A imagem deve ter no máximo 200 KB.')
      return
    }
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') updateAvatar.mutate(reader.result)
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="container-page max-w-4xl py-10">
      <h1 className="font-display text-3xl font-semibold">Perfil do colecionador</h1>
      <p className="mt-2 text-sm text-text-muted">
        Atualize seus dados, avatar e senha. Tudo é persistido na API simulada.
      </p>

      <div className="mt-8 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Identidade</CardTitle>
            <CardDescription>Como você aparece no marketplace.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex flex-wrap items-center gap-5">
              <Avatar className="size-20 border border-border">
                {user.avatarUrl ? <AvatarImage src={user.avatarUrl} alt="" /> : null}
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>

              <div>
                <p className="text-sm font-medium">Avatar</p>
                <div className="mt-2 flex gap-2">
                  {AVATAR_PRESETS.map((preset, index) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => updateAvatar.mutate(preset)}
                      aria-label={`Usar avatar ${index + 1}`}
                      aria-pressed={user.avatarUrl === preset}
                      className={cn(
                        'size-12 overflow-hidden rounded-full border-2 transition-colors',
                        user.avatarUrl === preset
                          ? 'border-accent'
                          : 'border-border hover:border-border-strong',
                      )}
                    >
                      <img src={preset} alt="" width={48} height={48} className="size-full" />
                    </button>
                  ))}
                  <Button
                    type="button"
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                    aria-label="Enviar imagem do computador"
                    onClick={() => fileRef.current?.click()}
                  >
                    <Upload aria-hidden="true" />
                  </Button>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(event) => onUpload(event.target.files?.[0])}
                  />
                </div>
                {uploadError ? (
                  <p className="mt-2 text-xs text-danger">{uploadError}</p>
                ) : (
                  <p className="mt-2 text-xs text-text-muted">
                    PNG/JPG até 200 KB. A imagem é convertida em data URL no mock.
                  </p>
                )}
              </div>
            </div>

            <Separator />

            <form
              className="space-y-4"
              onSubmit={profileForm.handleSubmit((values) => updateProfile.mutate(values))}
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="profile-name">Nome</Label>
                  <Input
                    id="profile-name"
                    className="mt-1.5"
                    aria-invalid={Boolean(profileForm.formState.errors.name)}
                    aria-describedby={
                      profileForm.formState.errors.name ? 'profile-name-error' : undefined
                    }
                    {...profileForm.register('name')}
                  />
                  {profileForm.formState.errors.name ? (
                    <p id="profile-name-error" className="mt-1 text-xs text-danger">
                      {profileForm.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="profile-email">E-mail</Label>
                  <Input id="profile-email" value={user.email} readOnly disabled />
                  <p className="mt-1 text-xs text-text-muted">
                    O e-mail de login não pode ser alterado nesta demo.
                  </p>
                </div>
              </div>

              <div>
                <Label htmlFor="profile-bio">Bio</Label>
                <Textarea
                  id="profile-bio"
                  className="mt-1.5"
                  maxLength={160}
                  aria-describedby="profile-bio-help"
                  {...profileForm.register('bio')}
                />
                <p id="profile-bio-help" className="mt-1 text-xs text-text-muted">
                  Até 160 caracteres.
                </p>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-text-muted">
                  Membro desde {formatDate(user.createdAt)}
                </p>
                <Button type="submit" disabled={updateProfile.isPending}>
                  {updateProfile.isPending ? (
                    <Loader2 className="animate-spin" aria-hidden="true" />
                  ) : (
                    <Save aria-hidden="true" />
                  )}
                  Salvar alterações
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Segurança</CardTitle>
            <CardDescription>Altere sua senha de acesso.</CardDescription>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={passwordForm.handleSubmit((values) =>
                changePassword.mutate(values, {
                  onSuccess: () => passwordForm.reset(),
                }),
              )}
            >
              <div>
                <Label htmlFor="current-password">Senha atual</Label>
                <Input
                  id="current-password"
                  type="password"
                  autoComplete="current-password"
                  className="mt-1.5"
                  aria-invalid={Boolean(passwordForm.formState.errors.currentPassword)}
                  aria-describedby={
                    passwordForm.formState.errors.currentPassword
                      ? 'current-password-error'
                      : undefined
                  }
                  {...passwordForm.register('currentPassword')}
                />
                {passwordForm.formState.errors.currentPassword ? (
                  <p id="current-password-error" className="mt-1 text-xs text-danger">
                    {passwordForm.formState.errors.currentPassword.message}
                  </p>
                ) : null}
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="new-password">Nova senha</Label>
                  <Input
                    id="new-password"
                    type="password"
                    autoComplete="new-password"
                    className="mt-1.5"
                    aria-invalid={Boolean(passwordForm.formState.errors.newPassword)}
                    {...passwordForm.register('newPassword')}
                  />
                  {passwordForm.formState.errors.newPassword ? (
                    <p className="mt-1 text-xs text-danger">
                      {passwordForm.formState.errors.newPassword.message}
                    </p>
                  ) : null}
                </div>
                <div>
                  <Label htmlFor="confirm-new-password">Confirmar nova senha</Label>
                  <Input
                    id="confirm-new-password"
                    type="password"
                    autoComplete="new-password"
                    className="mt-1.5"
                    aria-invalid={Boolean(passwordForm.formState.errors.confirmPassword)}
                    {...passwordForm.register('confirmPassword')}
                  />
                  {passwordForm.formState.errors.confirmPassword ? (
                    <p className="mt-1 text-xs text-danger">
                      {passwordForm.formState.errors.confirmPassword.message}
                    </p>
                  ) : null}
                </div>
              </div>

              <Button type="submit" variant="secondary" disabled={changePassword.isPending}>
                Alterar senha
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
