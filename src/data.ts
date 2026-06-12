export interface InstagramPost {
  id: string;
  caption: string;
  url: string;
  imageUrl: string;
  likes: number;
  comments: number;
  views: number;
  engagementRate: number;
  category: "Politik" | "Surabaya" | "Sidoarjo" | "Olahraga" | "Kriminal" | "Ekonomi";
  publishedAt: string; // ISO format or YYYY-MM-DD
  statusEvaluasi: "Belum Dievaluasi" | "Perlu Verifikasi" | "Layak Tayang" | "Sensasional" | "Arsip";
  verified: boolean;
  isViral: boolean;
}

export interface EditorialNote {
  id: string;
  postId: string;
  userId: string;
  username: string;
  userEmail: string;
  content: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  userId: string;
  username: string;
  userEmail: string;
  title: string;
  content: string;
  important: boolean;
  createdAt: string;
}

// Ensure all likes are >= 10, as demanded by the prompt ("Abaikan berita yang like nya di bawah 10")
export const INITIAL_INSTAGRAM_POSTS: InstagramPost[] = [
  {
    id: "post_1",
    caption: "KPU Jawa Timur gelar rapat koordinasi persiapan Pilkada Serentak 2026 tingkat provinsi di Surabaya. Fokus pada pemetaan kerawanan logistik dan keamanan siber di tingkat kabupaten. #PilkadaJatim #Surabaya #Beritajatim",
    url: "https://www.instagram.com/p/C_abc123/",
    imageUrl: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=600&auto=format&fit=crop&q=60",
    likes: 342,
    comments: 48,
    views: 4500,
    engagementRate: 8.6,
    category: "Politik",
    publishedAt: "2026-06-05T10:00:00Z",
    statusEvaluasi: "Layak Tayang",
    verified: true,
    isViral: false
  },
  {
    id: "post_2",
    caption: "BREAKING NEWS: Kebakaran hebat melanda gudang plastik di kawasan industri Margomulyo Surabaya Barat malam ini. Petugas PMK mengerahkan 15 unit mobil pemadam termasuk Bronto Skylift. Jalur lalu lintas dialihkan sementara. #Kebakaran #Surabaya #PemadamKebakaran #Suroboyo",
    url: "https://www.instagram.com/p/C_def456/",
    imageUrl: "https://images.unsplash.com/photo-1508873696983-2df519f0397e?w=600&auto=format&fit=crop&q=60",
    likes: 890, // Crucially high metrics for viral detection
    comments: 112,
    views: 12500,
    engagementRate: 11.2,
    category: "Surabaya",
    publishedAt: "2026-06-06T21:15:00Z",
    statusEvaluasi: "Perlu Verifikasi",
    verified: false,
    isViral: true
  },
  {
    id: "post_3",
    caption: "Persebaya Surabaya matangkan taktik umpan pendek rapat jelang laga Big Match menjamu Arema FC di Stadion Gelora Bung Tomo (GBT). Coach meminta para pemain fokus penuh dan abaikan psywar di medsos. #Persebaya #GreenForce #AremaFC #Liga1",
    url: "https://www.instagram.com/p/C_ghi789/",
    imageUrl: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60",
    likes: 1250, // High engagement
    comments: 215,
    views: 18000,
    engagementRate: 14.5,
    category: "Olahraga",
    publishedAt: "2026-06-07T14:30:00Z",
    statusEvaluasi: "Layak Tayang",
    verified: true,
    isViral: true
  },
  {
    id: "post_4",
    caption: "Bupati Sidoarjo tinjau proyek revitalisasi trotoar ramah difabel di sepanjang Jalan Ahmad Yani. Menargetkan pengerjaan rampung akhir Juli agar meningkatkan estetika kota dan keamanan pejalan kaki. #Sidoarjo #InfraSidoarjo #Beritajatim",
    url: "https://www.instagram.com/p/C_jkl101/",
    imageUrl: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=600&auto=format&fit=crop&q=60",
    likes: 85,
    comments: 14,
    views: 1200,
    engagementRate: 5.8,
    category: "Sidoarjo",
    publishedAt: "2026-06-08T09:00:00Z",
    statusEvaluasi: "Belum Dievaluasi",
    verified: true,
    isViral: false
  },
  {
    id: "post_5",
    caption: "Ditreskrimsus Polda Jatim membongkar sindikat penipuan online modus investasi bodong berkedok kebun durian di Pasuruan. Kerugian korban ditaksir mencapai Rp 15 Miliar dari ratusan nasabah di Jawa Timur. #InvestasiBodong #PoldaJatim #Kriminal #Beritajatim",
    url: "https://www.instagram.com/p/C_mno202/",
    imageUrl: "https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=600&auto=format&fit=crop&q=60",
    likes: 310,
    comments: 42,
    views: 3900,
    engagementRate: 9.0,
    category: "Kriminal",
    publishedAt: "2026-06-09T11:45:00Z",
    statusEvaluasi: "Perlu Verifikasi",
    verified: false,
    isViral: false
  },
  {
    id: "post_6",
    caption: "Pelaku UMKM Kerajinan Kulit Tanggulangin Sidoarjo kembali bangkit dengan memperluas penetrasi pasar ekspor ke Jepang dan Eropa Barat. Dibantu pelatihan e-commerce gratis dari Dinas Koperasi dan UKM Jatim. #UMKM #Tanggulangin #Sidoarjo #Ekspor",
    url: "https://www.instagram.com/p/C_pqr303/",
    imageUrl: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=60",
    likes: 195,
    comments: 18,
    views: 2200,
    engagementRate: 6.8,
    category: "Ekonomi",
    publishedAt: "2026-06-10T08:10:00Z",
    statusEvaluasi: "Belum Dievaluasi",
    verified: true,
    isViral: false
  },
  {
    id: "post_7",
    caption: "Satresnarkoba Polrestabes Surabaya tangkap pengedar sabu jaringan Lapas seberat 5.2 Kg di kamar hotel kawasan Wonokromo. Tersangka terancam hukuman seumur hidup atau pidana mati. Penyelidikan mendalam masih berlangsung. #Narkoba #wonokromo #Surabaya",
    url: "https://www.instagram.com/p/C_stu404/",
    imageUrl: "https://images.unsplash.com/photo-1453847668802-487ad75ae497?w=600&auto=format&fit=crop&q=60",
    likes: 420,
    comments: 67,
    views: 5100,
    engagementRate: 9.5,
    category: "Kriminal",
    publishedAt: "2026-06-11T13:20:00Z",
    statusEvaluasi: "Perlu Verifikasi",
    verified: false,
    isViral: false
  },
  {
    id: "post_8",
    caption: "Laju pertumbuhan ekonomi Jawa Timur kuartal I-2026 tumbuh impresif di angka 5.24% secara y-on-y, melampaui pertumbuhan nasional. Sektor industri pengolahan dan perdagangan eceran menjadi motor penggerak utama di Surabaya dan Gresik. #EkonomiJatim #Investasi #Surabaya",
    url: "https://www.instagram.com/p/C_vwx505/",
    imageUrl: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=600&auto=format&fit=crop&q=60",
    likes: 125,
    comments: 12,
    views: 1540,
    engagementRate: 6.5,
    category: "Ekonomi",
    publishedAt: "2026-06-11T16:00:00Z",
    statusEvaluasi: "Layak Tayang",
    verified: true,
    isViral: false
  },
  {
    id: "post_9",
    caption: "Warga Sidoarjo keluhkan jalan berlubang di Buduran yang kerap akibatkan kecelakaan pemotor terutama saat hujan lebat. Dinas PU Bina Marga berjanji akan melakukan penambalan darurat esok pagi. #WargaMelapor #Sidoarjo #Buduran #InfrastrukturJatim",
    url: "https://www.instagram.com/p/C_yzA606/",
    imageUrl: "https://images.unsplash.com/photo-1515162305285-0293e4767cc2?w=600&auto=format&fit=crop&q=60",
    likes: 955, // Potential viral post
    comments: 188,
    views: 11000,
    engagementRate: 11.9,
    category: "Sidoarjo",
    publishedAt: "2026-06-10T17:40:00Z",
    statusEvaluasi: "Belum Dievaluasi",
    verified: false,
    isViral: true
  }
];

