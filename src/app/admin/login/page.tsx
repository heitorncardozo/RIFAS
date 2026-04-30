'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Button from '@/components/ui/Button'
import { createClient } from '@/lib/supabase/client'

export default function AdminLogin() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const supabase = createClient()
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      setError('Email ou senha incorretos.')
      setLoading(false)
      return
    }

    router.push('/admin')
    router.refresh()
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-animated p-6">
      <div className="w-full max-w-md animate-scale-in">
        <div className="bg-card-bg border border-card-border rounded-3xl shadow-2xl p-8">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl mb-4">
              🔐
            </div>
            <h1 className="text-2xl font-extrabold text-foreground">
              Rifa<span className="text-primary">VIP</span> Admin
            </h1>
            <p className="text-sm text-muted mt-1">
              Acesse o painel administrativo
            </p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-danger/10 border border-danger/20 text-danger rounded-xl px-4 py-3 text-sm font-medium mb-6 animate-fade-in">
              ⚠ {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleLogin} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-foreground mb-2">
                ✉️ Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@exemplo.com"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-surface border border-card-border text-foreground placeholder:text-muted/50 transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-foreground mb-2">
                🔑 Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="w-full px-4 py-3.5 rounded-xl bg-surface border border-card-border text-foreground placeholder:text-muted/50 transition-colors"
              />
            </div>

            <Button
              type="submit"
              size="lg"
              loading={loading}
              className="w-full"
            >
              Entrar
            </Button>
          </form>

          <div className="mt-6 text-center">
            <a
              href="/"
              className="text-sm text-muted hover:text-primary transition-colors"
            >
              ← Voltar ao site
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
