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

    if (user && user.user_metadata && user.user_metadata.role) {
      return {
        user_id: user.id,
        role: user.user_metadata.role as UserRole,
        ativo: user.user_metadata.ativo !== false,
        created_at: user.created_at,
      };
    }

    // Se usuário existir mas não tiver role definida ou metadados, assume atendente basico como fallback
    if (user) {
       return {
         user_id: user.id,
         role: 'atendente',
         ativo: true,
         created_at: user.created_at,
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
      options: {
        data: {
          role: role,
          ativo: true
        }
      }
    });

    if (signUpError) throw signUpError;
    if (!user) throw new Error('Usuário não criado');

    return { user, role };
  } catch (error) {
    console.error('Erro ao criar usuário:', error);
    throw error;
  }
}

// Função para atualizar role do usuário
export async function updateUserRole(userId: string, newRole: UserRole) {
  try {
    const { error } = await supabase.auth.updateUser({
       data: { role: newRole }
    });
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
    // @ts-expect-error bypass
    const { error } = await supabase.from('user_roles').update({ ativo: false } as any).eq('user_id', userId);

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
