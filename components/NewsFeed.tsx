
import React, { useEffect, useState } from 'react';
import { FileText, ArrowRight, ExternalLink, Loader2, Calendar, RefreshCw } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { NewsItem, User } from '../types';
import { getRecentNews, deleteNews } from '../services/newsService';
import { EditNewsModal } from './Modals';

interface NewsFeedProps {
  user: User;
  onCreatePost?: (tab: any, prompt: string) => void;
}

export const NewsFeed: React.FC<NewsFeedProps> = ({ user, onCreatePost }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const navigate = useNavigate();

  const fetchNews = async () => {
    setLoading(true);
    setError(false);
    try {
      const data = await getRecentNews(user.id, 5);
      setNews(data);
    } catch (err: any) {
      console.error("Failed to fetch news for feed:", JSON.stringify(err));
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchNews();
    }
  }, [user]);

  const handleUpdate = (updatedItem: NewsItem) => {
    setNews(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta notícia?')) {
      try {
        await deleteNews(id);
        setNews(prev => prev.filter(item => item.id !== id));
        setEditingNews(null);
      } catch (error: any) {
        console.error("Erro ao excluir", JSON.stringify(error));
        alert(`Erro ao excluir: ${error.message || 'Verifique permissões'}`);
      }
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[200px] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={24} />
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full animate-fade-in">
        <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-white z-10">
          <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
            <FileText size={20} className="text-sky-500" />
            Últimas Notícias
          </h2>
          <div className="flex items-center gap-2">
            <button 
              onClick={fetchNews} 
              className="p-1.5 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-colors"
              title="Atualizar"
            >
              <RefreshCw size={16} />
            </button>
            <Link to="/calendar" className="text-sm text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1 ml-2">
              Ver todas <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          {error ? (
             <div className="p-8 text-center text-red-500 flex flex-col items-center justify-center h-full">
                <p className="text-sm mb-2">Erro ao carregar notícias.</p>
                <button onClick={fetchNews} className="text-xs underline hover:text-red-700">Tentar novamente</button>
             </div>
          ) : news.length > 0 ? (
            <div className="divide-y divide-slate-50">
              {news.map((item) => (
                <div 
                  key={item.id} 
                  onClick={() => setEditingNews(item)}
                  className="p-4 hover:bg-slate-50 transition-colors group cursor-pointer"
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-full uppercase tracking-wider border border-sky-100">
                      {item.category}
                    </span>
                    <span className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Calendar size={10} />
                      {item.date}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-slate-800 line-clamp-1 mb-1 group-hover:text-sky-600 transition-colors">
                    {item.title}
                  </h3>
                  {item.summary && (
                    <p className="text-xs text-slate-500 line-clamp-2 mb-2">
                      {item.summary}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-2">
                    <div className="flex items-center gap-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                      <span className="text-[10px] text-slate-400 capitalize">{item.status === 'published' ? 'Publicada' : 'Rascunho'}</span>
                    </div>
                    {item.url && (
                      <div 
                        onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                        className="text-slate-300 hover:text-sky-500 opacity-0 group-hover:opacity-100 transition-all cursor-pointer p-1"
                        title="Ver original"
                      >
                        <ExternalLink size={14} />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-500 flex flex-col items-center justify-center h-full">
              <div className="bg-slate-50 p-3 rounded-full mb-3">
                <FileText size={24} className="text-slate-300" />
              </div>
              <p className="text-sm mb-4">Nenhuma notícia encontrada.</p>
              <Link to="/calendar" className="text-xs text-sky-600 hover:underline">
                 Adicionar Notícia
              </Link>
            </div>
          )}
        </div>
      </div>

      <EditNewsModal 
        isOpen={!!editingNews}
        newsItem={editingNews}
        onClose={() => setEditingNews(null)}
        onUpdate={handleUpdate}
        onDelete={handleDelete}
        onCreatePost={onCreatePost}
        user={user}
      />
    </>
  );
};
