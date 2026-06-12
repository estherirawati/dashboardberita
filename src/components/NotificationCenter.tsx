import React, { useState, useEffect, useRef } from "react";
import { Bell, Zap, Sparkles, Check, Trash2, Clock, Inbox, AlertTriangle } from "lucide-react";
import { ContentRecommendation, InstagramPost } from "../types";

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  type: "viral" | "recommendation" | "system";
  timestamp: string;
  read: boolean;
  linkId?: string; // e.g. post ID or recommendation target
}

interface NotificationCenterProps {
  posts: InstagramPost[];
  recs: ContentRecommendation[];
  onSelectPost?: (id: string) => void;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({
  posts,
  recs,
  onSelectPost
}) => {
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Sync / generate notifications from viral posts and incoming recommendations
  useEffect(() => {
    const list: NotificationItem[] = [];

    // System bootstrap notification
    list.push({
      id: "notif_sys_init",
      title: "Sistem Redaksi Terhubung",
      message: "Dashboard jurnalisme siber Beritajatim.com terkoneksi secara real-time ke Firestore Surabaya.",
      type: "system",
      timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
      read: true
    });

    // Viral posts notifications (likes > 800 or high ER)
    const activeViral = posts.filter(p => p.likes >= 10 && (p.likes > 800 || p.engagementRate > 10));
    activeViral.forEach(post => {
      list.push({
        id: `notif_viral_${post.id}`,
        title: "🚨 Alert Konten Viral",
        message: `Postingan [${post.category}] melesat cepat dengan akumulasi ${post.likes} Suka dan ${post.engagementRate}% ER! Mohon lakukan tinjauan redaksional segera.`,
        type: "viral",
        timestamp: post.publishedAt || new Date().toISOString(),
        read: false,
        linkId: post.id
      });
    });

    // Recommendations notifications
    if (recs && recs.length > 0) {
      recs.forEach((rec, idx) => {
        list.push({
          id: `notif_rec_${idx}`,
          title: `💡 Rekomendasi AI: ${rec.title}`,
          message: `Saran liputan anyar kategori ${rec.category}. Prakiraan potensi jangkauan: ${rec.potentialReach} dengan tingkat presisi ${rec.confidence}.`,
          type: "recommendation",
          timestamp: new Date().toISOString(),
          read: false,
          linkId: `rec-card-${idx}`
        });
      });
    }

    // Set combined state
    setNotifications(list);
  }, [posts.length, recs]);

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(n => n.id === id ? { ...n, read: true } : n)
    );
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    setNotifications([]);
  };

  const handleNotificationClick = (notif: NotificationItem) => {
    handleMarkAsRead(notif.id);
    
    if (notif.linkId) {
      if (notif.type === "viral" && onSelectPost) {
        onSelectPost(notif.linkId);
        // Scroll to post detail
        const element = document.getElementById(`post-row-${notif.linkId}`);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else if (notif.type === "recommendation") {
        const element = document.getElementById(notif.linkId);
        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      }
    }
    setIsOpen(false);
  };

  const formatTimeDifference = (isoString: string) => {
    const now = new Date();
    const then = new Date(isoString);
    const diffMs = now.getTime() - then.getTime();
    const diffSec = Math.floor(diffMs / 1000);
    const diffMin = Math.floor(diffSec / 60);
    
    if (diffMin < 1) return "Baru Saja";
    if (diffMin < 60) return `${diffMin} menit lalu`;
    
    const diffHrs = Math.floor(diffMin / 60);
    if (diffHrs < 24) return `${diffHrs} jam lalu`;
    
    return then.toLocaleDateString("id-ID", { day: "numeric", month: "short" });
  };

  return (
    <div id="notification-center-dropdown" className="relative" ref={containerRef}>
      
      {/* Bell Button */}
      <button
        id="btn-bell-notification"
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 border-2 border-black bg-white hover:bg-[#FAF9F6] text-[#1A1A1A] rounded-none cursor-pointer transition-colors"
        aria-label="Pemberitahuan Redaksi"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span 
            id="notif-badge-count" 
            className="absolute -top-1.5 -right-1.5 bg-[#C41E3A] text-white text-[8px] font-mono leading-none py-0.5 px-1.5 rounded-full border border-white font-extrabold flex items-center justify-center animate-pulse"
          >
            {unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown List */}
      {isOpen && (
        <div 
          id="notif-dropdown-content" 
          className="absolute right-0 mt-2.5 w-80 max-w-sm bg-white border-2 border-black rounded-none shadow-lg z-50 overflow-hidden text-[#1A1A1A]"
        >
          {/* Header */}
          <div className="bg-[#FAF9F6] p-3.5 border-b-2 border-black flex items-center justify-between">
            <div className="flex items-center space-x-1.5">
              <Bell className="h-4 w-4 text-[#C41E3A]" />
              <span className="text-xs font-serif font-bold uppercase tracking-wide">Pusat Alert &amp; Notif</span>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[9px] uppercase tracking-wider font-mono font-black text-[#C41E3A] hover:underline"
              >
                Sapu Semua Dibaca
              </button>
            )}
          </div>

          {/* List content */}
          <div className="max-h-[340px] overflow-y-auto divide-y divide-black/5">
            {notifications.length === 0 ? (
              <div className="py-12 px-4 text-center text-black/40 font-serif italic text-xs space-y-2">
                <Inbox className="h-6 w-6 text-black/20 mx-auto" />
                <p>Kotak masuk Anda bersih.</p>
                <p className="text-[10px] leading-relaxed">Belum ada konten viral atau rekomendasi anyar.</p>
              </div>
            ) : (
              notifications.map((notif) => (
                <div 
                  key={notif.id}
                  id={`notif-item-${notif.id}`}
                  onClick={() => handleNotificationClick(notif)}
                  className={`p-3.5 hover:bg-slate-50 transition-colors cursor-pointer relative ${
                    !notif.read ? "bg-red-50/10 border-l-4 border-[#C41E3A]" : "opacity-80"
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    
                    {/* Icon of type */}
                    <div className="mt-0.5 shrink-0">
                      {notif.type === "viral" ? (
                        <Zap className="h-3.5 w-3.5 text-[#C41E3A] fill-[#C41E3A]" />
                      ) : notif.type === "recommendation" ? (
                        <Sparkles className="h-3.5 w-3.5 text-emerald-650 fill-emerald-100" />
                      ) : (
                        <Check className="h-3.5 w-3.5 text-blue-600" />
                      )}
                    </div>

                    <div className="space-y-1 text-left flex-1">
                      <div className="flex items-baseline justify-between gap-1">
                        <span className="text-[10px] font-sans font-extrabold text-[#1A1A1A] leading-tight">
                          {notif.title}
                        </span>
                        {!notif.read && (
                          <span className="h-1.5 w-1.5 rounded-full bg-[#C41E3A] shrink-0" />
                        )}
                      </div>
                      <p className="text-[10px] text-slate-650 leading-relaxed font-sans font-light">
                        {notif.message}
                      </p>
                      
                      <div className="flex items-center gap-1 text-[8px] text-black/30 font-mono">
                        <Clock className="h-2 w-2" />
                        <span>{formatTimeDifference(notif.timestamp)}</span>
                      </div>
                    </div>

                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer menu */}
          {notifications.length > 0 && (
            <div className="bg-[#FAF9F6] p-2.5 border-t border-black/10 text-center">
              <button
                onClick={handleClearAll}
                className="text-[9px] uppercase tracking-wider font-mono font-bold text-black/55 hover:text-black flex items-center justify-center gap-1 mx-auto"
              >
                <Trash2 className="h-2.5 w-2.5" />
                <span>Bersihkan Riwayat</span>
              </button>
            </div>
          )}

        </div>
      )}

    </div>
  );
};
