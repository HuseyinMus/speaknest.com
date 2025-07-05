'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { 
  BarChart, 
  TrendingUp, 
  Users, 
  Clock, 
  Star, 
  Calendar, 
  MessageCircle, 
  Target,
  Globe,
  ArrowUp,
  ArrowDown,
  Activity,
  Award,
  Zap,
  Eye,
  Heart
} from 'lucide-react';

interface Meeting {
  id: string;
  title: string;
  startTime: Date;
  status: string;
  participantCount: number;
  participants: string[];
  level: string;
  topic: string;
  hostId: string;
  hostName: string;
}

interface Statistics {
  totalMeetings: number;
  activeMeetings: number;
  completedMeetings: number;
  cancelledMeetings: number;
  totalParticipants: number;
  averageRating: number;
  totalHours: number;
  popularTopics: { topic: string; count: number }[];
  levelDistribution: { level: string; count: number }[];
  monthlyStats: { month: string; meetings: number; participants: number }[];
  recentActivity: { action: string; date: Date; details: string }[];
}

const translations = {
  en: {
    statistics: "Statistics",
    overview: "Overview",
    performance: "Performance",
    insights: "Insights",
    recentActivity: "Recent Activity",
    totalMeetings: "Total Meetings",
    activeMeetings: "Active Meetings",
    completedMeetings: "Completed Meetings",
    cancelledMeetings: "Cancelled Meetings",
    totalParticipants: "Total Participants",
    averageRating: "Average Rating",
    totalHours: "Total Hours",
    popularTopics: "Popular Topics",
    levelDistribution: "Level Distribution",
    monthlyStats: "Monthly Statistics",
    recentActivity: "Recent Activity",
    noData: "No data available",
    loading: "Loading statistics...",
    error: "Error loading statistics",
    // Performance metrics
    performanceMetrics: "Performance Metrics",
    meetingSuccess: "Meeting Success Rate",
    participantSatisfaction: "Participant Satisfaction",
    timeEfficiency: "Time Efficiency",
    engagementRate: "Engagement Rate",
    // Insights
    insights: "Key Insights",
    topPerformer: "Top Performer",
    improvementAreas: "Areas for Improvement",
    recommendations: "Recommendations",
    // Activity types
    meetingCreated: "Meeting Created",
    meetingCompleted: "Meeting Completed",
    participantJoined: "Participant Joined",
    ratingReceived: "Rating Received",
    // Time periods
    thisMonth: "This Month",
    lastMonth: "Last Month",
    thisYear: "This Year",
    lastYear: "Last Year",
    // Levels
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
    any: "Any Level",
    // Topics
    daily: "Daily Conversation",
    business: "Business",
    education: "Education",
    science: "Science",
    technology: "Technology",
    arts: "Arts & Culture",
    travel: "Travel",
    food: "Food & Cooking",
    sports: "Sports",
    health: "Health & Wellness",
    environment: "Environment",
    entertainment: "Entertainment",
  },
  tr: {
    statistics: "İstatistikler",
    overview: "Genel Bakış",
    performance: "Performans",
    insights: "Analizler",
    recentActivity: "Son Aktiviteler",
    totalMeetings: "Toplam Toplantı",
    activeMeetings: "Aktif Toplantı",
    completedMeetings: "Tamamlanan Toplantı",
    cancelledMeetings: "İptal Edilen Toplantı",
    totalParticipants: "Toplam Katılımcı",
    averageRating: "Ortalama Puan",
    totalHours: "Toplam Saat",
    popularTopics: "Popüler Konular",
    levelDistribution: "Seviye Dağılımı",
    monthlyStats: "Aylık İstatistikler",
    recentActivity: "Son Aktiviteler",
    noData: "Veri bulunamadı",
    loading: "İstatistikler yükleniyor...",
    error: "İstatistikler yüklenirken hata oluştu",
    // Performance metrics
    performanceMetrics: "Performans Metrikleri",
    meetingSuccess: "Toplantı Başarı Oranı",
    participantSatisfaction: "Katılımcı Memnuniyeti",
    timeEfficiency: "Zaman Verimliliği",
    engagementRate: "Katılım Oranı",
    // Insights
    insights: "Önemli Analizler",
    topPerformer: "En İyi Performans",
    improvementAreas: "İyileştirme Alanları",
    recommendations: "Öneriler",
    // Activity types
    meetingCreated: "Toplantı Oluşturuldu",
    meetingCompleted: "Toplantı Tamamlandı",
    participantJoined: "Katılımcı Katıldı",
    ratingReceived: "Puan Alındı",
    // Time periods
    thisMonth: "Bu Ay",
    lastMonth: "Geçen Ay",
    thisYear: "Bu Yıl",
    lastYear: "Geçen Yıl",
    // Levels
    beginner: "Başlangıç",
    intermediate: "Orta",
    advanced: "İleri",
    any: "Tüm Seviyeler",
    // Topics
    daily: "Günlük Konuşma",
    business: "İş Dünyası",
    education: "Eğitim",
    science: "Bilim",
    technology: "Teknoloji",
    arts: "Sanat ve Kültür",
    travel: "Seyahat",
    food: "Yemek ve Mutfak",
    sports: "Spor",
    health: "Sağlık ve Wellness",
    environment: "Çevre",
    entertainment: "Eğlence",
  }
};

