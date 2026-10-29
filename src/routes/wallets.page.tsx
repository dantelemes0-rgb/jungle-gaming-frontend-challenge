import { zodResolver } from '@hookform/resolvers/zod'
import { Pencil, Plus, Star } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { Wallet, WalletPayload } from '@/shared/api/contracts'
import { walletPayloadSchema } from '@/shared/api/contracts'
import { cn } from '@/shared/lib/cn'
import { shortAddress } from '@/shared/lib/format'
import { Badge } from '@/shared/ui/badge'
import { Button } from '@/shared/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/shared/ui/dialog'
import { Input } from '@/shared/ui/input'
import { Label } from '@/shared/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select'
import { Skeleton } from '@/shared/ui/skeleton'
import { EmptyState } from '@/shared/components/states'
import { useCreateWallet, useUpdateWallet, useWallets } from '@/features/wallets/hooks'


export function WalletsPage() {
  const wallets = useWallets()
  const createWallet = useCreateWallet()
  const updateWallet = useUpdateWallet()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Wallet | null>(null)

  const form = useForm<WalletPayload>({
    resolver: zodResolver(walletPayloadSchema),
    defaultValues: { label: '', address: '', network: 'ethereum', isPrimary: false },
  })

  useEffect(() => {
    if (!dialogOpen) return
    if (editing) {
      form.reset({
        label: editing.label,
        address: editing.address,
        network: editing.network,
        isPrimary: editing.isPrimary,
      })
    } else {
      form.reset({ label: '', address: '', network: 'ethereum', isPrimary: false })
    }
  }, [dialogOpen, editing, form])

  const openCreate = () => {
    setEditing(null)
    setDialogOpen(true)
  }

  const openEdit = (wallet: Wallet) => {
    setEditing(wallet)
    setDialogOpen(true)
  }

  const submit = form.handleSubmit((values) => {
    if (editing) {
      updateWallet.mutate(
        { id: editing.id, ...values },
        { onSuccess: () => setDialogOpen(false) },
      )
    } else {
      createWallet.mutate(values, { onSuccess: () => setDialogOpen(false) })
    }
  })

  const fieldError = (field: keyof WalletPayload) => form.formState.errors[field]?.message

  return (
    <div className="container-page max-w-4xl py-10">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">Carteiras</h1>
          <p className="mt-2 text-sm text-text-muted">
            Cadastre a carteira principal e uma secundária. Usadas no checkout simulado.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus aria-hidden="true" />
          Nova carteira
        </Button>
      </div>

      <div className="mt-8 space-y-4">
        {wallets.isLoading ? (
          <>
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-32 w-full" />
          </>
        ) : wallets.data && wallets.data.length === 0 ? (
          <EmptyState
            title="Nenhuma carteira cadastrada"
            description="Cadastre uma carteira simulada para concluir o checkout."
            action={<Button onClick={openCreate}>Cadastrar carteira</Button>}
          />
        ) : (
          wallets.data?.map((wallet) => (
            <Card key={wallet.id}>
              <CardHeader>
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    {wallet.label}
                    {wallet.isPrimary ? (
                      <Badge variant="accent">
                        <Star className="size-3 fill-current" aria-hidden="true" />
                        Principal
                      </Badge>
                    ) : null}
                  </CardTitle>
                  <div className="flex gap-2">
                    {!wallet.isPrimary ? (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          updateWallet.mutate({ id: wallet.id, isPrimary: true })
                        }
                      >
                        Tornar principal
                      </Button>
                    ) : null}
                    <Button variant="secondary" size="sm" onClick={() => openEdit(wallet)}>
                      <Pencil aria-hidden="true" />
                      Editar
                    </Button>
                  </div>
                </div>
                <CardDescription className="font-mono text-xs">
                  {shortAddress(wallet.address, 6)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  <Badge variant="outline" className="capitalize">
                    {wallet.network}
                  </Badge>
                  <span className="text-text-muted">
                    {wallet.isPrimary ? 'Selecionada por padrão no checkout.' : 'Carteira secundária.'}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editing ? 'Editar carteira' : 'Nova carteira'}</DialogTitle>
            <DialogDescription>
              Dados fictícios. Nenhuma conexão real com blockchain é feita.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <Label htmlFor="wallet-label">Rótulo</Label>
              <Input
                id="wallet-label"
                className="mt-1.5"
                aria-invalid={Boolean(fieldError('label'))}
                {...form.register('label')}
              />
              {fieldError('label') ? (
                <p className="mt-1 text-xs text-danger">{fieldError('label')}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="wallet-address">Endereço</Label>
              <Input
                id="wallet-address"
                className="mt-1.5 font-mono text-xs"
                placeholder="0x…"
                aria-invalid={Boolean(fieldError('address'))}
                {...form.register('address')}
              />
              {fieldError('address') ? (
                <p className="mt-1 text-xs text-danger">{fieldError('address')}</p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="wallet-network">Rede</Label>
              <Select
                value={form.watch('network')}
                onValueChange={(value) =>
                  form.setValue('network', value as WalletPayload['network'])
                }
              >
                <SelectTrigger id="wallet-network" className="mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ethereum">Ethereum</SelectItem>
                  <SelectItem value="polygon">Polygon</SelectItem>
                  <SelectItem value="base">Base</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                className={cn('size-4 accent-[var(--color-accent)]')}
                {...form.register('isPrimary')}
              />
              Definir como carteira principal
            </label>

            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createWallet.isPending || updateWallet.isPending}
              >
                {editing ? 'Salvar' : 'Cadastrar'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}
