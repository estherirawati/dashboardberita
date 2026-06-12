import React, { useMemo } from "react";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  Cell
} from "recharts";
import { InstagramPost } from "../types";
import { BarChart3, LineChart as LineIcon } from "lucide-react";

interface PerformanceChartsProps {
  posts: InstagramPost[];
}

export const PerformanceCharts: React.FC<PerformanceChartsProps> = ({ posts }) => {
  // 1. Process Timeline Data for weekly line chart (Group by Day)
  const timelineData = useMemo(() => {
    const dailyMap: Record<string, { dateLabel: string; likes: number; comments: number; count: number; dateObject: Date }> = {};
    
    posts.forEach((post) => {
      const d = new Date(post.publishedAt);
      // Format to DD/MM
      const day = d.getDate();
      const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agt", "Sep", "Okt", "Nov", "Des"];
      const label = `${day} ${monthNames[d.getMonth()]}`;
      const sortKey = d.toISOString().split("T")[0]; // YYYY-MM-DD for sorting
      
      if (!dailyMap[sortKey]) {
        dailyMap[sortKey] = {
          dateLabel: label,
          likes: 0,
          comments: 0,
          count: 0,
          dateObject: d
        };
      }
      
      dailyMap[sortKey].likes += post.likes;
      dailyMap[sortKey].comments += post.comments;
      dailyMap[sortKey].count += 1;
    });

    // Sort chronologically
    return Object.keys(dailyMap)
      .sort((a, b) => a.localeCompare(b))
      .map(key => ({
        name: dailyMap[key].dateLabel,
        "Jumlah Suka": dailyMap[key].likes,
        "Jumlah Komentar": dailyMap[key].comments,
        "Rata-rata Keterlibatan": parseFloat((dailyMap[key].likes / dailyMap[key].count).toFixed(0))
      }));
  }, [posts]);

  // 2. Process Category Comparison Data for bar chart
  const categoryData = useMemo(() => {
    const categoryTotals: Record<string, { likesSum: number; commentsSum: number; erSum: number; count: number }> = {};
    
    posts.forEach((post) => {
      if (!categoryTotals[post.category]) {
        categoryTotals[post.category] = {
          likesSum: 0,
          commentsSum: 0,
          erSum: 0,
          count: 0
        };
      }
      categoryTotals[post.category].likesSum += post.likes;
      categoryTotals[post.category].commentsSum += post.comments;
      categoryTotals[post.category].erSum += post.engagementRate;
      categoryTotals[post.category].count += 1;
    });

    return Object.entries(categoryTotals).map(([cat, total]) => ({
      category: cat,
      "Rerata Suka (Likes)": Math.round(total.likesSum / total.count),
      "Rerata Keterlibatan (%)": parseFloat((total.erSum / total.count).toFixed(2)),
      count: total.count
    }));
  }, [posts]);

  // Custom colors for specific news categories
  const barColors = {
    Politik: "#3b82f6", // Blue
    Surabaya: "#10b981", // Emerald
    Sidoarjo: "#f59e0b", // Amber
    Olahraga: "#ec4899", // Pink
    Kriminal: "#ef4444", // Red
    Ekonomi: "#8b5cf6"  // Purple
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* 1. Line Chart: Weekly performance timeline */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <LineIcon className="h-5 w-5 text-blue-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Siklus Performa Mingguan</h3>
            <p className="text-[11px] text-slate-400">Total interaksi jurnalisme per hari tayang instagram</p>
          </div>
        </div>
        <div className="h-72 w-full pt-2">
          {timelineData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Tidak ada data yang tersedia
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={timelineData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  stroke="#cbd5e1"
                />
                <YAxis tick={{ fontSize: 10, fill: "#64748b" }} stroke="#cbd5e1" />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0" 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Line 
                  type="monotone" 
                  dataKey="Jumlah Suka" 
                  stroke="#3b82f6" 
                  strokeWidth={2.5} 
                  activeDot={{ r: 6 }} 
                  dot={{ r: 3 }}
                />
                <Line 
                  type="monotone" 
                  dataKey="Jumlah Komentar" 
                  stroke="#10b981" 
                  strokeWidth={2.5} 
                  dot={{ r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2. Bar Chart: Category comparison */}
      <div className="bg-white p-5 rounded-xl border border-slate-100 shadow-sm space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <BarChart3 className="h-5 w-5 text-purple-600" />
          <div>
            <h3 className="text-sm font-semibold text-slate-800">Evaluasi Performa Antar Kategori Berita</h3>
            <p className="text-[11px] text-slate-400">Rata-rata respon pembaca berdasarkan klasifikasi berita</p>
          </div>
        </div>
        <div className="h-72 w-full pt-2">
          {categoryData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              Tidak ada data kategori terhitung
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData} margin={{ bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis 
                  dataKey="category" 
                  tick={{ fontSize: 10, fill: "#64748b" }}
                  stroke="#cbd5e1"
                />
                <YAxis 
                  tick={{ fontSize: 10, fill: "#64748b" }} 
                  stroke="#cbd5e1"
                />
                <Tooltip 
                  contentStyle={{ 
                    fontSize: "12px", 
                    borderRadius: "8px", 
                    border: "1px solid #e2e8f0" 
                  }} 
                />
                <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                <Bar dataKey="Rerata Suka (Likes)" fill="#8b5cf6" radius={[4, 4, 0, 0]}>
                  {categoryData.map((entry, index) => {
                    const color = barColors[entry.category as keyof typeof barColors] || "#8b5cf6";
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
                <Bar dataKey="Rerata Keterlibatan (%)" fill="#64748b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
        <div className="grid grid-cols-3 gap-2 pt-1">
          {categoryData.map((item) => {
            const color = barColors[item.category as keyof typeof barColors] || "#8b5cf6";
            return (
              <div key={item.category} className="text-center p-1.5 bg-slate-50 rounded-lg">
                <span className="text-[10px] font-bold block" style={{ color }}>
                  {item.category}
                </span>
                <span className="text-xs font-semibold text-slate-700">
                  {item.count} Post
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
