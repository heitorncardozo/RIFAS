'use server'

import { createClient } from '@/lib/supabase/server'

export async function registrarVenda(formData: FormData) {
  const supabase = await createClient()

  const alunoId = formData.get('aluno_id') as string
  const rifasNumerosStr = formData.get('rifas_numeros') as string
  const comprovante = formData.get('comprovante') as File

  let rifasNumeros: number[] = []
  try {
    rifasNumeros = JSON.parse(rifasNumerosStr)
  } catch (e) {
    return { error: 'Formato de números inválido.' }
  }

  // Validate inputs
  if (!alunoId || !rifasNumeros || rifasNumeros.length === 0 || !comprovante) {
    return { error: 'Todos os campos são obrigatórios e você deve selecionar ao menos uma rifa.' }
  }

  if (!comprovante.type.startsWith('image/')) {
    return { error: 'O comprovante deve ser uma imagem.' }
  }

  if (comprovante.size > 5 * 1024 * 1024) {
    return { error: 'O comprovante deve ter no máximo 5MB.' }
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

    // 2. Upload the receipt image
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

    // 4. Mark rifas as sold
    const rifasIds = rifas.map(r => r.id)
    const { error: updateError } = await supabase
      .from('rifas')
      .update({ vendido: true, aluno_id: alunoId })
      .in('id', rifasIds)

    if (updateError) {
      return { error: 'Erro ao atualizar rifas. Tente novamente.' }
    }

    // 5. Create multiple sale records
    const vendasToInsert = rifas.map(r => ({
      aluno_id: alunoId,
      rifa_id: r.id,
      comprovante_url: urlData.publicUrl,
    }))

    const { error: vendaError } = await supabase
      .from('vendas')
      .insert(vendasToInsert)

    if (vendaError) {
      return { error: 'Erro ao registrar venda. Tente novamente.' }
    }

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

  if (error) return { error: 'Erro ao carregar alunos.' }
  return { data }
}

export async function getRifasDisponiveis() {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('rifas')
    .select('numero, vendido, aluno_id')
    .order('numero')

  if (error) return { error: 'Erro ao carregar rifas.' }
  return { data }
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
