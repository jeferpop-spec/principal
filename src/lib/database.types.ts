export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      medicos: {
        Row: {
          id: string
          nome: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          nome: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          nome?: string
          ativo?: boolean
          created_at?: string
        }
      }
      codigos_aghu: {
        Row: {
          id: string
          medico_id: string
          modalidade: string
          especialidade: string
          codigo_aghu: string
          ativo: boolean
          created_at: string
        }
        Insert: {
          id?: string
          medico_id: string
          modalidade: string
          especialidade: string
          codigo_aghu: string
          ativo?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          medico_id?: string
          modalidade?: string
          especialidade?: string
          codigo_aghu?: string
          ativo?: boolean
          created_at?: string
        }
      }
      vagas_dia: {
        Row: {
          id: string
          data: string
          medico_id: string
          turno: string
          vagas_totais: number
          created_at: string
        }
        Insert: {
          id?: string
          data: string
          medico_id: string
          turno: string
          vagas_totais: number
          created_at?: string
        }
        Update: {
          id?: string
          data?: string
          medico_id?: string
          turno?: string
          vagas_totais?: number
          created_at?: string
        }
      }
      marcacoes: {
        Row: {
          id: string
          data: string
          medico_id: string
          turno: string
          modalidade: string
          especialidade: string
          codigo_aghu: string
          status: string
          created_at: string
          cancelled_at: string | null
          user_id: string | null
        }
        Insert: {
          id?: string
          data: string
          medico_id: string
          turno: string
          modalidade: string
          especialidade: string
          codigo_aghu: string
          status?: string
          created_at?: string
          cancelled_at?: string | null
          user_id?: string | null
        }
        Update: {
          id?: string
          data?: string
          medico_id?: string
          turno?: string
          modalidade?: string
          especialidade?: string
          codigo_aghu?: string
          status?: string
          created_at?: string
          cancelled_at?: string | null
          user_id?: string | null
        }
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: string
          ativo: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: string
          ativo?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      bloqueios_agenda: {
        Row: {
          id: string
          medico_id: string | null
          data_inicio: string
          data_fim: string
          motivo: string
          descricao: string | null
          observacoes: string | null
          ativo: boolean
          criado_por: string | null
          criado_em: string
          atualizado_em: string
        }
        Insert: {
          id?: string
          medico_id?: string | null
          data_inicio: string
          data_fim: string
          motivo: string
          descricao?: string | null
          observacoes?: string | null
          ativo?: boolean
          criado_por?: string | null
          criado_em?: string
          atualizado_em?: string
        }
        Update: {
          id?: string
          medico_id?: string | null
          data_inicio?: string
          data_fim?: string
          motivo?: string
          descricao?: string | null
          observacoes?: string | null
          ativo?: boolean
          criado_por?: string | null
          criado_em?: string
          atualizado_em?: string
        }
      }
    }
  }
}
