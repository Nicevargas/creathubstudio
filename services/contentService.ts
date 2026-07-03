
import { supabase } from '../lib/supabase';
import { GeneratedContent } from '../types';

/**
 * Normaliza o tipo de conteúdo vindo do banco de dados.
 * Converte variações de 'imagem' ou 'image' para o padrão 'image'.
 * Converte variações de 'video' para o padrão 'video'.
 */
const normalizeType = (item: any): 'image' | 'video' => {
  const t = String(item.tipo || item.type || item.tipo_conteudo || '').toLowerCase();
  if (t.includes('imag') || t.includes('photo') || t === 'ugc' || t === 'image') {
    return 'image';
  }
  if (t.includes('vid') || t.includes('movie') || t.includes('sora') || t === 'video') {
    return 'video';
  }
  return 'image'; // Fallback padrão
};

export const getUserContent = async (userId: string): Promise<GeneratedContent[]> => {
  const { data, error } = await supabase
    .from('conteudos_gerados')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data.map((item: any) => ({
    id: item.id,
    type: normalizeType(item),
    url: item.link_arquivo || item.url || item.link || item.imagem || item.link_imagem,
    prompt: item.prompt,
    created_at: item.created_at
  }));
};

export const getRecentMedia = async (userId: string, limit: number = 3): Promise<GeneratedContent[]> => {
  const { data, error } = await supabase
    .from('conteudos_gerados')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Erro ao buscar mídia recente:", error);
    return [];
  }

  return data.map((item: any) => ({
    id: item.id,
    type: normalizeType(item),
    url: item.link_arquivo || item.url || item.link || item.imagem || item.link_imagem,
    prompt: item.prompt,
    created_at: item.created_at
  }));
};

export const deleteContent = async (id: string, url?: string) => {
  if (url && url.includes('/storage/v1/object/public/')) {
    try {
      const pathPart = url.split('/storage/v1/object/public/')[1];
      if (pathPart) {
        const [bucketName, ...filePathParts] = pathPart.split('/');
        const filePath = filePathParts.join('/');
        
        if (bucketName && filePath) {
          await supabase.storage.from(bucketName).remove([filePath]);
        }
      }
    } catch (err) {
      console.warn("Erro ao tentar processar exclusão de arquivo físico:", err);
    }
  }

  const { error } = await supabase
    .from('conteudos_gerados')
    .delete()
    .eq('id', id);

  if (error) throw error;
};
