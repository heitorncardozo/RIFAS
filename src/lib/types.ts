export type Aluno = {
  id: string
  nome: string
  turma: string
  created_at: string
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
  alunos?: Aluno
  rifas?: Rifa
}

export const VALOR_RIFA = 5 // R$ 5,00
export const TOTAL_RIFAS = 800
