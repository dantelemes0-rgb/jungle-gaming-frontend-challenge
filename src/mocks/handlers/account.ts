import { http, HttpResponse } from 'msw'
import { loginPayloadSchema, registerPayloadSchema, type Session } from '@/shared/api/contracts'
import {
  createSession,
  nowIso,
  saveDb,
  sessionUser,
  verifyPassword,
  getDb,
  newId,
} from '../db/store'
import { hashPassword } from '../db/seed'
import { scenarioFromRequest } from '../scenarios'
import {
  apiError,
  bootstrap,
  parseBody,
  readUser,
  simulateLatency,
  unauthorized,
  validationError,
} from './helpers'

export const authHandlers = [
  http.post('/api/auth/register', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const parsed = await parseBody(request, registerPayloadSchema)
    if ('response' in parsed) return parsed.response

    const db = getDb()
    const { name, email, password } = parsed.data
    const normalized = email.toLowerCase()

    if (scenarioFromRequest(request) === 'register-conflict') {
      return apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está em uso.')
    }
    if (db.users.some((user) => user.email.toLowerCase() === normalized)) {
      return apiError(409, 'EMAIL_TAKEN', 'Este e-mail já está em uso.')
    }

    const salt = newId('salt')
    const user = {
      id: newId('usr'),
      name,
      email: normalized,
      createdAt: nowIso(),
      avatarUrl: '/assets/avatars/avatar-03.svg',
      salt,
      passwordHash: await hashPassword(password, salt),
    }

    db.users.push(user)
    db.favorites[user.id] = []
    saveDb()

    const session = createSession(user.id)
    const response: Session = {
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      expiresAt: session.expiresAt,
    }
    return HttpResponse.json(response, { status: 201 })
  }),

  http.post('/api/auth/login', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const parsed = await parseBody(request, loginPayloadSchema)
    if ('response' in parsed) return parsed.response

    const db = getDb()
    const user = db.users.find(
      (candidate) => candidate.email.toLowerCase() === parsed.data.email.toLowerCase(),
    )
    if (!user || !(await verifyPassword(user, parsed.data.password))) {
      return apiError(401, 'INVALID_CREDENTIALS', 'E-mail ou senha incorretos.')
    }

    const session = createSession(user.id)
    const response: Session = {
      token: session.token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      expiresAt: session.expiresAt,
    }
    return HttpResponse.json(response)
  }),

  http.get('/api/auth/session', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const db = getDb()
    const header = request.headers.get('Authorization')
    const token = header?.slice(7) ?? ''
    const session = db.sessions.find((item) => item.token === token)

    return HttpResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        bio: user.bio,
        avatarUrl: user.avatarUrl,
        createdAt: user.createdAt,
      },
      expiresAt: session?.expiresAt ?? nowIso(),
    })
  }),

  http.post('/api/auth/logout', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const header = request.headers.get('Authorization')
    const token = header?.slice(7)
    if (token) {
      const db = getDb()
      db.sessions = db.sessions.filter((item) => item.token !== token)
      saveDb()
    }
    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/me', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()
    return HttpResponse.json({
      id: user.id,
      name: user.name,
      email: user.email,
      bio: user.bio,
      avatarUrl: user.avatarUrl,
      createdAt: user.createdAt,
    })
  }),

  http.patch('/api/me', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const body = (await request.json().catch(() => null)) as {
      name?: string
      bio?: string
    } | null
    if (!body) return apiError(400, 'BAD_REQUEST', 'Corpo inválido.')

    if (body.name !== undefined && body.name.trim().length < 2) {
      return validationError({
        issues: [{ path: ['name'], message: 'Informe pelo menos 2 caracteres.' }],
      })
    }
    if (body.bio !== undefined && body.bio.length > 160) {
      return validationError({
        issues: [{ path: ['bio'], message: 'Máximo de 160 caracteres.' }],
      })
    }

    const db = getDb()
    const stored = db.users.find((candidate) => candidate.id === user.id)
    if (!stored) return unauthorized()
    if (body.name !== undefined) stored.name = body.name.trim()
    if (body.bio !== undefined) stored.bio = body.bio
    saveDb()

    return HttpResponse.json({
      id: stored.id,
      name: stored.name,
      email: stored.email,
      bio: stored.bio,
      avatarUrl: stored.avatarUrl,
      createdAt: stored.createdAt,
    })
  }),

  http.put('/api/me/avatar', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const body = (await request.json().catch(() => null)) as { avatarUrl?: string } | null
    if (!body?.avatarUrl) {
      return validationError({
        issues: [{ path: ['avatarUrl'], message: 'Selecione uma imagem.' }],
      })
    }
    const stored = getDb().users.find((candidate) => candidate.id === user.id)
    if (!stored) return unauthorized()
    stored.avatarUrl = body.avatarUrl
    saveDb()

    return HttpResponse.json({
      id: stored.id,
      name: stored.name,
      email: stored.email,
      bio: stored.bio,
      avatarUrl: stored.avatarUrl,
      createdAt: stored.createdAt,
    })
  }),

  http.put('/api/me/password', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const body = (await request.json().catch(() => null)) as {
      currentPassword?: string
      newPassword?: string
    } | null
    if (!body?.currentPassword || !body.newPassword) {
      return validationError({
        issues: [{ path: ['currentPassword'], message: 'Informe a senha atual.' }],
      })
    }
    if (!(await verifyPassword(user, body.currentPassword))) {
      return validationError({
        issues: [{ path: ['currentPassword'], message: 'Senha atual incorreta.' }],
      })
    }
    if (body.newPassword.length < 8) {
      return validationError({
        issues: [{ path: ['newPassword'], message: 'Mínimo de 8 caracteres.' }],
      })
    }

    const stored = getDb().users.find((candidate) => candidate.id === user.id)
    if (!stored) return unauthorized()
    stored.passwordHash = await hashPassword(body.newPassword, stored.salt)
    saveDb()

    return new HttpResponse(null, { status: 204 })
  }),

  http.get('/api/wallets', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()
    const items = getDb()
      .wallets.filter((wallet) => wallet.userId === user.id)
      .map(({ userId: _userId, ...wallet }) => wallet)
    return HttpResponse.json({ items })
  }),

  http.post('/api/wallets', async ({ request }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const body = (await request.json().catch(() => null)) as {
      label?: string
      address?: string
      network?: 'ethereum' | 'polygon' | 'base'
      isPrimary?: boolean
    } | null
    if (!body?.label || !body.address || !body.network) {
      return validationError({
        issues: [{ path: ['address'], message: 'Preencha todos os campos.' }],
      })
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return validationError({
        issues: [{ path: ['address'], message: 'Endereço inválido.' }],
      })
    }

    const db = getDb()
    if (db.wallets.some((wallet) => wallet.address.toLowerCase() === body.address?.toLowerCase())) {
      return apiError(409, 'DUPLICATE_WALLET', 'Esta carteira já está cadastrada.')
    }

    const wallet = {
      id: newId('wlt'),
      userId: user.id,
      label: body.label,
      address: body.address,
      network: body.network,
      isPrimary: Boolean(body.isPrimary),
    }
    if (wallet.isPrimary) {
      db.wallets.forEach((item) => {
        if (item.userId === user.id) item.isPrimary = false
      })
    }
    db.wallets.push(wallet)
    saveDb()

    const { userId: _userId, ...publicWallet } = wallet
    return HttpResponse.json(publicWallet, { status: 201 })
  }),

  http.patch('/api/wallets/:id', async ({ request, params }) => {
    await bootstrap()
    await simulateLatency(request)
    const user = readUser(request)
    if (!user) return unauthorized()

    const db = getDb()
    const wallet = db.wallets.find(
      (item) => item.id === params.id && item.userId === user.id,
    )
    if (!wallet) return apiError(404, 'WALLET_NOT_FOUND', 'Carteira não encontrada.')

    const body = (await request.json().catch(() => null)) as {
      label?: string
      address?: string
      network?: 'ethereum' | 'polygon' | 'base'
      isPrimary?: boolean
    } | null
    if (!body) return apiError(400, 'BAD_REQUEST', 'Corpo inválido.')

    if (body.address && !/^0x[a-fA-F0-9]{40}$/.test(body.address)) {
      return validationError({
        issues: [{ path: ['address'], message: 'Endereço inválido.' }],
      })
    }
    if (body.address) wallet.address = body.address
    if (body.label) wallet.label = body.label
    if (body.network) wallet.network = body.network
    if (body.isPrimary) {
      db.wallets.forEach((item) => {
        if (item.userId === user.id) item.isPrimary = item.id === wallet.id
      })
    }
    saveDb()

    const { userId: _userId, ...publicWallet } = wallet
    return HttpResponse.json(publicWallet)
  }),

  http.get('/api/debug/session', async ({ request }) => {
    await bootstrap()
    const user = sessionUser(request)
    return HttpResponse.json({ authenticated: Boolean(user), userId: user?.id ?? null })
  }),
]