export default function Statistics() {
  const router = useRouter();
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const t = translations[lang];
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statistics, setStatistics] = useState<Statistics | null>(null);
  const [timeFilter, setTimeFilter] = useState<'month' | 'year' | 'all'>('month');

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          await fetchStatistics(user.uid);
        } else {
          router.push('/login');
        }
      });
      
      return () => unsubscribe();
    };
    
    checkAuth();
  }, [router, timeFilter]);

  const fetchStatistics = async (userId: string) => {
    try {
      setLoading(true);
      
      // Toplantıları getir
      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('hostId', '==', userId),
        orderBy('startTime', 'desc')
      );
      
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetings: Meeting[] = [];
      
      meetingsSnapshot.forEach((doc) => {
        const data = doc.data();
        meetings.push({
          id: doc.id,
          title: data.title,
          startTime: data.startTime.toDate(),
          status: data.status,
          participantCount: data.participantCount,
          participants: data.participants || [],
          level: data.level,
          topic: data.topic,
          hostId: data.hostId,
          hostName: data.hostName,
        });
      });

      // İstatistikleri hesapla
      const stats = calculateStatistics(meetings);
      setStatistics(stats);
      
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setError(t.error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStatistics = (meetings: Meeting[]): Statistics => {
    const now = new Date();
    const filteredMeetings = meetings.filter(meeting => {
      if (timeFilter === 'month') {
        const monthAgo = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
        return meeting.startTime >= monthAgo;
      } else if (timeFilter === 'year') {
        const yearAgo = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
        return meeting.startTime >= yearAgo;
      }
      return true;
    });

    // Temel istatistikler
    const totalMeetings = filteredMeetings.length;
    const activeMeetings = filteredMeetings.filter(m => m.status === 'active' && m.startTime > now).length;
    const completedMeetings = filteredMeetings.filter(m => m.status === 'completed' || (m.startTime < now && m.status === 'active')).length;
    const cancelledMeetings = filteredMeetings.filter(m => m.status === 'cancelled').length;
    
    // Katılımcı istatistikleri
    const totalParticipants = filteredMeetings.reduce((sum, meeting) => sum + meeting.participants.length, 0);
    
    // Saat hesaplama (varsayılan 1 saat per meeting)
    const totalHours = completedMeetings;
    
    // Ortalama puan (simüle edilmiş)
    const averageRating = 4.2 + Math.random() * 0.6;

    // Popüler konular
    const topicCounts: { [key: string]: number } = {};
    filteredMeetings.forEach(meeting => {
      topicCounts[meeting.topic] = (topicCounts[meeting.topic] || 0) + 1;
    });
    const popularTopics = Object.entries(topicCounts)
      .map(([topic, count]) => ({ topic, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Seviye dağılımı
    const levelCounts: { [key: string]: number } = {};
    filteredMeetings.forEach(meeting => {
      levelCounts[meeting.level] = (levelCounts[meeting.level] || 0) + 1;
    });
    const levelDistribution = Object.entries(levelCounts)
      .map(([level, count]) => ({ level, count }))
      .sort((a, b) => b.count - a.count);

    // Aylık istatistikler (son 6 ay)
    const monthlyStats = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthName = monthDate.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { month: 'short' });
      const monthMeetings = filteredMeetings.filter(m => 
        m.startTime.getMonth() === monthDate.getMonth() && 
        m.startTime.getFullYear() === monthDate.getFullYear()
      );
      const monthParticipants = monthMeetings.reduce((sum, m) => sum + m.participants.length, 0);
      
      monthlyStats.push({
        month: monthName,
        meetings: monthMeetings.length,
        participants: monthParticipants
      });
    }

    // Son aktiviteler
    const recentActivity = filteredMeetings.slice(0, 5).map(meeting => ({
      action: meeting.status === 'completed' ? t.meetingCompleted : t.meetingCreated,
      date: meeting.startTime,
      details: `${meeting.title} - ${meeting.participants.length} katılımcı`
    }));

    return {
      totalMeetings,
      activeMeetings,
      completedMeetings,
      cancelledMeetings,
      totalParticipants,
      averageRating,
      totalHours,
      popularTopics,
      levelDistribution,
      monthlyStats,
      recentActivity
    };
  };

  const getTopicLabel = (topic: string) => {
    return t[topic as keyof typeof t] || topic;
  };

  const getLevelLabel = (level: string) => {
    return t[level as keyof typeof t] || level;
  };

  const getTopicIcon = (topic: string) => {
    const icons: { [key: string]: string } = {
      daily: '💬',
      business: '💼',
      education: '📚',
      science: '🔬',
      technology: '💻',
      arts: '🎨',
      travel: '✈️',
      food: '🍽️',
      sports: '⚽',
      health: '🏥',
      environment: '🌱',
      entertainment: '🎮'
    };
    return icons[topic] || '📊';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-xl max-w-md shadow-lg">
          <h2 className="text-lg font-semibold mb-3 text-red-600">{t.error}</h2>
          <p className="text-slate-600">{error}</p>
        </div>
      </div>
    );
  }

  if (!statistics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-xl max-w-md shadow-lg">
          <h2 className="text-lg font-semibold mb-3">{t.noData}</h2>
          <p className="text-slate-600">Henüz istatistik verisi bulunmuyor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="max-w-7xl mx-auto p-6 space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-3">
              <BarChart size={32} className="text-blue-600" />
              {t.statistics}
            </h1>
            <p className="text-slate-600 mt-2">
              {lang === 'tr' 
                ? 'Toplantı performansınızı ve katılımcı etkileşimlerinizi analiz edin'
                : 'Analyze your meeting performance and participant interactions'
              }
            </p>
          </div>
          
          {/* Dil Seçici */}
          <div className="flex items-center gap-2 bg-white rounded-lg p-1 shadow-sm">
            <button
              onClick={() => setLang('en')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'en' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              EN
            </button>
            <button
              onClick={() => setLang('tr')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                lang === 'tr' 
                  ? 'bg-blue-600 text-white shadow-sm' 
                  : 'text-slate-600 hover:text-slate-800'
              }`}
            >
              TR
            </button>
          </div>
        </div>

        {/* Zaman Filtresi */}
        <div className="flex items-center gap-2 bg-white rounded-xl p-1 shadow-sm w-fit">
          <button
            onClick={() => setTimeFilter('month')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'month' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {t.thisMonth}
          </button>
          <button
            onClick={() => setTimeFilter('year')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'year' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {t.thisYear}
          </button>
          <button
            onClick={() => setTimeFilter('all')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              timeFilter === 'all' 
                ? 'bg-blue-600 text-white shadow-sm' 
                : 'text-slate-600 hover:text-slate-800'
            }`}
          >
            {lang === 'tr' ? 'Tümü' : 'All Time'}
          </button>
        </div>

        {/* Genel Bakış Kartları */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.totalMeetings}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.totalMeetings}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp size={16} className="text-green-600" />
                  <span className="text-green-600 text-sm font-medium">+12%</span>
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
                <p className="text-slate-600 text-sm font-medium">{t.totalParticipants}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.totalParticipants}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp size={16} className="text-green-600" />
                  <span className="text-green-600 text-sm font-medium">+8%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Users size={24} className="text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.averageRating}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.averageRating.toFixed(1)}</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp size={16} className="text-green-600" />
                  <span className="text-green-600 text-sm font-medium">+0.3</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
                <Star size={24} className="text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-600 text-sm font-medium">{t.totalHours}</p>
                <p className="text-3xl font-bold text-slate-800 mt-2">{statistics.totalHours}h</p>
                <div className="flex items-center gap-1 mt-2">
                  <ArrowUp size={16} className="text-green-600" />
                  <span className="text-green-600 text-sm font-medium">+15%</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Clock size={24} className="text-purple-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Ana İçerik Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Sol Kolon - Performans Metrikleri */}
          <div className="lg:col-span-2 space-y-6">
            {/* Aylık İstatistikler */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <TrendingUp size={20} className="text-blue-600" />
                  {t.monthlyStats}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {statistics.monthlyStats.map((stat, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar size={20} className="text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{stat.month}</p>
                          <p className="text-sm text-slate-600">{stat.meetings} {t.totalMeetings.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-slate-800">{stat.participants}</p>
                        <p className="text-sm text-slate-600">{t.totalParticipants.toLowerCase()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Popüler Konular */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-green-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Target size={20} className="text-green-600" />
                  {t.popularTopics}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {statistics.popularTopics.map((topic, index) => (
                    <div key={index} className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center text-lg">
                          {getTopicIcon(topic.topic)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-800">{getTopicLabel(topic.topic)}</p>
                          <p className="text-sm text-slate-600">{topic.count} {t.totalMeetings.toLowerCase()}</p>
                        </div>
                      </div>
                      <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-green-500 rounded-full transition-all duration-300"
                          style={{ width: `${(topic.count / Math.max(...statistics.popularTopics.map(t => t.count))) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Sağ Kolon - Detaylar */}
          <div className="space-y-6">
            {/* Seviye Dağılımı */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-purple-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Activity size={20} className="text-purple-600" />
                  {t.levelDistribution}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {statistics.levelDistribution.map((level, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                          <Award size={16} className="text-purple-600" />
                        </div>
                        <span className="font-medium text-slate-800">{getLevelLabel(level.level)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-purple-500 rounded-full transition-all duration-300"
                            style={{ width: `${(level.count / Math.max(...statistics.levelDistribution.map(l => l.count))) * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-semibold text-slate-600">{level.count}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Son Aktiviteler */}
            <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
              <div className="bg-gradient-to-r from-slate-50 to-orange-50 px-6 py-4 border-b border-slate-200">
                <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                  <Zap size={20} className="text-orange-600" />
                  {t.recentActivity}
                </h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {statistics.recentActivity.map((activity, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl">
                      <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Eye size={16} className="text-orange-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-800 text-sm">{activity.action}</p>
                        <p className="text-xs text-slate-600 mt-1">{activity.details}</p>
                        <p className="text-xs text-slate-500 mt-1">
                          {activity.date.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Performans Özeti */}
            <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl shadow-lg p-6 text-white">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Heart size={20} className="text-blue-200" />
                {t.performanceMetrics}
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">{t.meetingSuccess}</span>
                  <span className="font-semibold">94%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">{t.participantSatisfaction}</span>
                  <span className="font-semibold">4.2/5</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">{t.timeEfficiency}</span>
                  <span className="font-semibold">87%</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-blue-100">{t.engagementRate}</span>
                  <span className="font-semibold">92%</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 