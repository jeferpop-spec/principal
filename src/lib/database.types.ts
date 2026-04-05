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
          vagas_totais: number
          created_at: string
        }
        Insert: {
          id?: string
          data: string
          medico_id: string
          vagas_totais: number
          created_at?: string
        }
        Update: {
          id?: string
          data?: string
          medico_id?: string
          vagas_totais?: number
          created_at?: string
        }
      }
      marcacoes: {
        Row: {
          id: string
          data: string
          medico_id: string
          modalidade: string
          especialidade: string
          codigo_aghu: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          data: string
          medico_id: string
          modalidade: string
          especialidade: string
          codigo_aghu: string
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          data?: string
          medico_id?: string
          modalidade?: string
          especialidade?: string
          codigo_aghu?: string
          status?: string
          created_at?: string
        }
      }
    }
  }
}