// Indonesian category descriptors and colors
export const CATEGORY_DETAILS: Record<string, { label: string; color: string; description: string }> = {
  Politik: {
    label: "Politik & Pilkada",
    color: "#3b82f6", // Blue
    description: "Kebijakan publik, Pilkada Serentak, pemerintahan kabupaten & provinsi Jawa Timur."
  },
  Surabaya: {
    label: "Metropolis Surabaya",
    color: "#10b981", // Emerald
    description: "Berita perkotaan Surabaya, fasilitas publik, kebijakan Walikota, dan peristiwa hangat di Surabaya."
  },
  Sidoarjo: {
    label: "Kabar Sidoarjo",
    color: "#f59e0b", // Amber
    description: "Pembangunan lokal Sidoarjo, pelayanan publik, infrastruktur, dan kegiatan warga Sidoarjo."
  },
  Olahraga: {
    label: "Olahraga & Persebaya",
    color: "#ec4899", // Pink
    description: "Perkembangan sepak bola Liga 1 Indonesia, Green Force Persebaya, futsal, dan atlet Jawa Timur."
  },
  Kriminal: {
    label: "Hukum & Kriminal",
    color: "#ef4444", // Red
    description: "Penyelidikan Polda Jatim, persidangan PN Surabaya, isu ketertiban masyarakat di daerah."
  },
  Ekonomi: {
    label: "Ekonomi & Bisnis Jatim",
    color: "#8b5cf6", // Purple
    description: "Pertumbuhan industri, UMKM lokal Sidoarjo/Gresik, laju inflasi Jatim, dan ekspor-impor."
  }
};
