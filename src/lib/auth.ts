import { supabase } from './supabase';
import type { Database } from './database.types';

export type UserRole = 'admin' | 'medico' | 'atendente' | 'visualizador';

export interface UserProfile {
  user_id: string;
  role: UserRole;
  ativo: boolean;
  created_at: string;
}

export interface AuthContext {
  isAuthenticated: boolean;
  user: any | null;
  userProfile: UserProfile | null;
  userRole: UserRole | null;
  loading: boolean;
}

// Função para obter o perfil do usuário atual
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data } = await supabase.from('user_roles').select('*').eq('user_id', user.id).maybeSingle() as { data: Database['public']['Tables']['user_roles']['Row'] | null };

    if (data) {
      return {
        user_id: data.user_id,
        role: data.role,
        ativo: data.ativo,
        created_at: data.created_at,
      };
    }

    return null;
  } catch (error) {
    console.error('Erro ao carregar perfil do usuário:', error);
    return null;
  }
}

// Função para verificar permissão
export function hasPermission(userRole: UserRole | null, requiredRole: UserRole[]): boolean {
  if (!userRole) return false;
  return requiredRole.includes(userRole);
}

// Funções de permissão específicas
export const permissions = {
  canManageUsers: (role: UserRole | null) => hasPermission(role, ['admin']),
  canManageMedicos: (role: UserRole | null) => hasPermission(role, ['admin', 'atendente']),
  canManageVagas: (role: UserRole | null) => hasPermission(role, ['admin', 'medico', 'atendente']),
  canCreateMarcacao: (role: UserRole | null) => hasPermission(role, ['admin', 'medico', 'atendente']),
  canDeleteMarcacao: (role: UserRole | null) => hasPermission(role, ['admin', 'atendente']),
  canViewReports: (role: UserRole | null) => hasPermission(role, ['admin', 'atendente']),
  canViewCalendar: (role: UserRole | null) => hasPermission(role, ['admin', 'medico', 'atendente', 'visualizador']),
};

// Função para criar usuário e assignar role
export async function createUserWithRole(email: string, password: string, role: UserRole) {
  try {
    const {
      data: { user },
      error: signUpError,
    } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('Usuário não criado');

    // Criar role do usuário
    const { error: roleError } = await supabase.from('user_roles').insert([
      {
        user_id: user.id,
        role,
        ativo: true,
      },
    ] as Database['public']['Tables']['user_roles']['Insert'][]);

    if (roleError) throw roleError;

    return { user, role };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

// Função para atualizar role do usuário
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    const { error } = await supabase.from('user_roles').update({ role: newRole } as Database['public']['Tables']['user_roles']['Update']).eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao atualizar role do usuário:', error);
    throw error;
  }
}

// Função para desativar usuário
export async function deactivateUser(userId: string) {
  try {
    const { error } = await supabase.from('user_roles').update({ ativo: false } as Database['public']['Tables']['user_roles']['Update']).eq('user_id', userId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('Erro ao desativar usuário:', error);
    throw error;
  }
}

// Função para listar todos os usuários (apenas para admin)
export async function listAllUsers() {
  try {
    const { data } = await supabase.from('user_roles').select('*').order('created_at', { ascending: false });

    return data || [];
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return [];
  }
}
