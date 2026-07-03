
import React, { useState, useEffect } from 'react';
import { Image as ImageIcon, Video, Loader2, Calendar, PlayCircle, Info, Download, ExternalLink, X, ChevronLeft, ChevronRight, Save } from 'lucide-react';
import { User, GeneratedContent } from '../types';
import { getUserContent } from '../services/contentService';

interface GalleryPageProps {
  user: User;
}

const GalleryPage: React.FC<GalleryPageProps> = ({ user }) => {
  const [items, setItems] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'image' | 'video'>('all');
  const [selectedItem, setSelectedItem] = useState<GeneratedContent | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const fetchContent = async () => {
    setLoading(true);
    try {
      const data = await getUserContent(user.id);
      setItems(data);
    } catch (error: any) {
      console.error("Erro ao carregar galeria:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchContent();
    }
  }, [user]);

  const isYoutubeUrl = (url: string | undefined) => {
    if (!url) return false;
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYoutubeThumbnail = (url: string | undefined) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = url.match(regExp);
    const id = (match && match[2].length === 11) ? match[2] : null;
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : null;
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Date(dateStr).toLocaleDateString('pt-BR');
    } catch (e) {
      return dateStr;
    }
  };

  const handleDownload = async (url: string, type: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setDownloadingId(id);
    
    try {
      // Tenta baixar via Fetch para permitir renomeação de arquivo
      const response = await fetch(url);
      
      if (!response.ok) throw new Error('CORS or Network Error');

      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      const extension = type === 'video' ? 'mp4' : 'png';
      link.download = `creathub-${type}-${Date.now()}.${extension}`;
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback amigável se o CORS bloquear o Fetch
      console.warn("Download via Blob bloqueado por CORS. Abrindo link direto...", error);
      
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.setAttribute('download', `creathub-${type}-${Date.now()}`);
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      setDownloadingId(null);
    }
  };

  const filteredItems = items.filter(item => {
    if (filter !== 'all' && item.type !== filter) return false;
    try {
      // Lógica de filtro para os últimos 15 dias
      const itemDate = new Date(item.created_at);
      const limitDate = new Date();
      limitDate.setDate(limitDate.getDate() - 15);
      limitDate.setHours(0, 0, 0, 0);
      return itemDate >= limitDate;
    } catch (e) {
      return true;
    }
  });

  return (
    <div className="animate-fade-in space-y-6 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <ImageIcon className="text-sky-500" /> Minha Galeria
          </h1>
          <div className="flex items-center gap-2 mt-1">
             <Calendar size={14} className="text-sky-400" />
             <p className="text-slate-500 text-sm">
                Exibindo criações dos <strong>últimos 15 dias</strong>
             </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-white p-1 rounded-lg border border-slate-200 shadow-sm">
           <button 
             onClick={() => setFilter('all')} 
             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors ${filter === 'all' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             Todos
           </button>
           <button 
             onClick={() => setFilter('image')} 
             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${filter === 'image' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <ImageIcon size={14} /> Imagens
           </button>
           <button 
             onClick={() => setFilter('video')} 
             className={`px-4 py-1.5 rounded-md text-sm font-medium transition-colors flex items-center gap-1 ${filter === 'video' ? 'bg-sky-500 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
           >
             <Video size={14} /> Vídeos
           </button>
        </div>
      </div>

      <div className="bg-sky-50 border border-sky-100 rounded-xl p-3 flex items-center gap-3 text-sky-700 text-xs">
         <Info size={16} className="shrink-0" />
         <p>Para baixar o conteúdo, clique no ícone de download. Se o download não iniciar automaticamente, o arquivo será aberto em uma nova aba para você salvar.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-sky-500 animate-spin mb-2" />
          <p className="text-slate-400 text-sm">Sincronizando galeria...</p>
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredItems.map((item) => {
            const isYoutube = isYoutubeUrl(item.url);

            return (
              <div 
                key={item.id} 
                className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm transition-all hover:shadow-md flex flex-col group relative"
              >
                 <div 
                   onClick={() => setSelectedItem(item)}
                   className="aspect-square bg-slate-50 relative overflow-hidden cursor-pointer"
                 >
                    {item.type === 'video' ? (
                      isYoutube ? (
                        <div className="w-full h-full relative">
                           <img src={getYoutubeThumbnail(item.url) || ''} className="w-full h-full object-cover" alt="YT" />
                           <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <PlayCircle size={48} className="text-white opacity-80" />
                           </div>
                        </div>
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-slate-900">
                           <video src={item.url} className="w-full h-full object-cover opacity-80" />
                           <PlayCircle size={32} className="absolute text-white/50" />
                        </div>
                      )
                    ) : (
                      <img 
                        src={item.url} 
                        alt="Conteúdo" 
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
                      />
                    )}
                    
                    <div className="absolute top-3 left-3 flex gap-2">
                       <span className={`text-[10px] font-bold px-2 py-1 rounded-lg text-white shadow-sm ${item.type === 'video' ? 'bg-purple-600' : 'bg-sky-600'}`}>
                         {item.type === 'video' ? 'VÍDEO' : 'IMAGEM'}
                       </span>
                    </div>

                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                        <div className="bg-white/90 backdrop-blur-sm text-slate-800 text-xs font-bold px-4 py-2 rounded-full shadow-lg flex items-center gap-2">
                           <PlayCircle size={14} /> Abrir
                        </div>
                    </div>
                 </div>

                 <div className="p-4 relative">
                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mb-1">{formatDate(item.created_at)}</p>
                    <p className="text-xs text-slate-600 font-medium line-clamp-1 leading-relaxed mb-3 pr-8">
                       {item.prompt || (item.type === 'video' ? 'Conteúdo em Vídeo' : 'Imagem de Marketing')}
                    </p>

                    {!isYoutube && (
                      <button 
                        onClick={(e) => handleDownload(item.url, item.type, item.id, e)}
                        disabled={downloadingId === item.id}
                        className="absolute bottom-4 right-4 p-2 text-slate-400 hover:text-sky-600 hover:bg-sky-50 rounded-full transition-all"
                        title="Baixar arquivo"
                      >
                        {downloadingId === item.id ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
                      </button>
                    )}
                    {isYoutube && (
                      <button 
                        onClick={(e) => { e.stopPropagation(); window.open(item.url, '_blank'); }}
                        className="absolute bottom-4 right-4 p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-all"
                        title="Ver no YouTube"
                      >
                        <ExternalLink size={18} />
                      </button>
                    )}
                 </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-80 bg-white rounded-3xl border-2 border-dashed border-slate-100">
           <div className="bg-slate-50 p-4 rounded-full mb-4">
             <ImageIcon size={40} className="text-slate-200" />
           </div>
           <p className="text-slate-500 font-bold">Nenhum conteúdo recente</p>
           <p className="text-slate-400 text-xs mt-1">Você não gerou arquivos nos últimos 15 dias.</p>
        </div>
      )}

      {/* Modal de Visualização */}
      {selectedItem && (
        <div 
          className="fixed inset-0 z-[100] bg-black/95 flex flex-col items-center justify-center p-4 md:p-8 backdrop-blur-md animate-fade-in"
          onClick={() => setSelectedItem(null)}
        >
           <div className="absolute top-6 right-6 flex items-center gap-4 z-[110]">
              {!isYoutubeUrl(selectedItem.url) && (
                <button 
                  onClick={(e) => handleDownload(selectedItem.url, selectedItem.type, selectedItem.id, e)}
                  disabled={downloadingId === selectedItem.id}
                  className="bg-sky-500 hover:bg-sky-600 text-white px-6 py-3 rounded-full transition-all shadow-xl flex items-center gap-2 group"
                  title="Salvar no dispositivo"
                >
                  {downloadingId === selectedItem.id ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Save size={20} className="group-hover:scale-110 transition-transform" />
                  )}
                  <span className="text-sm font-bold">
                    {selectedItem.type === 'video' ? 'Baixar Vídeo' : 'Baixar Imagem'}
                  </span>
                </button>
              )}
              <button 
                onClick={() => setSelectedItem(null)}
                className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-full transition-all border border-white/20"
                title="Fechar"
              >
                <X size={24} />
              </button>
           </div>

           <div 
             className="relative max-w-5xl w-full h-full flex flex-col items-center justify-center"
             onClick={(e) => e.stopPropagation()}
           >
              {selectedItem.type === 'video' ? (
                isYoutubeUrl(selectedItem.url) ? (
                  <iframe 
                    src={selectedItem.url.replace('watch?v=', 'embed/')} 
                    className="w-full aspect-video rounded-2xl shadow-2xl"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                ) : (
                  <video 
                    src={selectedItem.url} 
                    controls 
                    autoPlay 
                    className="max-w-full max-h-[70vh] rounded-2xl shadow-2xl border border-white/10" 
                  />
                )
              ) : (
                <img 
                  src={selectedItem.url} 
                  className="max-w-full max-h-[75vh] object-contain rounded-2xl shadow-2xl border border-white/10" 
                  alt="Full view" 
                />
              )}

              <div className="mt-8 text-center max-w-3xl">
                 <div className="flex items-center justify-center gap-2 mb-3">
                    <span className={`text-xs font-bold px-3 py-1 rounded-full text-white shadow-sm ${selectedItem.type === 'video' ? 'bg-purple-600' : 'bg-sky-600'}`}>
                        {selectedItem.type === 'video' ? 'VÍDEO GERADO' : 'IMAGEM GERADA'}
                    </span>
                    <span className="text-white/40 text-xs font-medium">| {formatDate(selectedItem.created_at)}</span>
                 </div>
                 <p className="text-white/80 text-sm leading-relaxed italic">
                    "{selectedItem.prompt || 'Sem descrição disponível'}"
                 </p>
                 
                 {isYoutubeUrl(selectedItem.url) && (
                    <a 
                      href={selectedItem.url} 
                      target="_blank" 
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 mt-6 bg-red-600 hover:bg-red-700 text-white px-6 py-2.5 rounded-full text-sm font-bold transition-all"
                    >
                      <ExternalLink size={16} /> Assistir no YouTube
                    </a>
                 )}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default GalleryPage;
