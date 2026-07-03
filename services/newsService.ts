
import { supabase } from '../lib/supabase';
import { NewsItem } from '../types';

export const getUserNews = async (userId: string): Promise<NewsItem[]> => {
  // Select using the correct foreign key column: id_user
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('id_user', userId)
    .order('created_at', { ascending: false });

  if (error) {
    // Propagar o erro para que a UI saiba se a tabela não existe
    throw error;
  }

  return data.map((item: any) => mapToNewsItem(item));
};

export const getRecentNews = async (userId: string, limit: number = 5): Promise<NewsItem[]> => {
  const { data, error } = await supabase
    .from('noticias')
    .select('*')
    .eq('id_user', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw error;
  }

  return data.map((item: any) => mapToNewsItem(item));
};

export const createNews = async (userId: string, newsData: { title: string, url: string, category: string, summary?: string, status: 'draft' | 'published' }) => {
  const { data, error } = await supabase
    .from('noticias')
    .insert([{
      id_user: userId,
      titulo_noticia: newsData.title,
      link_noticia: newsData.url,
      categoria: newsData.category,
      resumo_noticia: newsData.summary || '',
      status: newsData.status
    }])
    .select()
    .single();

  if (error) throw error;
  return mapToNewsItem(data);
};

export const deleteNews = async (id: string) => {
  const { error } = await supabase
    .from('noticias')
    .delete()
    .eq('id', id);

  if (error) throw error;
};

export const updateNews = async (id: string, updates: Partial<NewsItem>) => {
  // Mapear campos do frontend para o banco de dados (usando nomes exatos do banco)
  const dbUpdates: any = {};
  
  if (updates.title !== undefined) dbUpdates.titulo_noticia = updates.title;
  if (updates.summary !== undefined) dbUpdates.resumo_noticia = updates.summary;
  if (updates.category !== undefined) dbUpdates.categoria = updates.category;
  if (updates.url !== undefined) dbUpdates.link_noticia = updates.url;
  if (updates.status !== undefined) dbUpdates.status = updates.status;

  const { error } = await supabase
    .from('noticias')
    .update(dbUpdates)
    .eq('id', id);

  if (error) throw error;
};

export const subscribeToNews = (userId: string, onNewItem: (item: NewsItem) => void) => {
  return supabase
    .channel('custom-all-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'noticias', filter: `id_user=eq.${userId}` },
      (payload) => {
        console.log('Nova notícia recebida em tempo real:', payload);
        onNewItem(mapToNewsItem(payload.new));
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'noticias', filter: `id_user=eq.${userId}` },
      (payload) => {
        console.log('Notícia atualizada em tempo real:', payload);
        onNewItem(mapToNewsItem(payload.new));
      }
    )
    .subscribe();
};

const mapToNewsItem = (item: any): NewsItem => ({
  id: item.id,
  // Mapeamento baseado no esquema fornecido: titulo_noticia, link_noticia, resumo_noticia
  title: item.titulo_noticia || item.title || 'Nova Notícia',
  url: item.link_noticia || item.url || '',
  category: item.categoria || 'Geral',
  status: item.status || 'draft',
  summary: item.resumo_noticia || item.summary || item.corpo_noticia || '', // Fallback para corpo_noticia se resumo estiver vazio
  date: new Date(item.created_at).toLocaleDateString('pt-BR')
});
