export type Aluno = {
  id: string
  nome: string
  turma: string
  created_at: string
  rifas?: { id: string }[]
}

export type Rifa = {
  id: string
  numero: number
  aluno_id: string | null
  vendido: boolean
  created_at: string
}

export type Venda = {
  id: string
  aluno_id: string
  rifa_id: string
  comprovante_url: string
  created_at: string
  // Joined fields
  alunos: Aluno | null
  rifas: Rifa | null
}

export const VALOR_RIFA = 10 // R$ 10,00
export const TOTAL_RIFAS = 1250
