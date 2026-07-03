
import React, { useState, useEffect } from 'react';
import { Plus, Filter, FileText, Loader2, ExternalLink, RefreshCw, Trash2, Edit, Calendar as CalendarIcon, CheckCircle2, Circle, X } from 'lucide-react';
import { User, NewsItem } from '../types';
import { getUserNews, subscribeToNews, deleteNews } from '../services/newsService';
import { EditNewsModal } from '../components/Modals';

interface CalendarPageProps {
  onAddNews: () => void;
  onCreatePost?: (tab: any, prompt: string) => void;
  user: User;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ onAddNews, onCreatePost, user }) => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingNews, setEditingNews] = useState<NewsItem | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Filtros
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  
  const loadNews = async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const data = await getUserNews(user.id);
      setNews(data);
    } catch (error: any) {
      console.error("Erro ao carregar notícias:", error);
      setErrorMsg("Não foi possível carregar as notícias no momento.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadNews();
      const subscription = subscribeToNews(user.id, (newItem) => {
        setNews(prev => {
           const exists = prev.find(p => p.id === newItem.id);
           if (exists) {
             return prev.map(p => p.id === newItem.id ? newItem : p);
           }
           return [newItem, ...prev];
        });
      });
      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    
    if (window.confirm('Tem certeza que deseja excluir esta notícia? Esta ação não pode ser desfeita.')) {
      try {
        await deleteNews(id);
        setNews(prev => prev.filter(item => item.id !== id));
        if (editingNews?.id === id) {
          setEditingNews(null);
        }
      } catch (error: any) {
        console.error("Erro ao excluir", error);
        alert(`Erro ao excluir notícia: ${error.message || 'Erro desconhecido'}`);
      }
    }
  };

  const handleUpdateLocal = (updatedItem: NewsItem) => {
    setNews(prev => prev.map(item => item.id === updatedItem.id ? updatedItem : item));
  };

  const stats = {
    total: news.length,
    published: news.filter(n => n.status === 'published').length,
    drafts: news.filter(n => n.status === 'draft').length
  };

  const filteredNews = news.filter(item => {
    const matchesCategory = categoryFilter === 'all' || categoryFilter === 'Todas categorias' || item.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || item.status === statusFilter;
    return matchesCategory && matchesStatus;
  });

  return (
    <div className="h-[calc(100vh-140px)] animate-fade-in flex flex-col">
      <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-4 md:p-6 flex flex-col h-full overflow-hidden">
         <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-4 shrink-0">
            <div className="flex items-center gap-3">
               <div className="bg-sky-50 p-2 rounded-lg text-sky-600 hidden md:block">
                  <FileText size={20} />
               </div>
               <div>
                  <h2 className="text-xl font-bold text-slate-800">Gerenciador de Notícias</h2>
                  <div className="flex items-center gap-3 text-xs mt-1">
                     <span className="text-slate-500 font-medium bg-slate-100 px-2 py-0.5 rounded-full">
                       Total: {stats.total}
                     </span>
                     <span className="text-green-600 font-medium bg-green-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                       <CheckCircle2 size={10} /> Publicadas: {stats.published}
                     </span>
                     <span className="text-amber-600 font-medium bg-amber-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                       <Circle size={10} /> Rascunhos: {stats.drafts}
                     </span>
                  </div>
               </div>
            </div>
            
            <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full xl:w-auto">
               <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                   <div className="relative min-w-[150px] flex-1 md:flex-none">
                     <Filter size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                     <select 
                        value={categoryFilter}
                        onChange={(e) => setCategoryFilter(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-sky-200 appearance-none cursor-pointer hover:border-sky-300 transition-colors"
                     >
                         <option value="all">Todas categorias</option>
                         <option value="Tecnologia">Tecnologia</option>
                         <option value="Negócios">Negócios</option>
                         <option value="Saúde">Saúde</option>
                         <option value="Educação">Educação</option>
                         <option value="Entretenimento">Entretenimento</option>
                         <option value="Esportes">Esportes</option>
                         <option value="Política">Política</option>
                         <option value="Ciência">Ciência</option>
                     </select>
                   </div>

                   <div className="relative min-w-[130px] flex-1 md:flex-none">
                     <div className={`absolute left-3 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full ${statusFilter === 'published' ? 'bg-green-500' : statusFilter === 'draft' ? 'bg-amber-400' : 'bg-slate-300'}`}></div>
                     <select 
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value as any)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-8 pr-3 py-2 text-xs text-slate-600 outline-none focus:ring-2 focus:ring-sky-200 appearance-none cursor-pointer hover:border-sky-300 transition-colors"
                     >
                         <option value="all">Todos status</option>
                         <option value="published">Publicadas</option>
                         <option value="draft">Rascunhos</option>
                     </select>
                   </div>
               </div>

               <div className="flex items-center gap-2 ml-auto w-full md:w-auto justify-end">
                   <button 
                     onClick={onAddNews}
                     className="bg-sky-500 hover:bg-sky-600 text-white px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-sky-200 transition-all hover:scale-[1.02] whitespace-nowrap"
                   >
                     <Plus size={16} />
                     Nova Notícia
                   </button>

                   <button 
                    onClick={loadNews}
                    className="p-2 text-slate-400 hover:text-sky-500 hover:bg-sky-50 rounded-lg transition-all border border-transparent hover:border-slate-100"
                    title="Atualizar lista"
                  >
                    <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
                  </button>
               </div>
            </div>
         </div>

         <div className="flex-1 overflow-y-auto custom-scrollbar -mr-2 pr-2">
           {loading ? (
             <div className="flex flex-col items-center justify-center h-full">
               <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
               <p className="text-slate-400 text-sm font-medium">Sincronizando notícias...</p>
             </div>
           ) : filteredNews.length > 0 ? (
             <div className="flex flex-col gap-3 pb-2">
               {filteredNews.map((item) => (
                 <div key={item.id} className="w-full border border-slate-100 rounded-lg p-4 hover:border-sky-300 hover:shadow-md transition-all bg-white group animate-slide-in relative">
                   <div className="flex flex-col sm:flex-row gap-4">
                      <div className="flex-1 min-w-0">
                         <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="text-[10px] font-bold text-sky-600 bg-sky-50 px-2 py-0.5 rounded-md uppercase tracking-wider border border-sky-100">
                              {item.category}
                            </span>
                            <span className="text-[10px] text-slate-400 flex items-center gap-1">
                               <CalendarIcon size={10} />
                               {item.date}
                            </span>
                            <div className="flex items-center gap-1 ml-auto sm:ml-0">
                                <div className={`w-1.5 h-1.5 rounded-full ${item.status === 'published' ? 'bg-green-500' : 'bg-amber-400'}`}></div>
                                <span className="text-[10px] text-slate-500 capitalize font-medium">{item.status === 'published' ? 'Publicada' : 'Rascunho'}</span>
                            </div>
                         </div>
                         <div 
                             onClick={() => setEditingNews(item)}
                             className="cursor-pointer group-hover:text-sky-600 transition-colors mb-2"
                         >
                           <h3 className="text-base font-bold text-slate-800 leading-tight">
                             {item.title}
                           </h3>
                         </div>
                         {item.summary && (
                           <p className="text-slate-600 text-xs leading-relaxed mb-3 cursor-pointer text-justify" onClick={() => setEditingNews(item)}>
                             {item.summary}
                           </p>
                         )}
                         {item.url && (
                           <a href={item.url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[10px] text-sky-500 hover:underline">
                             Fonte original <ExternalLink size={10} />
                           </a>
                         )}
                      </div>
                      <div className="flex sm:flex-col items-center sm:items-end justify-end gap-2 border-t sm:border-t-0 sm:border-l border-slate-50 pt-3 sm:pt-0 sm:pl-4 shrink-0">
                         <button 
                           onClick={() => setEditingNews(item)}
                           className="flex items-center justify-center gap-1.5 text-slate-500 hover:text-sky-600 px-3 py-1.5 rounded-md hover:bg-sky-50 transition-colors text-xs font-medium bg-slate-50 sm:bg-transparent w-full sm:w-auto"
                         >
                           <Edit size={14} /> <span className="sm:hidden lg:inline">Editar</span>
                         </button>
                         <button 
                           onClick={(e) => handleDelete(item.id, e)}
                           className="flex items-center justify-center gap-1.5 text-slate-500 hover:text-red-500 px-3 py-1.5 rounded-md hover:bg-red-50 transition-colors text-xs font-medium bg-slate-50 sm:bg-transparent w-full sm:w-auto"
                         >
                           <Trash2 size={14} /> <span className="sm:hidden lg:inline">Excluir</span>
                         </button>
                      </div>
                   </div>
                 </div>
               ))}
             </div>
           ) : (
             <div className="flex flex-col items-center justify-center text-center p-8 h-full border-2 border-dashed border-slate-100 rounded-xl bg-slate-50/30">
                <FileText size={32} className="text-slate-300 mb-3" />
                <h3 className="text-sm font-bold text-slate-700 mb-1">Nenhum resultado</h3>
                <p className="text-xs text-slate-500 max-w-xs mb-4">
                   {errorMsg ? errorMsg : "Não encontramos notícias com os filtros selecionados."}
                </p>
                {(categoryFilter !== 'all' || statusFilter !== 'all') && (
                   <button 
                     onClick={() => { setCategoryFilter('all'); setStatusFilter('all'); }}
                     className="text-sky-500 hover:text-sky-600 text-xs font-medium hover:underline mb-2"
                   >
                     Limpar filtros
                   </button>
                )}
             </div>
           )}
         </div>
      </div>

      <EditNewsModal 
        isOpen={!!editingNews}
        newsItem={editingNews}
        onClose={() => setEditingNews(null)}
        onUpdate={handleUpdateLocal}
        onDelete={(id) => handleDelete(id)}
        onCreatePost={onCreatePost}
        user={user}
      />
    </div>
  );
};

export default CalendarPage;
