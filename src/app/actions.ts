'use server'

import { createClient } from '@/lib/supabase/server'

export async function registrarVenda(formData: FormData) {
  const supabase = await createClient()

  const alunoId = formData.get('aluno_id') as string
  const rifasNumerosStr = formData.get('rifas_numeros') as string
  const comprovante = formData.get('comprovante') as File
  const formaPagamento = (formData.get('forma_pagamento') as string) || 'pix'

  let rifasNumeros: number[] = []
  try {
    rifasNumeros = JSON.parse(rifasNumerosStr)
  } catch (e) {
    return { error: 'Formato de números inválido.' }
  }

  // Validate inputs
  if (!alunoId || !rifasNumeros || rifasNumeros.length === 0) {
    return { error: 'Todos os campos são obrigatórios e você deve selecionar ao menos uma rifa.' }
  }

  // Comprovante é obrigatório apenas para PIX
  if (formaPagamento === 'pix') {
    if (!comprovante || comprovante.size === 0) {
      return { error: 'O comprovante é obrigatório para pagamentos via PIX.' }
    }
    if (!comprovante.type.startsWith('image/')) {
      return { error: 'O comprovante deve ser uma imagem.' }
    }
    if (comprovante.size > 5 * 1024 * 1024) {
      return { error: 'O comprovante deve ter no máximo 5MB.' }
    }
  }

  try {
    // 1. Find the rifas by numbers and check if they're available
    const { data: rifas, error: rifasError } = await supabase
      .from('rifas')
      .select('*')
      .in('numero', rifasNumeros)

    if (rifasError || !rifas || rifas.length !== rifasNumeros.length) {
      return { error: 'Algumas rifas não foram encontradas no sistema.' }
    }

    const jaVendidas = rifas.filter(r => r.vendido)
    if (jaVendidas.length > 0) {
      return { error: `Algumas rifas já foram vendidas: ${jaVendidas.map(r => r.numero).join(', ')}. Atualize a página.` }
    }

    let publicUrl = null

    // 2. Upload the receipt image if provided
    if (formaPagamento === 'pix' && comprovante && comprovante.size > 0) {
      const fileExt = comprovante.name.split('.').pop()
      const fileName = `batch_venda_${alunoId}_${Date.now()}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('comprovantes')
        .upload(fileName, comprovante, {
          cacheControl: '3600',
          upsert: false,
        })

      if (uploadError) {
        return { error: 'Erro ao fazer upload do comprovante. Tente novamente.' }
      }

      // 3. Get public URL
      const { data: urlData } = supabase.storage
        .from('comprovantes')
        .getPublicUrl(fileName)
      
      publicUrl = urlData.publicUrl
    }

    // 4. Mark rifas as sold
    const rifasIds = rifas.map(r => r.id)
    const { error: updateError } = await supabase
      .from('rifas')
      .update({ vendido: true, aluno_id: alunoId })
      .in('id', rifasIds)

    if (updateError) {
      console.error('Erro ao atualizar rifas:', updateError)
      return { error: `Erro ao atualizar rifas: ${updateError.message}` }
    }

    // 5. Create multiple sale records
    const vendasToInsert = rifas.map(r => ({
      aluno_id: alunoId,
      rifa_id: r.id,
      comprovante_url: publicUrl,
      forma_pagamento: formaPagamento,
    }))

    const { error: vendaError } = await supabase
      .from('vendas')
      .insert(vendasToInsert)

    if (vendaError) {
      console.error('Erro ao inserir venda:', vendaError)
      return { error: `Erro ao registrar venda: ${vendaError.message}` }
    }

    console.log('Venda registrada com sucesso para:', alunoId)
    return { success: true, numeros: rifas.map(r => r.numero).join(', ') }
  } catch {
    return { error: 'Erro inesperado. Tente novamente.' }
  }
}

export async function getAlunos() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('alunos')
    .select('*')
    .order('nome')
    .limit(500)

  if (error) return { error: 'Erro ao carregar alunos.' }
  return { data }
}

export async function getRifasDisponiveis() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rifas')
    .select('numero, vendido, aluno_id')
    .order('numero')
    .limit(2000)

  if (error) return { error: 'Erro ao carregar rifas.' }
  return { data }
}

export async function getRifasDoAluno(alunoId: string) {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rifas')
    .select('numero, vendido, aluno_id')
    .eq('aluno_id', alunoId)
    .eq('vendido', false)
    .order('numero')

  if (error) {
    console.error('Erro ao carregar rifas do aluno:', error)
    return { error: 'Erro ao carregar rifas do aluno.' }
  }
  return { data: data || [] }
}

export async function getEstatisticas() {
  const supabase = await createClient()

  const { count: totalVendidas } = await supabase
    .from('rifas')
    .select('*', { count: 'exact', head: true })
    .eq('vendido', true)

  const { count: totalRifas } = await supabase
    .from('rifas')
    .select('*', { count: 'exact', head: true })

  return {
    vendidas: totalVendidas || 0,
    total: totalRifas || 0,
    disponiveis: (totalRifas || 0) - (totalVendidas || 0),
  }
}
