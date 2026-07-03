
import { supabase } from '../lib/supabase';
import { CreditPackage, CreditPurchase, CreditUsage } from '../types';

export const getCreditPackages = async (): Promise<CreditPackage[]> => {
  const { data, error } = await supabase
    .from('credit_packages')
    .select('*')
    .order('price', { ascending: true });

  if (error) {
    console.error('Error fetching packages:', error);
    throw error;
  }

  return data as CreditPackage[];
};

export const getPurchaseHistory = async (userId: string): Promise<CreditPurchase[]> => {
  // Select explícito para garantir que estamos pegando as colunas certas
  const { data, error } = await supabase
    .from('credit_purchases')
    .select('id, user_id, package_id, amount_paid, status, created_at, image_credits_purchased, video_credits_purchased, external_id')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching purchase history:', error);
    return [];
  }

  return data as CreditPurchase[];
};

// Nova função para buscar o dashboard estruturado
export const getCreditsDashboardData = async (userId: string) => {
  // 1. Buscar saldo atual no perfil (Créditos Reais Disponíveis)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('image_credits, video_credits')
    .eq('id', userId)
    .single();

  if (profileError) {
    console.error("Erro ao buscar perfil para dashboard:", JSON.stringify(profileError));
    // Não lança erro fatal para não quebrar a UI toda, retorna zerado
  }

  // 2. Buscar histórico de compras
  const { data: purchases, error: purchaseError } = await supabase
    .from('credit_purchases')
    .select('*, credit_packages(name)') // Join para pegar nome do pacote se possível
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (purchaseError) {
    console.error("Erro ao buscar compras:", JSON.stringify(purchaseError));
  }

  const imgCredits = profile?.image_credits || 0;
  const vidCredits = profile?.video_credits || 0;
  const totalCredits = imgCredits + vidCredits;

  const historicoFormatado = purchases ? purchases.map((p: any) => {
    // Determina o tipo baseado em qual coluna tem valor > 0
    let tipo = "imagem";
    const imgQtd = p.image_credits_purchased || 0;
    const vidQtd = p.video_credits_purchased || 0;
    
    if (vidQtd > 0 && imgQtd === 0) tipo = "video";
    else if (vidQtd > 0 && imgQtd > 0) tipo = "combo";

    return {
      id: p.id,
      tipo: tipo,
      quantidade: imgQtd + vidQtd, // Soma visual
      img_qtd: imgQtd,
      vid_qtd: vidQtd,
      data: p.created_at,
      status: p.status,
      descricao: p.credit_packages?.name 
        ? `Pacote ${p.credit_packages.name}` 
        : `Compra de Créditos`,
      valor: p.amount_paid
    };
  }) : [];

  const dashboardData = {
    usuario: {
      id: userId,
      creditos: {
        imagem: imgCredits,
        video: vidCredits,
        total: totalCredits
      },
      status: totalCredits > 0 ? "ativo" : "sem_creditos"
    },
    historico: historicoFormatado
  };

  return dashboardData;
};

export const getTotalPurchasedCredits = async (userId: string): Promise<{ image: number, video: number }> => {
  const { data, error } = await supabase
    .from('credit_purchases')
    .select('image_credits_purchased, video_credits_purchased')
    .eq('user_id', userId)
    .eq('status', 'paid'); // Conta apenas pagos

  if (error) {
    console.error('Error calculating total credits:', JSON.stringify(error));
    return { image: 0, video: 0 };
  }

  // Soma os créditos usando os nomes corretos das colunas
  const totals = data.reduce((acc: any, curr: any) => ({
    image: acc.image + (curr.image_credits_purchased || 0),
    video: acc.video + (curr.video_credits_purchased || 0)
  }), { image: 0, video: 0 });

  return totals;
};

export const deductCredits = async (userId: string, type: 'image' | 'video', amount: number, description: string) => {
  // Chamada à função RPC ATÔMICA no banco de dados
  const { data, error } = await supabase.rpc('deduct_credits_atomic', {
    p_user_id: userId,
    p_type: type,
    p_amount: amount,
    p_description: description
  });

  if (error) {
    console.error('Erro no débito de créditos:', error);
    // Se a função não existe (erro 42883), tenta fallback manual (menos seguro, mas funciona)
    if (error.code === '42883') {
       console.warn("RPC deduct_credits_atomic não encontrada. Tentando update manual.");
       return await deductCreditsManual(userId, type, amount, description);
    }
    throw new Error('Falha ao processar débito de créditos. Tente novamente.');
  }

  // Se a função retornou false, significa saldo insuficiente
  if (data === false) {
    throw new Error(`Saldo insuficiente de créditos de ${type === 'image' ? 'Imagem' : 'Vídeo'}. Recarregue seus créditos.`);
  }

  return true; // Sucesso
};

// Fallback para débito manual se a RPC não existir
const deductCreditsManual = async (userId: string, type: 'image' | 'video', amount: number, description: string) => {
   // 1. Check balance
   const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).single();
   if (!profile) throw new Error("Perfil não encontrado");

   const balance = type === 'image' ? profile.image_credits : profile.video_credits;
   if (balance < amount) throw new Error("Saldo insuficiente");

   // 2. Update balance
   const updateData = type === 'image' 
     ? { image_credits: balance - amount } 
     : { video_credits: balance - amount };
   
   const { error: updateError } = await supabase.from('profiles').update(updateData).eq('id', userId);
   if (updateError) throw updateError;

   // 3. Insert History
   await supabase.from('credit_history').insert([{
     user_id: userId,
     type: type,
     amount: amount,
     description: description
   }]);

   return true;
};

export const getUsageHistory = async (userId: string): Promise<CreditUsage[]> => {
  const { data, error } = await supabase
    .from('credit_history')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching usage history:', error);
    return [];
  }

  return data as CreditUsage[];
};
