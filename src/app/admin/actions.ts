'use server'

import { createClient } from '@/lib/supabase/server'
import { VALOR_RIFA } from '@/lib/types'

export async function getDashboardData() {
  const supabase = await createClient()

  // Get all stats in parallel
  const [
    { count: totalVendidas },
    { count: totalRifas },
    { data: vendas, error: vendasError },
    { data: alunos, error: alunosError },
  ] = await Promise.all([
    supabase.from('rifas').select('*', { count: 'exact', head: true }).eq('vendido', true),
    supabase.from('rifas').select('*', { count: 'exact', head: true }),
    supabase
      .from('vendas')
      .select('*, alunos(*), rifas(*)')
      .order('created_at', { ascending: false })
      .limit(100),
    supabase.from('alunos').select('*, rifas(id, numero, vendido)').order('nome').limit(500),
  ])

  if (vendasError || alunosError) {
    console.error('Erro ao buscar dados do dashboard:', { vendasError, alunosError })
    return {
      stats: { vendidas: totalVendidas || 0, total: totalRifas || 0, disponiveis: 0, arrecadado: 0 },
      vendas: [],
      alunos: [],
    }
  }

  const sold = totalVendidas || 0
  const total = totalRifas || 0

  return {
    stats: {
      vendidas: sold,
      total,
      disponiveis: total - sold,
      arrecadado: sold * VALOR_RIFA,
    },
    vendas: (vendas as any) || [],
    alunos: (alunos as any) || [],
  }
}

export async function adicionarAluno(formData: FormData) {
  const supabase = await createClient()

  const nome = formData.get('nome') as string
  const turma = formData.get('turma') as string

  if (!nome?.trim() || !turma?.trim()) {
    return { error: 'Nome e turma são obrigatórios.' }
  }

  const { error } = await supabase
    .from('alunos')
    .insert({ nome: nome.trim(), turma: turma.trim() })

  if (error) return { error: 'Erro ao adicionar aluno.' }
  return { success: true }
}

export async function removerAluno(id: string) {
  const supabase = await createClient()

  const { error } = await supabase.from('alunos').delete().eq('id', id)

  if (error) return { error: 'Erro ao remover aluno.' }
  return { success: true }
}

export async function cancelarVenda(vendaId: string, rifaId: string) {
  const supabase = await createClient()

  // Reset rifa
  const { error: rifaError } = await supabase
    .from('rifas')
    .update({ vendido: false, aluno_id: null })
    .eq('id', rifaId)

  if (rifaError) return { error: 'Erro ao resetar rifa.' }

  // Delete sale
  const { error: vendaError } = await supabase
    .from('vendas')
    .delete()
    .eq('id', vendaId)

  if (vendaError) return { error: 'Erro ao cancelar venda.' }

  return { success: true }
}

export async function adminLogout() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  return { success: true }
}

export async function atribuirRifas(formData: FormData) {
  const supabase = await createClient()

  const alunoId = formData.get('aluno_id') as string
  const inicio = parseInt(formData.get('inicio') as string)
  const fim = parseInt(formData.get('fim') as string)

  if (!alunoId || isNaN(inicio) || isNaN(fim)) {
    return { error: 'Dados obrigatórios não preenchidos corretamente.' }
  }

  if (inicio > fim) {
    return { error: 'O número final não pode ser menor que o inicial.' }
  }

  // Verifica se alguma rifa no intervalo já está vendida
  const { data: conflitantes } = await supabase
    .from('rifas')
    .select('numero')
    .gte('numero', inicio)
    .lte('numero', fim)
    .eq('vendido', true)
    
  if (conflitantes && conflitantes.length > 0) {
    return { error: 'Não é possível atribuir, pois algumas rifas neste intervalo já foram vendidas.' }
  }

  const { data, error, count } = await supabase
    .from('rifas')
    .update({ aluno_id: alunoId }, { count: 'exact' })
    .gte('numero', inicio)
    .lte('numero', fim)
    .select()

  if (error) {
    console.error('Erro ao atribuir rifas:', error)
    return { error: 'Erro ao atribuir as rifas: ' + error.message }
  }

  if (!count || count === 0) {
    return { error: `Nenhuma rifa encontrada no intervalo de ${inicio} a ${fim}. Verifique se os números já foram criados no banco.` }
  }

  console.log(`Sucesso: ${count} rifas atribuídas ao aluno ${alunoId}`)
  return { success: true }
}
