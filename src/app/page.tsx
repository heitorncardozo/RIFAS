import { ToastProvider } from '@/components/ui/Toast'
import SaleForm from './SaleForm'
import { VALOR_RIFA } from '@/lib/types'

export default function Home() {
  return (
    <ToastProvider>
      <div className="min-h-screen flex flex-col">
        {/* Hero Header */}
        <header className="relative overflow-hidden bg-gradient-animated text-white">
          {/* Decorative shapes */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
            <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full bg-white/5 float" />
            <div className="absolute -bottom-10 -left-10 w-60 h-60 rounded-full bg-white/5 float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-1/2 left-1/3 w-40 h-40 rounded-full bg-white/5 float" style={{ animationDelay: '4s' }} />
          </div>

          <div className="relative max-w-4xl mx-auto px-6 py-16 md:py-24 text-center">
            <div className="inline-flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm font-medium mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400"></span>
              </span>
              Vendas abertas
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight mb-4">
              🎟️ Rifa<span className="text-accent-light">VIP</span>
            </h1>
            <p className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto mb-2">
              Participe do nosso sorteio! Cada rifa custa apenas{' '}
              <span className="font-bold text-white">
                R$ {VALOR_RIFA.toFixed(2).replace('.', ',')}
              </span>
            </p>
            <p className="text-sm text-white/60">
              Selecione seu número, faça o pagamento e envie o comprovante abaixo
            </p>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 -mt-8 relative z-10">
          <div className="max-w-xl mx-auto px-6 pb-16">
            <div className="bg-card-bg border border-card-border rounded-3xl shadow-2xl p-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg">
                  🛒
                </div>
                <div>
                  <h2 className="text-lg font-bold text-foreground">Registrar Venda</h2>
                  <p className="text-xs text-muted">Preencha os dados abaixo</p>
                </div>
              </div>
              <SaleForm />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="border-t border-card-border py-6 text-center">
          <p className="text-sm text-muted">
            RifaVIP © {new Date().getFullYear()} • Sistema de Gerenciamento de Rifas
          </p>
          <a
            href="/admin/login"
            className="text-xs text-muted/50 hover:text-primary transition-colors mt-1 inline-block"
          >
            Área administrativa
          </a>
        </footer>
      </div>
    </ToastProvider>
  )
}
