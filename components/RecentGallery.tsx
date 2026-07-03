
import React, { useEffect, useState } from 'react';
import { Image as ImageIcon, ArrowRight, Loader2, ImagePlus, Video, PlayCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { User, GeneratedContent } from '../types';
import { getRecentMedia } from '../services/contentService';

interface RecentGalleryProps {
  user: User;
}

export const RecentGallery: React.FC<RecentGalleryProps> = ({ user }) => {
  const [media, setMedia] = useState<GeneratedContent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      const fetchMedia = async () => {
        setLoading(true);
        try {
          const data = await getRecentMedia(user.id, 3);
          setMedia(data);
        } catch (error) {
          console.error("Failed to fetch recent media", error);
        } finally {
          setLoading(false);
        }
      };
      fetchMedia();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 min-h-[200px] flex items-center justify-center">
        <Loader2 className="animate-spin text-sky-500" size={24} />
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden flex flex-col h-full animate-fade-in">
      <div className="p-6 border-b border-slate-100 flex justify-between items-center">
        <h2 className="font-bold text-slate-800 text-lg flex items-center gap-2">
          <ImageIcon size={20} className="text-purple-500" />
          Galeria Recente
        </h2>
        <Link to="/gallery" className="text-sm text-sky-500 hover:text-sky-600 font-medium flex items-center gap-1">
          Ver todas <ArrowRight size={16} />
        </Link>
      </div>

      <div className="p-6">
        {media.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {media.map((item) => (
              <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden border border-slate-100 shadow-sm bg-slate-50 cursor-pointer">
                {item.type === 'video' ? (
                  <div className="w-full h-full relative bg-slate-900 flex items-center justify-center">
                     <video 
                       src={item.url} 
                       className="w-full h-full object-cover opacity-90 transition-transform duration-500 group-hover:scale-105"
                       muted
                       loop
                       playsInline
                       onMouseEnter={(e) => {
                         const video = e.currentTarget;
                         // Handle the play promise to prevent the interruption error in the console
                         const playPromise = video.play();
                         if (playPromise !== undefined) {
                           playPromise.catch(() => {
                             // Interruption handled: ignore the error that occurs when pause() is called 
                             // before play() completes.
                           });
                         }
                       }}
                       onMouseLeave={(e) => {
                         const video = e.currentTarget;
                         video.pause();
                         video.currentTime = 0;
                       }}
                     />
                     <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <PlayCircle size={32} className="text-white/80 drop-shadow-md" />
                     </div>
                     <div className="absolute top-2 left-2 bg-purple-500/90 backdrop-blur-sm text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full flex items-center gap-1 z-10 shadow-sm">
                        <Video size={9} /> VÍDEO
                     </div>
                  </div>
                ) : (
                  <img 
                    src={item.url} 
                    alt={item.prompt || "Imagem gerada"} 
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-3 pointer-events-none">
                   <p className="text-white text-xs line-clamp-2 font-medium leading-snug">
                     {item.prompt || "Conteúdo sem descrição"}
                   </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500 flex flex-col items-center justify-center">
            <div className="bg-slate-50 p-3 rounded-full mb-3">
              <ImagePlus size={24} className="text-slate-300" />
            </div>
            <p className="text-sm">Nenhum conteúdo criado recentemente.</p>
          </div>
        )}
      </div>
    </div>
  );
};
