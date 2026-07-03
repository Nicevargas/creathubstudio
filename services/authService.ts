
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const getCurrentProfile = async (): Promise<User | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;

  // 1. Tenta buscar o perfil existente
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .maybeSingle();

  // 2. AUTO-CURA: Se o usuário existe no Auth mas não tem perfil no Banco
  if (!data) {
    console.warn("⚠️ Perfil não encontrado para usuário autenticado. Iniciando Auto-Cura...");
    
    const metadata = session.user.user_metadata;
    const email = session.user.email || '';
    
    // Tenta criar o perfil manualmente agora
    try {
      await createProfile({
        id: session.user.id,
        name: metadata?.name || email.split('@')[0],
        email: email,
        category: metadata?.category || 'Geral'
      });
      
      // Busca novamente após criar
      const { data: newData, error: newError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .maybeSingle();
        
      if (newData) {
        console.log("✅ Auto-Cura realizada com sucesso!");
        return mapProfileToUser(newData, determinePlan(session.user.email, newData.plan));
      } else {
        console.error("❌ Falha na Auto-Cura:", newError);
        return null;
      }
    } catch (err) {
       console.error("❌ Erro crítico na Auto-Cura:", err);
       return null;
    }
  }

  if (error) {
    console.error('Error fetching profile:', error);
    return null;
  }

  return mapProfileToUser(data, determinePlan(session.user.email, data.plan));
};

// Helper para definir o plano
const determinePlan = (email: string | undefined, dbPlan: string) => {
  if (email === 'eunicelvargas@gmail.com') return 'Business';
  return dbPlan || 'Teste';
};

const mapProfileToUser = (data: any, plan: string): User => ({
    id: data.id,
    name: data.name || '',
    email: data.email || '',
    category: data.category || '',
    imageCredits: data.image_credits || 0,
    videoCredits: data.video_credits || 0,
    avatar: data.avatar_url,
    preferences: data.preferences || {},
    plan: plan,
    cnpj_cpf: data.cnpj_cpf,
    phone: data.phone
});

export const createProfile = async (user: Partial<User> & { id: string }) => {
  // Define o perfil completo
  const fullProfile = {
    id: user.id,
    name: user.name,
    email: user.email,
    category: user.category,
    image_credits: 5, // Crédito inicial
    video_credits: 2, // Crédito inicial
    plan: 'Teste'
  };

  // Tenta inserir (UPSERT)
  const { error } = await supabase
    .from('profiles')
    .upsert([fullProfile], { onConflict: 'id' });

  if (error) {
    console.warn('Falha ao criar perfil completo. Tentando fallback mínimo...', error.message);
    
    // Fallback: Se falhar por causa de colunas extras (ex: video_credits não existe ainda)
    // Tenta inserir apenas o básico para garantir o acesso
    const minimalProfile = {
       id: user.id,
       email: user.email,
       name: user.name
    };
    
    const { error: retryError } = await supabase
       .from('profiles')
       .upsert([minimalProfile], { onConflict: 'id' });
    
    if (retryError) {
      console.error("Falha total na criação do perfil:", retryError);
      throw retryError;
    }
  }
};

export const updateProfile = async (userId: string, updates: Partial<User>) => {
  const dbUpdates: any = {};
  
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.category !== undefined) dbUpdates.category = updates.category;
  if (updates.preferences !== undefined) dbUpdates.preferences = updates.preferences;
  if (updates.phone !== undefined) dbUpdates.phone = updates.phone;
  if (updates.cnpj_cpf !== undefined) dbUpdates.cnpj_cpf = updates.cnpj_cpf;

  const { error } = await supabase
    .from('profiles')
    .update(dbUpdates)
    .eq('id', userId);

  if (error) throw error;
};

export const updatePassword = async (newPassword: string) => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword
  });
  if (error) throw error;
};

export const uploadAvatar = async (userId: string, file: File): Promise<string> => {
  try {
    const fileExt = file.name.split('.').pop()?.toLowerCase();
    const cleanFileName = `${userId}-${Date.now()}.${fileExt}`;
    
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(cleanFileName, file, { upsert: true });

    if (uploadError) throw uploadError;

    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(cleanFileName);

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ avatar_url: data.publicUrl })
      .eq('id', userId);

    if (updateError) throw updateError;

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
};

export const signOut = async () => {
  await supabase.auth.signOut();
};
