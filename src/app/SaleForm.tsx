'use client'

import { useState, useEffect, useCallback } from 'react'
import Button from '@/components/ui/Button'
import FileUpload from '@/components/ui/FileUpload'
import { useToast } from '@/components/ui/Toast'
import { registrarVenda, getAlunos, getRifasDisponiveis, getEstatisticas, getRifasDoAluno } from './actions'
import type { Aluno } from '@/lib/types'
import { VALOR_RIFA, TOTAL_RIFAS } from '@/lib/types'

type RifaStatus = { numero: number; vendido: boolean; aluno_id: string | null }

export default function SaleForm() {
  const { showToast } = useToast()
  const [alunos, setAlunos] = useState<Aluno[]>([])
  const [rifas, setRifas] = useState<RifaStatus[]>([])
  const [stats, setStats] = useState({ vendidas: 0, total: TOTAL_RIFAS, disponiveis: TOTAL_RIFAS })

  const [selectedTurma, setSelectedTurma] = useState('')
  const [selectedAluno, setSelectedAluno] = useState('')
  const [selectedNumeros, setSelectedNumeros] = useState<number[]>([])
  const [formaPagamento, setFormaPagamento] = useState<'pix' | 'dinheiro'>('pix')
  const [comprovante, setComprovante] = useState<File | null>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [loadingData, setLoadingData] = useState(true)
  const [loadingRifas, setLoadingRifas] = useState(false)
  const [success, setSuccess] = useState(false)

  const loadData = useCallback(async () => {
    setLoadingData(true)
    const [alunosRes, statsRes] = await Promise.all([
      getAlunos(),
      getEstatisticas(),
    ])
    if (alunosRes.data) setAlunos(alunosRes.data)
    setStats(statsRes)
    setLoadingData(false)
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleFileSelect = (file: File) => {
    setComprovante(file)
    const reader = new FileReader()
    reader.onloadend = () => setPreview(reader.result as string)
    reader.readAsDataURL(file)
  }

  useEffect(() => {
    setSelectedAluno('')
  }, [selectedTurma])

  useEffect(() => {
    setSelectedNumeros([])
    
    async function fetchRifas() {
      if (!selectedAluno) {
        setRifas([])
        return
      }
      
      setLoadingRifas(true)
      const res = await getRifasDoAluno(selectedAluno)
      if (res.data) {
        setRifas(res.data as RifaStatus[])
      } else if (res.error) {
        showToast(res.error, 'error')
      }
      setLoadingRifas(false)
    }
    
    fetchRifas()
  }, [selectedAluno, showToast])

  const handleSubmit = async () => {
    if (!selectedAluno || selectedNumeros.length === 0) {
      showToast('Selecione o aluno e pelo menos uma rifa.', 'warning')
      return
    }

    if (!comprovante) {
      const msg = formaPagamento === 'pix' ? 'O comprovante é obrigatório para pagamentos via PIX.' : 'A foto do dinheiro é obrigatória para pagamentos em dinheiro.'
      showToast(msg, 'warning')
      return
    }

    setLoading(true)
    const formData = new FormData()
    formData.append('aluno_id', selectedAluno)
    formData.append('rifas_numeros', JSON.stringify(selectedNumeros))
    formData.append('forma_pagamento', formaPagamento)
    if (comprovante) {
      formData.append('comprovante', comprovante)
    }

    const result = await registrarVenda(formData)

    if (result.error) {
      showToast(result.error, 'error')
    } else {
      showToast(`Rifas (${result.numeros}) registradas com sucesso! 🎉`, 'success')
      setSuccess(true)
      setSelectedAluno('')
      setSelectedNumeros([])
      setComprovante(null)
      setPreview(null)
      await loadData()
      setTimeout(() => setSuccess(false), 3000)
    }
    setLoading(false)
  }

  const disponiveisNumbers = rifas
    .filter((r) => !r.vendido && r.aluno_id === selectedAluno)
    .map((r) => r.numero)
  const progressPercent = stats.total > 0 ? (stats.vendidas / stats.total) * 100 : 0

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Progress Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-4 rounded-2xl bg-card-bg border border-card-border">
          <p className="text-2xl font-bold text-success">{stats.vendidas}</p>
          <p className="text-xs text-muted mt-1">Vendidas</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-card-bg border border-card-border">
          <p className="text-2xl font-bold text-primary">{stats.disponiveis}</p>
          <p className="text-xs text-muted mt-1">Disponíveis</p>
        </div>
        <div className="text-center p-4 rounded-2xl bg-card-bg border border-card-border">
          <p className="text-2xl font-bold text-accent">
            R$ {(stats.vendidas * VALOR_RIFA).toLocaleString('pt-BR')}
          </p>
          <p className="text-xs text-muted mt-1">Arrecadado</p>
        </div>
      </div>

      {/* Progress bar */}
      <div>
        <div className="flex justify-between text-sm text-muted mb-2">
          <span>Progresso de vendas</span>
          <span>{progressPercent.toFixed(1)}%</span>
        </div>
        <div className="h-3 rounded-full bg-surface overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-1000 ease-out"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Form */}
      {loadingData ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 rounded-xl bg-surface shimmer" />
          ))}
        </div>
      ) : (
        <div className="space-y-5">
          {/* Class (Turma) select */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              🏫 Turma
            </label>
            <select
              id="select-turma"
              value={selectedTurma}
              onChange={(e) => setSelectedTurma(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-surface border border-card-border text-foreground focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">Todas as turmas...</option>
              {Array.from(new Set(alunos.map(a => a.turma))).sort().map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </div>

          {/* Student select */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              👤 Vendedor (Aluno)
            </label>
            <select
              id="select-aluno"
              value={selectedAluno}
              onChange={(e) => setSelectedAluno(e.target.value)}
              className="w-full px-4 py-3.5 rounded-xl bg-surface border border-card-border text-foreground focus:border-primary transition-colors appearance-none cursor-pointer"
            >
              <option value="">Selecione o aluno...</option>
              {alunos
                .filter(a => !selectedTurma || a.turma === selectedTurma)
                .map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome} {selectedTurma ? '' : `— ${a.turma}`}
                </option>
              ))}
            </select>
          </div>

          {/* Rifa number select grid */}
          {selectedAluno && disponiveisNumbers.length > 0 && (
            <div>
              <div className="flex justify-between items-end mb-2">
                <label className="block text-sm font-semibold text-foreground">
                  🎟️ Selecione os Números
                </label>
                <span className="text-xs font-medium text-muted bg-surface px-2 py-1 rounded-md">
                  {selectedNumeros.length} selecionados
                </span>
              </div>
              <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2 max-h-64 overflow-y-auto p-2 bg-surface border border-card-border rounded-xl relative min-h-[100px]">
                {loadingRifas && (
                  <div className="absolute inset-0 bg-surface/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl">
                    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
                {disponiveisNumbers.map((n) => {
                  const isSelected = selectedNumeros.includes(n)
                  return (
                    <button
                      key={n}
                      type="button"
                      onClick={() => {
                        if (isSelected) {
                          setSelectedNumeros(prev => prev.filter(num => num !== n))
                        } else {
                          setSelectedNumeros(prev => [...prev, n])
                        }
                      }}
                      className={`py-2 text-sm font-semibold rounded-lg border transition-all cursor-pointer ${
                        isSelected 
                          ? 'bg-primary text-white border-primary shadow-lg shadow-primary/30 transform scale-105' 
                          : 'bg-card-bg text-foreground border-card-border hover:border-primary/50 hover:bg-surface'
                      }`}
                    >
                      {String(n).padStart(3, '0')}
                    </button>
                  )
                })}
              </div>
            </div>
          )}
          {selectedAluno && disponiveisNumbers.length === 0 && (
            <div className="p-4 bg-warning/10 border border-warning/20 text-warning rounded-xl text-sm animate-fade-in text-center font-medium">
              ⚠ Este aluno não possui rifas disponíveis para vender. O Admin precisa distribuir as rifas no painel primeiro!
            </div>
          )}

          {/* Payment Method select */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              💳 Forma de Pagamento
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormaPagamento('pix')}
                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                  formaPagamento === 'pix'
                    ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20'
                    : 'bg-surface border-card-border text-muted hover:border-primary/50'
                }`}
              >
                <span className="text-xl">📱</span> PIX
              </button>
              <button
                type="button"
                onClick={() => setFormaPagamento('dinheiro')}
                className={`flex items-center justify-center gap-2 px-4 py-3.5 rounded-xl border font-semibold transition-all cursor-pointer ${
                  formaPagamento === 'dinheiro'
                    ? 'bg-primary/10 border-primary text-primary shadow-sm shadow-primary/20'
                    : 'bg-surface border-card-border text-muted hover:border-primary/50'
                }`}
              >
                <span className="text-xl">💵</span> Dinheiro
              </button>
            </div>
          </div>

          {/* Receipt upload (Always mandatory now) */}
          <div className="animate-slide-up">
            <label className="block text-sm font-semibold text-foreground mb-2">
              📸 {formaPagamento === 'pix' ? 'Comprovante de Pagamento' : 'Foto do Dinheiro'}
            </label>
            <FileUpload
              onFileSelect={handleFileSelect}
              preview={preview}
            />
          </div>

          {/* Submit */}
          <Button
            id="btn-registrar"
            size="lg"
            loading={loading}
            onClick={handleSubmit}
            className="w-full"
          >
            {success ? '✓ Venda Registrada!' : '🎯 Registrar Venda'}
          </Button>
        </div>
      )}
    </div>
  )
}
