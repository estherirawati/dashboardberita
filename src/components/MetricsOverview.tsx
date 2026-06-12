import React from "react";
import { TrendingUp, MessageSquare, Heart, Shield, Zap } from "lucide-react";
import { InstagramPost } from "../types";

interface MetricsOverviewProps {
  posts: InstagramPost[];
  viralCount: number;
  onClearViralAlerts: () => void;
}

export const MetricsOverview: React.FC<MetricsOverviewProps> = ({ 
  posts, 
  viralCount,
  onClearViralAlerts
}) => {
  const totalLikes = posts.reduce((sum, p) => sum + p.likes, 0);
  const totalComments = posts.reduce((sum, p) => sum + p.comments, 0);
  const avgEngagement = posts.length > 0 
    ? (posts.reduce((sum, p) => sum + p.engagementRate, 0) / posts.length).toFixed(2)
    : "0.00";

  // Identify top category by likes
  const categoryLikesMap: Record<string, number> = {};
  posts.forEach((p) => {
    categoryLikesMap[p.category] = (categoryLikesMap[p.category] || 0) + p.likes;
  });
  
  let peningkatUtama = "N/A";
  let maxLikes = -1;
  Object.entries(categoryLikesMap).forEach(([cat, lks]) => {
    if (lks > maxLikes) {
      maxLikes = lks;
      peningkatUtama = cat;
    }
  });

  return (
    <div className="space-y-6">
      {/* Viral Alert Bar - Editorial Notice Style */}
      {viralCount > 0 && (
        <div id="viral-alert-bar" className="flex flex-col md:flex-row items-start md:items-center justify-between p-5 bg-red-50 border-l-4 border-[#C41E3A] border-y border-r border-[#C41E3A]/20 rounded-none shadow-sm animate-pulse">
          <div className="flex items-start space-x-3 mb-3 md:mb-0">
            <div className="p-2.5 bg-[#C41E3A] text-white">
              <Zap className="h-5 w-5 fill-white" />
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wider text-[#C41E3A]">
                WARTA DARURAT: Tren Konten Viral Terdeteksi!
              </h4>
              <p className="text-xs text-slate-700 font-sans mt-0.5">
                Ruang siber mengidentifikasi <strong>{viralCount} postingan</strong> dengan interaksi di atas batas rata-rata (Likes &gt; 800 atau ER &gt; 10%). Segera lakukan evaluasi ruang redaksi dan disiplin verifikasi di lapangan.
              </p>
            </div>
          </div>
          <button 
            id="btn-dismiss-viral"
            onClick={onClearViralAlerts}
            className="text-[10px] tracking-widest font-bold uppercase bg-black hover:bg-[#C41E3A] text-white py-2 px-4 transition-colors shrink-0 font-mono cursor-pointer"
          >
            Tandai Dibaca
          </button>
        </div>
      )}

      {/* Grid of Metrics - Crisp Newspaper Columns style */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-black/10 border border-black/15 shadow-sm">
        {/* Total Post */}
        <div className="bg-white p-6 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-black/50 tracking-widest font-sans">Total Postingan Jatim</p>
            <h3 className="text-4xl font-serif font-bold text-[#1A1A1A]">{posts.length}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] border-t border-black/5 pt-2">
            <span className="text-black/40 font-mono font-bold uppercase">Saringan Otomatis</span>
            <span className="text-[#C41E3A] font-bold text-[11px]">&gt; 10 Likes</span>
          </div>
        </div>

        {/* Total Likes */}
        <div className="bg-white p-6 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-black/50 tracking-widest font-sans">Akumulasi Suka publik</p>
            <h3 className="text-4xl font-serif font-bold text-[#1A1A1A]">{totalLikes.toLocaleString("id-ID")}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between text-[11px] border-t border-black/5 pt-2 font-mono">
            <span className="text-emerald-700 font-bold flex items-center gap-1">
              <Heart className="h-3 w-3 fill-emerald-700 stroke-none" /> +{totalComments.toLocaleString("id-ID")} Komentar
            </span>
          </div>
        </div>

        {/* Engagement Rate */}
        <div className="bg-white p-6 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-black/50 tracking-widest font-sans">Rerata Keterlibatan</p>
            <h3 className="text-4xl font-serif font-bold text-[#C41E3A]">{avgEngagement}%</h3>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] border-t border-black/5 pt-2">
            <span className="text-black/40 font-mono font-bold uppercase">Total Views &amp; Komentar</span>
            <span className="text-[#C41E3A] font-bold uppercase font-mono text-[9px]">Sangat Sehat</span>
          </div>
        </div>

        {/* Top News Category */}
        <div className="bg-white p-6 flex flex-col justify-between">
          <div className="space-y-1.5">
            <p className="text-[10px] uppercase font-bold text-black/50 tracking-widest font-sans">Kategori Terpopuler</p>
            <h3 className="text-2xl font-black uppercase text-[#1A1A1A] truncate max-w-full font-sans tracking-tight">{peningkatUtama}</h3>
          </div>
          <div className="mt-4 flex items-center justify-between text-[10px] border-t border-black/5 pt-2">
            <span className="text-black/40 font-mono font-bold uppercase">Indikasi Tren Utama</span>
            <span className="text-purple-700 font-bold uppercase font-mono text-[9px] flex items-center gap-1">
              <MessageSquare className="h-3 w-3" /> Suka Pembaca
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
