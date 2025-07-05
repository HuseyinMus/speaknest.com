'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  Calendar, 
  Clock, 
  Target, 
  ArrowUp, 
  ArrowDown, 
  Users, 
  CreditCard, 
  Download, 
  Share2, 
  FileText, 
  BarChart3, 
  TrendingUp, 
  Star,
  Eye,
  Plus,
  Minus,
  User,
  AlertTriangle,
  XCircle,
  Filter,
  Search,
  RefreshCw,
  Trophy,
  Coins,
  PiggyBank,
  Gift,
  Receipt
} from 'lucide-react';
import { collection, query, where, getDocs, orderBy, Timestamp, addDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Earning {
  id: string;
  meetingId: string;
  meetingTitle: string;
  date: Date;
  amount: number;
  participants: number;
  duration: number; // minutes
  meetingType: 'group' | 'private'; // YENİ: Ders türü
  status: 'pending' | 'paid' | 'cancelled';
  paymentMethod: string;
  transactionId?: string;
  isCompleted: boolean; // YENİ: Ders tamamlandı mı?
  minimumDurationMet: boolean; // YENİ: Minimum 45 dakika kontrolü
  hasParticipants: boolean; // YENİ: En az 1 katılımcı kontrolü
  paymentId?: string;
}

interface EarningsStats {
  totalEarnings: number;
  thisMonth: number;
  lastMonth: number;
  pendingAmount: number;
  totalMeetings: number;
  averagePerMeeting: number;
  totalParticipants: number;
  totalHours: number;
  monthlyGrowth: number;
  topEarningMonth: { month: string; amount: number };
  paymentMethods: { method: string; count: number; total: number }[];
  recentTransactions: Earning[];
  monthlyData: { month: string; earnings: number; meetings: number }[];
  // YENİ: Ders türü bazlı istatistikler
  groupSessions: number;
  privateSessions: number;
  groupEarnings: number;
  privateEarnings: number;
  sessionBreakdown: {
    group: { count: number; earnings: number };
    private: { count: number; earnings: number };
  };
}

const translations = {
  en: {
    earnings: "Earnings",
    overview: "Overview",
    transactions: "Transactions",
    analytics: "Analytics",
    totalEarnings: "Total Earnings",
    thisMonth: "This Month",
    lastMonth: "Last Month",
    pendingAmount: "Pending Amount",
    totalMeetings: "Total Meetings",
    averagePerMeeting: "Average per Meeting",
    totalParticipants: "Total Participants",
    totalHours: "Total Hours",
    monthlyGrowth: "Monthly Growth",
    topEarningMonth: "Top Earning Month",
    paymentMethods: "Payment Methods",
    recentTransactions: "Recent Transactions",
    allTransactions: "All Transactions",
    pending: "Pending",
    paid: "Paid",
    cancelled: "Cancelled",
    paymentMethod: "Payment Method",
    transactionId: "Transaction ID",
    meetingTitle: "Meeting Title",
    participants: "Participants",
    duration: "Duration",
    amount: "Amount",
    date: "Date",
    status: "Status",
    downloadReport: "Download Report",
    shareEarnings: "Share Earnings",
    filterTransactions: "Filter Transactions",
    searchTransactions: "Search transactions...",
    noTransactions: "No transactions found",
    loading: "Loading earnings...",
    error: "Error loading earnings",
    // YENİ: Ders türü çevirileri
    groupSession: "Group Session",
    privateSession: "Private Session",
    groupSessions: "Group Sessions",
    privateSessions: "Private Sessions",
    groupEarnings: "Group Earnings",
    privateEarnings: "Private Earnings",
    sessionType: "Session Type",
    // Payment methods
    bankTransfer: "Bank Transfer",
    creditCard: "Credit Card",
    paypal: "PayPal",
    crypto: "Cryptocurrency",
    // Time periods
    thisWeek: "This Week",
    thisYear: "This Year",
    allTime: "All Time",
    // Analytics
    earningsTrend: "Earnings Trend",
    meetingPerformance: "Meeting Performance",
    participantAnalysis: "Participant Analysis",
    paymentDistribution: "Payment Distribution",
    sessionBreakdown: "Session Breakdown",
    // Insights
    insights: "Key Insights",
    bestPerformingMonth: "Best Performing Month",
    averageHourlyRate: "Average Hourly Rate",
    totalPaidOut: "Total Paid Out",
    nextPayout: "Next Payout",
    // Actions
    requestPayout: "Request Payout",
    viewDetails: "View Details",
    exportData: "Export Data",
    // YENİ: Fiyatlandırma bilgileri
    pricingInfo: "Pricing Information",
    groupSessionPrice: "Group Session: ₺50/hour",
    privateSessionPrice: "Private Session: ₺75/hour",
    minimumDuration: "Minimum Duration: 45 minutes",
    minimumParticipants: "Minimum Participants: 1",
  },
  tr: {
    earnings: "Kazançlar",
    overview: "Genel Bakış",
    transactions: "İşlemler",
    analytics: "Analizler",
    totalEarnings: "Toplam Kazanç",
    thisMonth: "Bu Ay",
    lastMonth: "Geçen Ay",
    pendingAmount: "Bekleyen Tutar",
    totalMeetings: "Toplam Toplantı",
    averagePerMeeting: "Toplantı Başına Ortalama",
    totalParticipants: "Toplam Katılımcı",
    totalHours: "Toplam Saat",
    monthlyGrowth: "Aylık Büyüme",
    topEarningMonth: "En İyi Kazanç Ayı",
    paymentMethods: "Ödeme Yöntemleri",
    recentTransactions: "Son İşlemler",
    allTransactions: "Tüm İşlemler",
    pending: "Bekliyor",
    paid: "Ödendi",
    cancelled: "İptal Edildi",
    paymentMethod: "Ödeme Yöntemi",
    transactionId: "İşlem ID",
    meetingTitle: "Toplantı Başlığı",
    participants: "Katılımcılar",
    duration: "Süre",
    amount: "Tutar",
    date: "Tarih",
    status: "Durum",
    downloadReport: "Rapor İndir",
    shareEarnings: "Kazancı Paylaş",
    filterTransactions: "İşlemleri Filtrele",
    searchTransactions: "İşlem ara...",
    noTransactions: "İşlem bulunamadı",
    loading: "Kazançlar yükleniyor...",
    error: "Kazançlar yüklenirken hata oluştu",
    // YENİ: Ders türü çevirileri
    groupSession: "Grup Dersi",
    privateSession: "Özel Ders",
    groupSessions: "Grup Dersleri",
    privateSessions: "Özel Dersler",
    groupEarnings: "Grup Dersi Kazancı",
    privateEarnings: "Özel Ders Kazancı",
    sessionType: "Ders Türü",
    // Payment methods
    bankTransfer: "Banka Transferi",
    creditCard: "Kredi Kartı",
    paypal: "PayPal",
    crypto: "Kripto Para",
    // Time periods
    thisWeek: "Bu Hafta",
    thisYear: "Bu Yıl",
    allTime: "Tüm Zamanlar",
    // Analytics
    earningsTrend: "Kazanç Trendi",
    meetingPerformance: "Toplantı Performansı",
    participantAnalysis: "Katılımcı Analizi",
    paymentDistribution: "Ödeme Dağılımı",
    sessionBreakdown: "Ders Türü Dağılımı",
    // Insights
    insights: "Önemli Analizler",
    bestPerformingMonth: "En İyi Performans Ayı",
    averageHourlyRate: "Ortalama Saatlik Ücret",
    totalPaidOut: "Toplam Ödenen",
    nextPayout: "Sonraki Ödeme",
    // Actions
    requestPayout: "Ödeme Talep Et",
    viewDetails: "Detayları Gör",
    exportData: "Veri Dışa Aktar",
    // YENİ: Fiyatlandırma bilgileri
    pricingInfo: "Fiyatlandırma Bilgileri",
    groupSessionPrice: "Grup Dersi: ₺50/saat",
    privateSessionPrice: "Özel Ders: ₺75/saat",
    minimumDuration: "Minimum Süre: 45 dakika",
    minimumParticipants: "Minimum Katılımcı: 1",
  }
};

export default function Earnings() {
  const router = useRouter();
  const [lang, setLang] = useState<'tr' | 'en'>('tr');
  const t = translations[lang];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [earningsStats, setEarningsStats] = useState<EarningsStats | null>(null);
  const [timeFilter, setTimeFilter] = useState<'week' | 'month' | 'year' | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);
  const { user } = useAuth();
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);
  const [payments, setPayments] = useState<Earning[]>([]);

  const isAdmin = user?.email === 'admin@speaknest.com'; // örnek admin kontrolü

  useEffect(() => {
    if (user) {
      fetchEarnings(user.uid);
    }
  }, [user]);

  // timeFilter değiştiğinde istatistikleri yeniden hesapla
  useEffect(() => {
    if (earningsStats && user) {
      // Mevcut verileri kullanarak istatistikleri yeniden hesapla
      const demoEarnings = getDemoEarnings();
      const stats = calculateEarningsStats(demoEarnings, timeFilter);
      setEarningsStats(stats);
    }
  }, [timeFilter]);

  const fetchEarnings = async (userId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      // Firestore'dan gerçek verileri çek
      const earningsRef = collection(db, 'earnings');
      const q = query(
        earningsRef,
        where('proUserId', '==', userId),
        orderBy('date', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const realEarnings: Earning[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const date = data.date instanceof Timestamp ? data.date.toDate() : new Date(data.date);
        
        realEarnings.push({
          id: doc.id,
          meetingId: data.meetingId,
          meetingTitle: data.meetingTitle,
          date: date,
          amount: data.amount || 0,
          participants: data.participants || 0,
          duration: data.duration || 0,
          meetingType: data.meetingType || 'group',
          status: data.status || 'pending',
          paymentMethod: data.paymentMethod || 'bankTransfer',
          transactionId: data.transactionId,
          isCompleted: data.isCompleted || false,
          minimumDurationMet: data.minimumDurationMet || false,
          hasParticipants: data.hasParticipants || false,
          paymentId: data.paymentId,
        });
      });

      // Eğer gerçek veri yoksa, demo verileri kullan
      const finalEarnings = realEarnings.length > 0 ? realEarnings : getDemoEarnings();
      
      // İstatistikleri hesapla
      const stats = calculateEarningsStats(finalEarnings);
      setEarningsStats(stats);
      
    } catch (error) {
      console.error('Error fetching earnings:', error);
      setError(t.error);
      // Hata durumunda demo verileri kullan
      const demoEarnings = getDemoEarnings();
      const stats = calculateEarningsStats(demoEarnings);
      setEarningsStats(stats);
    } finally {
      setLoading(false);
    }
  };

  const getDemoEarnings = (): Earning[] => {
    return [
      {
        id: '1',
        meetingId: 'meeting1',
        meetingTitle: 'Daily Conversation Practice',
        date: new Date(2024, 11, 15),
        amount: 50,
        participants: 4,
        duration: 60,
        meetingType: 'group',
        status: 'paid',
        paymentMethod: 'bankTransfer',
        transactionId: 'TXN123456',
        isCompleted: true,
        minimumDurationMet: true,
        hasParticipants: true,
        paymentId: 'PAYMENT123',
      },
      {
        id: '2',
        meetingId: 'meeting2',
        meetingTitle: 'Business English Workshop',
        date: new Date(2024, 11, 14),
        amount: 75,
        participants: 1,
        duration: 60,
        meetingType: 'private',
        status: 'paid',
        paymentMethod: 'creditCard',
        transactionId: 'TXN123457',
        isCompleted: true,
        minimumDurationMet: true,
        hasParticipants: true,
        paymentId: 'PAYMENT124',
      },
      {
        id: '3',
        meetingId: 'meeting3',
        meetingTitle: 'Advanced Grammar Session',
        date: new Date(2024, 11, 13),
        amount: 50,
        participants: 3,
        duration: 45,
        meetingType: 'group',
        status: 'pending',
        paymentMethod: 'paypal',
        isCompleted: true,
        minimumDurationMet: true,
        hasParticipants: true,
        paymentId: 'PAYMENT125',
      },
      {
        id: '4',
        meetingId: 'meeting4',
        meetingTitle: 'Speaking Confidence Building',
        date: new Date(2024, 11, 12),
        amount: 75,
        participants: 1,
        duration: 90,
        meetingType: 'private',
        status: 'paid',
        paymentMethod: 'bankTransfer',
        transactionId: 'TXN123458',
        isCompleted: true,
        minimumDurationMet: true,
        hasParticipants: true,
        paymentId: 'PAYMENT126',
      },
      {
        id: '5',
        meetingId: 'meeting5',
        meetingTitle: 'IELTS Preparation',
        date: new Date(2024, 11, 11),
        amount: 50,
        participants: 5,
        duration: 60,
        meetingType: 'group',
        status: 'paid',
        paymentMethod: 'creditCard',
        transactionId: 'TXN123459',
        isCompleted: true,
        minimumDurationMet: true,
        hasParticipants: true,
        paymentId: 'PAYMENT127',
      },
      {
        id: '6',
        meetingId: 'meeting6',
        meetingTitle: 'Short Session (Invalid)',
        date: new Date(2024, 11, 10),
        amount: 0,
        participants: 2,
        duration: 30,
        meetingType: 'group',
        status: 'cancelled',
        paymentMethod: 'paypal',
        isCompleted: false,
        minimumDurationMet: false,
        hasParticipants: true,
        paymentId: 'PAYMENT128',
      },
      {
        id: '7',
        meetingId: 'meeting7',
        meetingTitle: 'No Participants (Invalid)',
        date: new Date(2024, 11, 9),
        amount: 0,
        participants: 0,
        duration: 60,
        meetingType: 'group',
        status: 'cancelled',
        paymentMethod: 'paypal',
        isCompleted: false,
        minimumDurationMet: true,
        hasParticipants: false,
        paymentId: 'PAYMENT129',
      }
    ];
  };

  const calculateEarningsStats = (earnings: Earning[], currentTimeFilter: string = timeFilter): EarningsStats => {
    const now = new Date();
    
    // Sadece geçerli kazançları filtrele
    const validEarnings = earnings.filter(earning => 
      earning.isCompleted && 
      earning.minimumDurationMet && 
      earning.hasParticipants &&
      earning.status !== 'cancelled'
    );
    
    const filteredEarnings = validEarnings.filter(earning => {
      if (currentTimeFilter === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        return earning.date >= weekAgo;
      } else if (currentTimeFilter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return earning.date >= monthAgo;
      } else if (currentTimeFilter === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return earning.date >= yearAgo;
      }
      return true;
    });

    // Temel istatistikler
    const totalEarnings = filteredEarnings.reduce((sum, e) => sum + e.amount, 0);
    const thisMonth = filteredEarnings.filter(e => 
      e.date.getMonth() === now.getMonth() && e.date.getFullYear() === now.getFullYear()
    ).reduce((sum, e) => sum + e.amount, 0);
    const lastMonth = filteredEarnings.filter(e => 
      e.date.getMonth() === now.getMonth() - 1 && e.date.getFullYear() === now.getFullYear()
    ).reduce((sum, e) => sum + e.amount, 0);
    const pendingAmount = filteredEarnings.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0);
    
    const totalMeetings = filteredEarnings.length;
    const averagePerMeeting = totalMeetings > 0 ? totalEarnings / totalMeetings : 0;
    const totalParticipants = filteredEarnings.reduce((sum, e) => sum + e.participants, 0);
    const totalHours = filteredEarnings.reduce((sum, e) => sum + e.duration, 0) / 60;
    
    const monthlyGrowth = lastMonth > 0 ? ((thisMonth - lastMonth) / lastMonth) * 100 : 0;

    // Ders türü bazlı istatistikler
    const groupSessions = filteredEarnings.filter(e => e.meetingType === 'group').length;
    const privateSessions = filteredEarnings.filter(e => e.meetingType === 'private').length;
    const groupEarnings = filteredEarnings.filter(e => e.meetingType === 'group').reduce((sum, e) => sum + e.amount, 0);
    const privateEarnings = filteredEarnings.filter(e => e.meetingType === 'private').reduce((sum, e) => sum + e.amount, 0);

    const sessionBreakdown = {
      group: { count: groupSessions, earnings: groupEarnings },
      private: { count: privateSessions, earnings: privateEarnings }
    };

    // Aylık veri (son 6 ay)
    const monthlyData = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });
      const monthEarnings = filteredEarnings.filter(e => 
        e.date.getMonth() === monthDate.getMonth() && e.date.getFullYear() === monthDate.getFullYear()
      );
      const monthAmount = monthEarnings.reduce((sum, e) => sum + e.amount, 0);
      
      monthlyData.push({
        month: monthName,
        earnings: monthAmount,
        meetings: monthEarnings.length
      });
    }

    const topEarningMonth = monthlyData.reduce((max, current) => 
      current.earnings > max.earnings ? current : max
    );

    // Ödeme yöntemleri analizi
    const paymentMethodCounts: { [key: string]: { count: number; total: number } } = {};
    filteredEarnings.forEach(earning => {
      if (!paymentMethodCounts[earning.paymentMethod]) {
        paymentMethodCounts[earning.paymentMethod] = { count: 0, total: 0 };
      }
      paymentMethodCounts[earning.paymentMethod].count++;
      paymentMethodCounts[earning.paymentMethod].total += earning.amount;
    });

    const paymentMethods = Object.entries(paymentMethodCounts).map(([method, data]) => ({
      method,
      count: data.count,
      total: data.total
    }));

    return {
      totalEarnings,
      thisMonth,
      lastMonth,
      pendingAmount,
      totalMeetings,
      averagePerMeeting,
      totalParticipants,
      totalHours,
      monthlyGrowth,
      topEarningMonth,
      paymentMethods,
      recentTransactions: filteredEarnings.slice(0, 10),
      monthlyData,
      groupSessions,
      privateSessions,
      groupEarnings,
      privateEarnings,
      sessionBreakdown
    };
  };

  const getPaymentMethodLabel = (method: string) => {
    return t[method as keyof typeof t] || method;
  };

  const getStatusLabel = (status: string) => {
    return t[status as keyof typeof t] || status;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat(lang === 'tr' ? 'tr-TR' : 'en-US', {
      style: 'currency',
      currency: 'TRY',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const filteredTransactions = earningsStats?.recentTransactions?.filter(transaction => {
    const matchesSearch = transaction.meetingTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         transaction.transactionId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || transaction.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  // Geçersiz işlemleri ayrı filtrele (gösterim için)
  const invalidTransactions = earningsStats?.recentTransactions?.filter(transaction => 
    !transaction.isCompleted || !transaction.minimumDurationMet || !transaction.hasParticipants
  ) || [];

  const getSessionTypeLabel = (type: string) => {
    return type === 'group' ? t.groupSession : t.privateSession;
  };

  const getSessionTypeColor = (type: string) => {
    return type === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800';
  };

  // Rapor İndirme Fonksiyonu
  const downloadReport = async () => {
    if (!earningsStats) return;
    
    setIsExporting(true);
    try {
      const reportData = {
        title: `${t.earnings} Raporu - ${new Date().toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US')}`,
        user: user?.displayName || user?.email,
        period: timeFilter,
        stats: {
          totalEarnings: earningsStats.totalEarnings,
          thisMonth: earningsStats.thisMonth,
          pendingAmount: earningsStats.pendingAmount,
          totalMeetings: earningsStats.totalMeetings,
          groupSessions: earningsStats.groupSessions,
          privateSessions: earningsStats.privateSessions,
          groupEarnings: earningsStats.groupEarnings,
          privateEarnings: earningsStats.privateEarnings
        },
        transactions: filteredTransactions,
        invalidTransactions: invalidTransactions
      };

      // CSV formatında rapor oluştur
      const csvContent = generateCSVReport(reportData);
      
      // Dosyayı indir
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `earnings_report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Başarı mesajı göster
      alert(lang === 'tr' ? 'Rapor başarıyla indirildi!' : 'Report downloaded successfully!');
      
    } catch (error) {
      console.error('Error downloading report:', error);
      alert(lang === 'tr' ? 'Rapor indirme hatası!' : 'Error downloading report!');
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Rapor Oluşturma
  const generateCSVReport = (data: any) => {
    const headers = [
      'Başlık',
      'Ders Türü',
      'Tarih',
      'Katılımcılar',
      'Süre (dk)',
      'Tutar (₺)',
      'Durum',
      'Ödeme Yöntemi'
    ];

    const rows = [
      headers.join(','),
      ...data.transactions.map((t: Earning) => [
        `"${t.meetingTitle}"`,
        t.meetingType === 'group' ? 'Grup Dersi' : 'Özel Ders',
        t.date.toLocaleDateString('tr-TR'),
        t.participants,
        t.duration,
        t.amount,
        t.status === 'paid' ? 'Ödendi' : t.status === 'pending' ? 'Bekliyor' : 'İptal',
        t.paymentMethod
      ].join(','))
    ];

    return rows.join('\n');
  };

  // Kazanç Paylaşma Fonksiyonu
  const shareEarnings = async () => {
    if (!earningsStats) return;
    
    setIsSharing(true);
    try {
      const shareText = lang === 'tr' 
        ? `🎉 Bu ay ${earningsStats.thisMonth}₺ kazandım! Speak Nest platformunda ${earningsStats.totalMeetings} ders verdim.`
        : `🎉 I earned ${earningsStats.thisMonth}₺ this month! I gave ${earningsStats.totalMeetings} lessons on Speak Nest platform.`;

      if (navigator.share) {
        await navigator.share({
          title: 'Speak Nest Kazançlarım',
          text: shareText,
          url: window.location.href
        });
      } else {
        // Fallback: Clipboard'a kopyala
        await navigator.clipboard.writeText(shareText);
        alert(lang === 'tr' ? 'Kazanç bilgileri panoya kopyalandı!' : 'Earnings info copied to clipboard!');
      }
    } catch (error) {
      console.error('Error sharing earnings:', error);
      alert(lang === 'tr' ? 'Paylaşım hatası!' : 'Error sharing!');
    } finally {
      setIsSharing(false);
    }
  };

  // Veri Yenileme Fonksiyonu
  const refreshData = async () => {
    if (user) {
      await fetchEarnings(user.uid);
    }
  };

  const requestPayment = async () => {
    if (!user || isRequestingPayment) return;
    setIsRequestingPayment(true);
    try {
      // Bekleyen kazançları bul
      const pendingEarnings = earningsStats?.recentTransactions?.filter(e => !e.paymentId && e.status === 'pending');
      if (!pendingEarnings || pendingEarnings.length === 0) {
        alert(lang === 'tr' ? 'Bekleyen ödeme yok.' : 'No pending earnings.');
        setIsRequestingPayment(false);
        return;
      }
      // Toplam tutar ve earningId listesi
      const amount = pendingEarnings.reduce((sum, e) => sum + e.amount, 0);
      const transactions = pendingEarnings.map(e => e.id);
      // Yeni payment dokümanı oluştur
      const paymentRef = await addDoc(collection(db, 'payments'), {
        proUserId: user.uid,
        amount,
        period: `${new Date().getFullYear()}-${(new Date().getMonth()+1).toString().padStart(2,'0')}`,
        status: 'pending',
        createdAt: new Date(),
        paidAt: null,
        transactions
      });
      // Bildirim ekle
      await addDoc(collection(db, 'notifications'), {
        userId: user.uid,
        type: 'payment_request',
        message: lang === 'tr' ? 'Ödeme talebiniz başarıyla alındı.' : 'Your payment request has been received.',
        createdAt: new Date(),
        read: false,
        relatedId: paymentRef.id
      });
      alert(lang === 'tr' ? 'Ödeme talebiniz alındı!' : 'Payment request submitted!');
      fetchPayments(user.uid);
      refreshData();
    } catch (err) {
      alert(lang === 'tr' ? 'Ödeme talebi başarısız.' : 'Payment request failed.');
    } finally {
      setIsRequestingPayment(false);
    }
  };

  const markPaymentAsPaid = async (paymentId: string) => {
    if (!isAdmin) return;
    try {
      await updateDoc(doc(db, 'payments', paymentId), {
        status: 'paid',
        paidAt: new Date()
      });
      alert(lang === 'tr' ? 'Ödeme işaretlendi.' : 'Payment marked as paid.');
      fetchPayments(user.uid);
    } catch (err) {
      alert(lang === 'tr' ? 'İşlem başarısız.' : 'Operation failed.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-slate-200 rounded w-1/4 mb-6"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl shadow-lg p-6">
                  <div className="h-4 bg-slate-200 rounded w-1/2 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-3/4"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-red-50 border border-red-200 rounded-2xl p-6 text-center">
            <AlertTriangle size={48} className="text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-red-800 mb-2">{t.error}</h2>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={refreshData}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
            >
              {lang === 'tr' ? 'Tekrar Dene' : 'Try Again'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!earningsStats) {
    return (
      <div className="min-h-screen bg-slate-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-6 text-center">
            <Clock size={48} className="text-yellow-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-yellow-800 mb-2">
              {lang === 'tr' ? 'Veri Yükleniyor' : 'Loading Data'}
            </h2>
            <p className="text-yellow-600 mb-4">
              {lang === 'tr' ? 'Kazanç verileri yükleniyor...' : 'Earnings data is loading...'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-green-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <DollarSign size={32} className="text-green-600" />
              {t.earnings}
            </h1>
            <p className="text-slate-600 mt-2">
              {lang === 'tr' 
                ? 'Kazançlarınızı takip edin ve finansal performansınızı analiz edin'
                : 'Track your earnings and analyze your financial performance'
              }
            </p>
          </div>
          
          {/* Dil Seçici */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'en' 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('tr')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'tr' 
                  ? 'bg-green-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              TR
            </button>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={downloadReport}
            disabled={isExporting || !earningsStats}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isExporting ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Download size={16} />
            )}
            {isExporting ? (lang === 'tr' ? 'İndiriliyor...' : 'Downloading...') : t.downloadReport}
          </button>

          <button
            onClick={shareEarnings}
            disabled={isSharing || !earningsStats}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSharing ? (
              <RefreshCw size={16} className="animate-spin" />
            ) : (
              <Share2 size={16} />
            )}
            {isSharing ? (lang === 'tr' ? 'Paylaşılıyor...' : 'Sharing...') : t.shareEarnings}
          </button>

          <button
            onClick={refreshData}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            {lang === 'tr' ? 'Yenile' : 'Refresh'}
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            <FileText size={16} />
            {lang === 'tr' ? 'Yazdır' : 'Print'}
          </button>

          {/* Ödeme Talep Et butonu her zaman */}
          <button
            onClick={requestPayment}
            disabled={isRequestingPayment}
            className="flex items-center gap-2 px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Coins size={16} />
            {isRequestingPayment ? (lang === 'tr' ? 'Talep Ediliyor...' : 'Requesting...') : (lang === 'tr' ? 'Ödeme Talep Et' : 'Request Payment')}
          </button>
        </div>

        {/* Filtreler */}
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-2">
            <Filter size={16} className="text-slate-500" />
            <select
              value={timeFilter}
              onChange={(e) => setTimeFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{lang === 'tr' ? 'Tüm Zamanlar' : 'All Time'}</option>
              <option value="week">{lang === 'tr' ? 'Bu Hafta' : 'This Week'}</option>
              <option value="month">{lang === 'tr' ? 'Bu Ay' : 'This Month'}</option>
              <option value="year">{lang === 'tr' ? 'Bu Yıl' : 'This Year'}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">{lang === 'tr' ? 'Tüm Durumlar' : 'All Status'}</option>
              <option value="paid">{t.paid}</option>
              <option value="pending">{t.pending}</option>
              <option value="cancelled">{t.cancelled}</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <Search size={16} className="text-slate-500" />
            <input
              type="text"
              placeholder={t.searchTransactions}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
        </div>

        {/* Genel Bakış Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.totalEarnings}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(earningsStats.totalEarnings)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp size={16} className="text-green-600" />
                  <span className="text-green-600 text-sm font-medium">+{earningsStats.monthlyGrowth.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <DollarSign size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.thisMonth}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(earningsStats.thisMonth)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp size={16} className="text-green-600" />
                  <span className="text-green-600 text-sm font-medium">+{earningsStats.monthlyGrowth.toFixed(1)}%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Calendar size={24} className="text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.pendingAmount}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(earningsStats.pendingAmount)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Clock size={16} className="text-yellow-600" />
                  <span className="text-yellow-600 text-sm font-medium">{t.pending}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.averagePerMeeting}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{formatCurrency(earningsStats.averagePerMeeting)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <Star size={16} className="text-purple-600" />
                  <span className="text-purple-600 text-sm font-medium">{earningsStats.totalMeetings} {t.totalMeetings.toLowerCase()}</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Target size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Ders Türü Dağılımı Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <Users size={20} className="text-blue-600" />
                {t.groupSessions}
              </h3>
              <span className="text-2xl font-bold text-blue-600">{earningsStats.groupSessions}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t.groupEarnings}</span>
                <span className="font-semibold text-slate-800">{formatCurrency(earningsStats.groupEarnings)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t.groupSessionPrice}</span>
                <span className="text-sm text-slate-500">₺50/saat</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-500 rounded-full transition-all duration-300"
                  style={{ width: `${earningsStats.totalMeetings > 0 ? (earningsStats.groupSessions / earningsStats.totalMeetings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                <User size={20} className="text-purple-600" />
                {t.privateSessions}
              </h3>
              <span className="text-2xl font-bold text-purple-600">{earningsStats.privateSessions}</span>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t.privateEarnings}</span>
                <span className="font-semibold text-slate-800">{formatCurrency(earningsStats.privateEarnings)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{t.privateSessionPrice}</span>
                <span className="text-sm text-slate-500">₺75/saat</span>
              </div>
              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-purple-500 rounded-full transition-all duration-300"
                  style={{ width: `${earningsStats.totalMeetings > 0 ? (earningsStats.privateSessions / earningsStats.totalMeetings) * 100 : 0}%` }}
                ></div>
              </div>
            </div>
          </div>
        </div>

        {/* Fiyatlandırma Bilgileri */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 rounded-2xl border border-green-200 p-6">
          <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
            <DollarSign size={20} className="text-green-600" />
            {t.pricingInfo}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-blue-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t.groupSession}</p>
                <p className="text-sm text-slate-600">₺50/saat</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <User size={16} className="text-purple-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t.privateSession}</p>
                <p className="text-sm text-slate-600">₺75/saat</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Clock size={16} className="text-yellow-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t.minimumDuration}</p>
                <p className="text-sm text-slate-600">45 dakika</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-white rounded-lg shadow-sm">
              <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                <Users size={16} className="text-green-600" />
              </div>
              <div>
                <p className="font-semibold text-slate-800">{t.minimumParticipants}</p>
                <p className="text-sm text-slate-600">1 kişi</p>
              </div>
            </div>
          </div>
        </div>

        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Analizler */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aylık Kazanç Grafiği */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-green-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-green-600" />
                  {t.earningsTrend}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {earningsStats.monthlyData.map((data, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <Calendar size={20} className="text-green-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{data.month}</p>
                          <p className="text-sm text-slate-600">{data.meetings} {t.totalMeetings.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{formatCurrency(data.earnings)}</p>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-green-500 rounded-full transition-all duration-300"
                            style={{ width: `${(data.earnings / Math.max(...earningsStats.monthlyData.map(d => d.earnings))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Ödeme Yöntemleri */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <CreditCard size={20} className="text-blue-600" />
                  {t.paymentMethods}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {earningsStats.paymentMethods.map((method, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <CreditCard size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{getPaymentMethodLabel(method.method)}</p>
                          <p className="text-sm text-slate-600">{method.count} {t.transactions.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{formatCurrency(method.total)}</p>
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden mt-1">
                          <div 
                            className="h-full bg-blue-500 rounded-full transition-all duration-300"
                            style={{ width: `${(method.total / Math.max(...earningsStats.paymentMethods.map(m => m.total))) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon - İşlemler ve İstatistikler */}
          <div className="space-y-6">
            {/* Hızlı İstatistikler */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <BarChart3 size={20} className="text-purple-600" />
                  {t.insights}
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Trophy size={16} className="text-purple-600" />
                    <span className="text-sm text-slate-600">{t.bestPerformingMonth}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{earningsStats.topEarningMonth.month}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Coins size={16} className="text-purple-600" />
                    <span className="text-sm text-slate-600">{t.averageHourlyRate}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(earningsStats.averagePerMeeting)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <PiggyBank size={16} className="text-purple-600" />
                    <span className="text-sm text-slate-600">{t.totalPaidOut}</span>
                  </div>
                  <span className="font-semibold text-slate-800">{formatCurrency(earningsStats.totalEarnings - earningsStats.pendingAmount)}</span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Gift size={16} className="text-purple-600" />
                    <span className="text-sm text-slate-600">{t.nextPayout}</span>
                  </div>
                  <span className="font-semibold text-slate-800">15 {lang === 'tr' ? 'Ocak' : 'Jan'}</span>
                </div>
              </div>
            </div>

            {/* İşlemler Tablosu */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-orange-50 px-6 py-4 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                    <Receipt size={20} className="text-orange-600" />
                    {t.recentTransactions}
                  </h2>
                </div>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.meetingTitle}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.sessionType}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.date}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.participants}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.duration}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.amount}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.status}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {t.paymentMethod}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                        {lang === 'tr' ? 'Ödeme ID' : 'Payment ID'}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-slate-200">
                    {filteredTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-slate-50 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-slate-900">{transaction.meetingTitle}</div>
                          {transaction.transactionId && (
                            <div className="text-sm text-slate-500">ID: {transaction.transactionId}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionTypeColor(transaction.meetingType)}`}>
                            {getSessionTypeLabel(transaction.meetingType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {transaction.date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          <div className="flex items-center gap-1">
                            <Users size={14} className="text-slate-500" />
                            {transaction.participants}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          {transaction.duration} {lang === 'tr' ? 'dk' : 'min'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-slate-900">
                            {transaction.amount > 0 ? formatCurrency(transaction.amount) : (
                              <span className="text-red-600 text-xs">
                                {!transaction.isCompleted && 'İptal Edildi'}
                                {!transaction.minimumDurationMet && 'Süre Yetersiz'}
                                {!transaction.hasParticipants && 'Katılımcı Yok'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction.status === 'paid' ? 'bg-green-100 text-green-800' :
                            transaction.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {transaction.status === 'paid' ? t.paid :
                             transaction.status === 'pending' ? t.pending :
                             t.cancelled}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-900">
                          <div className="flex items-center gap-2">
                            {transaction.paymentMethod === 'bankTransfer' && <CreditCard size={14} className="text-blue-500" />}
                            {transaction.paymentMethod === 'creditCard' && <CreditCard size={14} className="text-green-500" />}
                            {transaction.paymentMethod === 'paypal' && <CreditCard size={14} className="text-blue-600" />}
                            {transaction.paymentMethod === 'crypto' && <CreditCard size={14} className="text-orange-500" />}
                            <span className="capitalize">{t[transaction.paymentMethod as keyof typeof t] || transaction.paymentMethod}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-xs">
                          {transaction.paymentId ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                              {lang === 'tr' ? 'Ödeme ID:' : 'Payment ID:'} {transaction.paymentId}
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {lang === 'tr' ? 'Bekliyor' : 'Pending'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                    <Receipt size={48} className="text-slate-300 mx-auto mb-4" />
                    <p className="text-slate-500">{t.noTransactions}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Geçersiz İşlemler Bölümü */}
        {invalidTransactions.length > 0 && (
          <div className="mt-8">
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <h3 className="text-lg font-semibold text-red-800 mb-4 flex items-center gap-2">
                <AlertTriangle size={20} className="text-red-600" />
                Geçersiz İşlemler (Ödeme Alınamayan)
              </h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-red-200">
                  <thead className="bg-red-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        {t.meetingTitle}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        {t.sessionType}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        {t.date}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        {t.participants}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        {t.duration}
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-red-700 uppercase tracking-wider">
                        Sebep
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-red-50 divide-y divide-red-200">
                    {invalidTransactions.map((transaction) => (
                      <tr key={transaction.id} className="hover:bg-red-100 transition-colors">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-red-900">{transaction.meetingTitle}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getSessionTypeColor(transaction.meetingType)}`}>
                            {getSessionTypeLabel(transaction.meetingType)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-900">
                          {transaction.date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-900">
                          <div className="flex items-center gap-1">
                            <Users size={14} className="text-red-500" />
                            {transaction.participants}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-red-900">
                          {transaction.duration} {lang === 'tr' ? 'dk' : 'min'}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-red-700">
                            {!transaction.isCompleted && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-red-200 text-red-800">
                                <XCircle size={12} className="mr-1" />
                                İptal Edildi
                              </span>
                            )}
                            {!transaction.minimumDurationMet && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-200 text-orange-800">
                                <Clock size={12} className="mr-1" />
                                Süre Yetersiz (45dk)
                              </span>
                            )}
                            {!transaction.hasParticipants && (
                              <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-yellow-200 text-yellow-800">
                                <Users size={12} className="mr-1" />
                                Katılımcı Yok
                              </span>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 p-4 bg-red-100 rounded-lg">
                <p className="text-sm text-red-700">
                  <strong>Not:</strong> Bu işlemler fiyatlandırma kurallarına uymadığı için ödeme alınamamıştır. 
                  Ödeme alabilmek için: ders tamamlanmış olmalı, minimum 45 dakika sürmeli ve en az 1 katılımcı olmalıdır.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Ödeme Geçmişi Tablosu - her zaman başlık ve başlık satırı */}
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Receipt size={20} className="text-green-600" />
            {lang === 'tr' ? 'Ödeme Geçmişi' : 'Payment History'}
          </h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Dönem' : 'Period'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.amount}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{t.status}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'İşlem Tarihi' : 'Created At'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">{lang === 'tr' ? 'Ödeme Tarihi' : 'Paid At'}</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">ID</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {payments.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-8 text-center text-slate-400">{lang === 'tr' ? 'Kayıt yok' : 'No records found'}</td>
                  </tr>
                ) : (
                  payments.map((p) => (
                    <tr key={p.id}>
                      <td className="px-6 py-4 whitespace-nowrap">{p.period}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{formatCurrency(p.amount)}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${p.status === 'paid' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>{p.status === 'paid' ? t.paid : t.pending}</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.createdAt && (p.createdAt.toDate ? p.createdAt.toDate().toLocaleString() : new Date(p.createdAt).toLocaleString())}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.paidAt ? (p.paidAt.toDate ? p.paidAt.toDate().toLocaleString() : new Date(p.paidAt).toLocaleString()) : '-'}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{p.id}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
} 