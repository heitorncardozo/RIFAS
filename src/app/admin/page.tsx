'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import { ToastProvider, useToast } from '@/components/ui/Toast'
import { getDashboardData, adicionarAluno, removerAluno, cancelarVenda, adminLogout, atribuirRifas } from './actions'
import { VALOR_RIFA } from '@/lib/types'
import type { Aluno, Venda } from '@/lib/types'

function DashboardContent() {
  const router = useRouter()
  const { showToast } = useToast()

  const [stats, setStats] = useState({ vendidas: 0, total: 0, disponiveis: 0, arrecadado: 0 })
  const [vendas, setVendas] = useState<Venda[]>([])
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'vendas' | 'alunos'>('vendas')

  // Modals
  const [showImageModal, setShowImageModal] = useState(false)
  const [selectedImage, setSelectedImage] = useState('')
  const [showAddAluno, setShowAddAluno] = useState(false)
  const [novoNome, setNovoNome] = useState('')
  const [novoTurma, setNovoTurma] = useState('')
  const [addingAluno, setAddingAluno] = useState(false)

  const [showAtribuirModal, setShowAtribuirModal] = useState(false)
  const [atribuirAlunoId, setAtribuirAlunoId] = useState('')
  const [atribuirInicio, setAtribuirInicio] = useState('')
  const [atribuirFim, setAtribuirFim] = useState('')
  const [atribuindo, setAtribuindo] = useState(false)

  // Filters
  const [filterAluno, setFilterAluno] = useState('')
  const [filterSearch, setFilterSearch] = useState('')
  const [filterTurmaAluno, setFilterTurmaAluno] = useState('')

  const loadData = useCallback(async () => {
    setLoading(true)
    const data = await getDashboardData()
    setStats(data.stats)
    setVendas(data.vendas as Venda[])
    setAlunos(data.alunos as Aluno[])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleLogout = async () => {
    await adminLogout()
    router.push('/admin/login')
    router.refresh()
  }

  const handleAddAluno = async () => {
    setAddingAluno(true)
    const formData = new FormData()
    formData.append('nome', novoNome)
    formData.append('turma', novoTurma)
    const result = await adicionarAluno(formData)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Aluno adicionado com sucesso!', 'success')
      setNovoNome('')
      setNovoTurma('')
      setShowAddAluno(false)
      await loadData()
    }
    setAddingAluno(false)
  }

  const handleRemoveAluno = async (id: string) => {
    const result = await removerAluno(id)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Aluno removido.', 'success')
      await loadData()
    }
  }

  const handleAtribuirRifas = async () => {
    setAtribuindo(true)
    const formData = new FormData()
    formData.append('aluno_id', atribuirAlunoId)
    formData.append('inicio', atribuirInicio)
    formData.append('fim', atribuirFim)
    
    const result = await atribuirRifas(formData)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Rifas atribuídas ao aluno com sucesso!', 'success')
      setAtribuirInicio('')
      setAtribuirFim('')
      setShowAtribuirModal(false)
      await loadData()
    }
    setAtribuindo(false)
  }

  const handleCancelVenda = async (vendaId: string, rifaId: string) => {
    const result = await cancelarVenda(vendaId, rifaId)
    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast('Venda cancelada e rifa liberada.', 'success')
      await loadData()
    }
  }

  // Filtered vendas
  const filteredVendas = vendas.filter((v) => {
    if (filterAluno && v.alunos?.id !== filterAluno) return false
    if (filterSearch) {
      const search = filterSearch.toLowerCase()
      const matchNome = v.alunos?.nome?.toLowerCase().includes(search)
      const matchNumero = v.rifas?.numero?.toString().includes(search)
      if (!matchNome && !matchNumero) return false
    }
    return true
  })

  const progressPercent = stats.total > 0 ? (stats.vendidas / stats.total) * 100 : 0

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center text-3xl glow">
            🎟️
          </div>
          <p className="text-muted animate-pulse">Carregando dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-card-bg/80 backdrop-blur-lg border-b border-card-border">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl">🎟️</span>
            <h1 className="text-xl font-extrabold text-foreground">
              Rifa<span className="text-primary">VIP</span>
              <span className="text-sm font-normal text-muted ml-2">Admin</span>
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <a href="/" className="text-sm text-muted hover:text-primary transition-colors">
              Ver site →
            </a>
            <Button variant="ghost" size="sm" onClick={handleLogout}>
              Sair
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 animate-fade-in">
          <Card
            title="Rifas Vendidas"
            value={stats.vendidas}
            subtitle={`de ${stats.total} rifas`}
            icon={<span>🎯</span>}
            gradient="bg-gradient-to-br from-primary to-primary-dark"
          />
          <Card
            title="Disponíveis"
            value={stats.disponiveis}
            subtitle="para venda"
            icon={<span>📦</span>}
            gradient="bg-gradient-to-br from-accent to-cyan-700"
          />
          <Card
            title="Arrecadado"
            value={`R$ ${stats.arrecadado.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
            subtitle={`× R$ ${VALOR_RIFA.toFixed(2).replace('.', ',')} cada`}
            icon={<span>💰</span>}
            gradient="bg-gradient-to-br from-success to-emerald-700"
          />
          <Card
            title="Progresso"
            value={`${progressPercent.toFixed(1)}%`}
            subtitle="do total vendido"
            icon={<span>📊</span>}
            gradient="bg-gradient-to-br from-warning to-amber-700"
          />
        </div>

        {/* Progress bar */}
        <div className="bg-card-bg border border-card-border rounded-2xl p-5">
          <div className="flex justify-between text-sm mb-3">
            <span className="font-semibold text-foreground">Progresso Geral</span>
            <span className="text-muted">{stats.vendidas} / {stats.total}</span>
          </div>
          <div className="h-4 rounded-full bg-surface overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-primary via-accent to-success transition-all duration-1000"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 animate-slide-up" style={{ animationDelay: '0.1s' }}>
          <button
            onClick={() => setActiveTab('vendas')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === 'vendas'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-surface text-muted hover:text-foreground'
            }`}
          >
            📋 Vendas ({vendas.length})
          </button>
          <button
            onClick={() => setActiveTab('alunos')}
            className={`px-5 py-2.5 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
              activeTab === 'alunos'
                ? 'bg-primary text-white shadow-lg shadow-primary/25'
                : 'bg-surface text-muted hover:text-foreground'
            }`}
          >
            👥 Alunos ({alunos.length})
          </button>
        </div>

        {/* Vendas Tab */}
        {activeTab === 'vendas' && (
          <div className="space-y-4 animate-fade-in">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="🔍 Buscar por nome ou número..."
                value={filterSearch}
                onChange={(e) => setFilterSearch(e.target.value)}
                className="flex-1 px-4 py-3 rounded-xl bg-surface border border-card-border text-foreground placeholder:text-muted/50 transition-colors"
              />
              <select
                value={filterAluno}
                onChange={(e) => setFilterAluno(e.target.value)}
                className="px-4 py-3 rounded-xl bg-surface border border-card-border text-foreground transition-colors appearance-none cursor-pointer min-w-[200px]"
              >
                <option value="">Todos os alunos</option>
                {alunos.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Sales Table */}
            <div className="bg-card-bg border border-card-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-card-border bg-surface/50">
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Nº Rifa
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Aluno
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Turma
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Data
                      </th>
                      <th className="text-left px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Comprovante
                      </th>
                      <th className="text-right px-5 py-3.5 text-xs font-semibold text-muted uppercase tracking-wider">
                        Ações
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredVendas.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="px-5 py-12 text-center text-muted">
                          <div className="text-4xl mb-2">📭</div>
                          <p>Nenhuma venda encontrada</p>
                        </td>
                      </tr>
                    ) : (
                      filteredVendas.map((v, i) => (
                        <tr
                          key={v.id}
                          className="border-b border-card-border/50 hover:bg-surface/30 transition-colors"
                          style={{ animationDelay: `${i * 0.03}s` }}
                        >
                          <td className="px-5 py-4">
                            <span className="inline-flex items-center justify-center w-12 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                              {String(v.rifas?.numero || '').padStart(3, '0')}
                            </span>
                          </td>
                          <td className="px-5 py-4 font-medium text-foreground">
                            {v.alunos?.nome || '—'}
                          </td>
                          <td className="px-5 py-4 text-muted text-sm">
                            {v.alunos?.turma || '—'}
                          </td>
                          <td className="px-5 py-4 text-muted text-sm">
                            {new Date(v.created_at).toLocaleDateString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </td>
                          <td className="px-5 py-4">
                            <button
                              onClick={() => {
                                setSelectedImage(v.comprovante_url)
                                setShowImageModal(true)
                              }}
                              className="text-primary hover:text-primary-dark text-sm font-medium transition-colors cursor-pointer"
                            >
                              📷 Ver
                            </button>
                          </td>
                          <td className="px-5 py-4 text-right">
                            <button
                              onClick={() => handleCancelVenda(v.id, v.rifa_id)}
                              className="text-danger hover:text-red-400 text-sm font-medium transition-colors cursor-pointer"
                            >
                              Cancelar
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Alunos Tab */}
        {activeTab === 'alunos' && (
          <div className="space-y-4 animate-fade-in">
            <div className="flex justify-between items-center flex-wrap gap-4">
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setFilterTurmaAluno('')}
                  className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                    !filterTurmaAluno
                      ? 'bg-primary text-white shadow-md shadow-primary/20'
                      : 'bg-surface text-muted hover:text-foreground border border-card-border'
                  }`}
                >
                  Todas
                </button>
                {Array.from(new Set(alunos.map(a => a.turma))).sort().map(t => (
                  <button
                    key={t}
                    onClick={() => setFilterTurmaAluno(t)}
                    className={`px-4 py-1.5 rounded-xl text-sm font-semibold transition-all ${
                      filterTurmaAluno === t
                        ? 'bg-primary text-white shadow-md shadow-primary/20'
                        : 'bg-surface text-muted hover:text-foreground border border-card-border'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
              <Button size="sm" onClick={() => setShowAddAluno(true)}>
                ＋ Adicionar Aluno
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {alunos
                .filter(a => !filterTurmaAluno || a.turma === filterTurmaAluno)
                .map((a) => (
                <div
                  key={a.id}
                  className="bg-card-bg border border-card-border rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-all group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg font-bold text-primary">
                      {a.nome.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{a.nome}</p>
                      <p className="text-xs text-muted">{a.turma}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="text-right mr-2 hidden sm:block">
                      <p className="font-semibold text-foreground text-xs">{(a as any).rifas?.length || 0}</p>
                      <p className="text-[10px] text-muted">rifas</p>
                    </div>
                    <button
                      onClick={() => {
                        setAtribuirAlunoId(a.id)
                        setShowAtribuirModal(true)
                      }}
                      className="px-3 py-1.5 bg-surface hover:bg-primary/10 text-primary hover:text-primary-dark text-xs rounded-lg font-semibold transition-colors cursor-pointer border border-card-border flex-shrink-0"
                    >
                      🎟 Distribuir
                    </button>
                    <button
                      onClick={() => handleRemoveAluno(a.id)}
                      className="opacity-0 group-hover:opacity-100 text-danger hover:text-red-400 text-sm transition-all cursor-pointer flex-shrink-0"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              ))}

              {alunos.filter(a => !filterTurmaAluno || a.turma === filterTurmaAluno).length === 0 && (
                <div className="col-span-full text-center py-12 text-muted">
                  <div className="text-4xl mb-2">👥</div>
                  <p>Nenhum aluno encontrado nesta turma.</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Image Modal */}
      <Modal
        isOpen={showImageModal}
        onClose={() => setShowImageModal(false)}
        title="Comprovante de Pagamento"
        maxWidth="max-w-2xl"
      >
        {selectedImage && (
          <img
            src={selectedImage}
            alt="Comprovante"
            className="w-full rounded-xl"
          />
        )}
      </Modal>

      {/* Add Aluno Modal */}
      <Modal
        isOpen={showAddAluno}
        onClose={() => setShowAddAluno(false)}
        title="Adicionar Aluno"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Nome completo
            </label>
            <input
              type="text"
              value={novoNome}
              onChange={(e) => setNovoNome(e.target.value)}
              placeholder="Ex: João Silva"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-card-border text-foreground placeholder:text-muted/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Turma
            </label>
            <input
              type="text"
              value={novoTurma}
              onChange={(e) => setNovoTurma(e.target.value)}
              placeholder="Ex: 3º A"
              className="w-full px-4 py-3 rounded-xl bg-surface border border-card-border text-foreground placeholder:text-muted/50 transition-colors"
            />
          </div>
          <Button
            loading={addingAluno}
            onClick={handleAddAluno}
            className="w-full"
          >
            Adicionar
          </Button>
        </div>
      </Modal>

      {/* Atribuir Rifas Modal */}
      <Modal
        isOpen={showAtribuirModal}
        onClose={() => setShowAtribuirModal(false)}
        title="Distribuir Rifas para Aluno"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Defina o intervalo de números que você entregou fisicamente para este aluno vender.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Número Inicial
              </label>
              <input
                type="number"
                min="1"
                max="800"
                value={atribuirInicio}
                onChange={(e) => setAtribuirInicio(e.target.value)}
                placeholder="Ex: 1"
                className="w-full px-4 py-3 rounded-xl bg-surface border border-card-border text-foreground transition-colors"
              />
            </div>
            <div className="flex-1">
              <label className="block text-sm font-semibold text-foreground mb-2">
                Número Final
              </label>
              <input
                type="number"
                min="1"
                max="800"
                value={atribuirFim}
                onChange={(e) => setAtribuirFim(e.target.value)}
                placeholder="Ex: 50"
                className="w-full px-4 py-3 rounded-xl bg-surface border border-card-border text-foreground transition-colors"
              />
            </div>
          </div>
          <Button
            loading={atribuindo}
            onClick={handleAtribuirRifas}
            className="w-full"
          >
            Confirmar Atribuição
          </Button>
        </div>
      </Modal>
    </div>
  )
}

export default function AdminDashboard() {
  return (
    <ToastProvider>
      <DashboardContent />
    </ToastProvider>
  )
}
