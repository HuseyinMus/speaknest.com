'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, doc, getDoc } from 'firebase/firestore';
import { Calendar, Users, Clock, Star, TrendingUp, Award, Bell, MessageCircle, CheckCircle, BookOpen, Plus } from 'lucide-react';

// Kullanıcı profili interface'i
interface UserProfile {
  displayName?: string;
  email?: string;
  photoURL?: string;
  role?: string;
  createdAt?: { seconds: number };
  englishLevel?: string;
  firstName?: string;
  lastName?: string;
}

// Toplantı interface'i
interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  level: string;
  topic: string;
  participantCount: number;
  status: string;
  participants: Array<{
    id: string;
    name: string;
    email: string;
  }>;
  hostName: string;
  hostPhotoURL: string;
  meetUrl?: string;
  maxParticipants: number;
}

// İstatistik interface'i
interface Statistics {
  totalMeetings: number;
  monthlyMeetings: number;
  levelProgress: {
    beginner: number;
    intermediate: number;
    advanced: number;
  };
  topicDistribution: {
    [key: string]: number;
  };
}

const translations = {
  en: {
    welcome: "Welcome, ",
    createMeeting: "Create New Meeting",
    viewParticipants: "View Participants",
    activeMeetings: "Active Meetings",
    noActiveMeetings: "No active meetings.",
    upcomingMeetings: "Upcoming Meetings",
    noUpcomingMeetings: "No upcoming meetings scheduled.",
    participants: "Participants",
    join: "Join",
    edit: "Edit",
    conversationHost: "Conversation Host",
    todayStats: "Today's Statistics",
    totalMeetings: "Total Meetings",
    totalParticipants: "Total Participants",
    averageRating: "Average Rating",
    thisMonth: "This Month",
    thisWeek: "This Week",
    today: "Today",
    level: "Level",
    topic: "Topic",
    meetingTitle: "Meeting Title",
    meetingDescription: "Meeting Description",
    meetingDate: "Meeting Date",
    meetingTime: "Meeting Time",
    participantCount: "Participant Count",
    addKeyword: "Add keyword",
    addQuestion: "Add question",
    keywords: "Keywords",
    questions: "Questions",
    submit: "Create Meeting",
    creating: "Creating...",
    success: "Meeting created successfully!",
    error: "An error occurred while creating the meeting.",
    // Level translations
    beginner: "Beginner",
    intermediate: "Intermediate", 
    advanced: "Advanced",
    any: "Any Level",
    // Topic translations
    daily: "Daily Conversation",
    business: "Business",
    education: "Education/School",
    science: "Science",
    technology: "Technology",
    arts: "Arts & Culture",
    travel: "Travel",
    food: "Food & Cooking",
    sports: "Sports",
    health: "Health & Wellness",
    environment: "Environment",
    entertainment: "Entertainment & Hobbies",
  },
  tr: {
    welcome: "Hoş geldiniz, ",
    createMeeting: "Yeni Toplantı Oluştur",
    viewParticipants: "Katılımcıları Görüntüle",
    activeMeetings: "Aktif Toplantılar",
    noActiveMeetings: "Aktif toplantınız bulunmuyor.",
    upcomingMeetings: "Yaklaşan Toplantılar",
    noUpcomingMeetings: "Yaklaşan toplantı planlanmamış.",
    participants: "Katılımcılar",
    join: "Katıl",
    edit: "Düzenle",
    conversationHost: "Konuşma Sunucusu",
    todayStats: "Bugünün İstatistikleri",
    totalMeetings: "Toplam Toplantı",
    totalParticipants: "Toplam Katılımcı",
    averageRating: "Ortalama Puan",
    thisMonth: "Bu Ay",
    thisWeek: "Bu Hafta",
    today: "Bugün",
    level: "Seviye",
    topic: "Konu",
    meetingTitle: "Toplantı Başlığı",
    meetingDescription: "Toplantı Açıklaması",
    meetingDate: "Toplantı Tarihi",
    meetingTime: "Toplantı Saati",
    participantCount: "Katılımcı Sayısı",
    addKeyword: "Anahtar kelime ekle",
    addQuestion: "Soru ekle",
    keywords: "Anahtar Kelimeler",
    questions: "Konu Soruları",
    submit: "Toplantı Oluştur",
    creating: "Oluşturuluyor...",
    success: "Toplantı başarıyla oluşturuldu!",
    error: "Toplantı oluşturulurken bir hata oluştu.",
    // Level translations
    beginner: "Başlangıç Seviyesi",
    intermediate: "Orta Seviye",
    advanced: "İleri Seviye",
    any: "Tüm Seviyeler",
    // Topic translations
    daily: "Günlük Konuşma",
    business: "İş Dünyası",
    education: "Eğitim/Okul",
    science: "Bilim",
    technology: "Teknoloji",
    arts: "Sanat ve Kültür",
    travel: "Seyahat",
    food: "Yemek ve Mutfak",
    sports: "Spor",
    health: "Sağlık ve Wellness",
    environment: "Çevre",
    entertainment: "Eğlence ve Hobiler",
  }
};

export default function Dashboard() {
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [activeMeetings, setActiveMeetings] = useState<Meeting[]>([]);
  const [upcomingMeetings, setUpcomingMeetings] = useState<Meeting[]>([]);
  const [statistics, setStatistics] = useState<Statistics>({
    totalMeetings: 0,
    monthlyMeetings: 0,
    levelProgress: {
      beginner: 0,
      intermediate: 0,
      advanced: 0
    },
    topicDistribution: {}
  });
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const t = translations[lang];

  // Kullanıcı bilgilerini ve verileri yükle
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            setUserProfile(user.toJSON());
            await Promise.all([
              fetchActiveMeetings(user.uid),
              fetchUpcomingMeetings(user.uid),
              fetchStatistics(user.uid)
            ]);
          } else {
            router.push('/login');
          }
          setLoading(false);
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Kullanıcı verisi yüklenirken hata:', err);
        setLoading(false);
      }
    };
    
    loadUserData();
  }, [router]);
  
  // Aktif toplantıları getir
  const fetchActiveMeetings = async (userId: string) => {
    try {
      const meetingsRef = collection(db, 'meetings');
      const q = query(
        meetingsRef,
        where('hostId', '==', userId),
        where('status', '==', 'active'),
        orderBy('startTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const meetings: Meeting[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        meetings.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          startTime: data.startTime.toDate(),
          level: data.level,
          topic: data.topic,
          participantCount: data.participantCount,
          status: data.status,
          participants: data.participants || [],
          hostName: data.hostName,
          hostPhotoURL: data.hostPhotoURL,
          meetUrl: data.meetUrl,
          maxParticipants: data.maxParticipants || 6
        });
      });
      
      setActiveMeetings(meetings);
    } catch (error) {
      console.error('Aktif toplantılar yüklenirken hata:', error);
    }
  };
  
  // Yaklaşan toplantıları getir
  const fetchUpcomingMeetings = async (userId: string) => {
    try {
      const meetingsRef = collection(db, 'meetings');
      const q = query(
        meetingsRef,
        where('hostId', '==', userId),
        where('status', '==', 'scheduled'),
        orderBy('startTime', 'asc')
      );
      
      const querySnapshot = await getDocs(q);
      const meetings: Meeting[] = [];
      const now = new Date();
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        const meetingStartTime = data.startTime.toDate();
        
        if (meetingStartTime > now) {
          meetings.push({
            id: doc.id,
            title: data.title,
            description: data.description,
            startTime: meetingStartTime,
            level: data.level,
            topic: data.topic,
            participantCount: data.participantCount,
            status: data.status,
            participants: data.participants || [],
            hostName: data.hostName,
            hostPhotoURL: data.hostPhotoURL,
            meetUrl: data.meetUrl,
            maxParticipants: data.maxParticipants || 6
          });
        }
      });
      
      setUpcomingMeetings(meetings);
    } catch (error) {
      console.error('Yaklaşan toplantılar yüklenirken hata:', error);
    }
  };
  
  // İstatistikleri getir
  const fetchStatistics = async (userId: string) => {
    try {
      const meetingsRef = collection(db, 'meetings');
      const q = query(
        meetingsRef,
        where('hostId', '==', userId),
        orderBy('startTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const meetings: Meeting[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        meetings.push({
          id: doc.id,
          title: data.title,
          description: data.description,
          startTime: data.startTime.toDate(),
          level: data.level,
          topic: data.topic,
          participantCount: data.participantCount,
          status: data.status,
          participants: data.participants || [],
          hostName: data.hostName,
          hostPhotoURL: data.hostPhotoURL,
          meetUrl: data.meetUrl,
          maxParticipants: data.maxParticipants || 6
        });
      });
      
      // İstatistikleri hesapla
      const now = new Date();
      const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      
      const totalMeetings = meetings.length;
      const monthlyMeetings = meetings.filter(m => m.startTime >= thisMonth).length;
      
      const levelProgress = {
        beginner: meetings.filter(m => m.level === 'beginner').length,
        intermediate: meetings.filter(m => m.level === 'intermediate').length,
        advanced: meetings.filter(m => m.level === 'advanced').length
      };
      
      const topicDistribution: { [key: string]: number } = {};
      meetings.forEach(m => {
        topicDistribution[m.topic] = (topicDistribution[m.topic] || 0) + 1;
      });
      
      setStatistics({
        totalMeetings,
        monthlyMeetings,
        levelProgress,
        topicDistribution
      });
    } catch (error) {
      console.error('İstatistikler yüklenirken hata:', error);
    }
  };

  // Level çevirisi
  const getLevelTranslation = (level: string) => {
    switch(level) {
      case 'beginner': return t.beginner;
      case 'intermediate': return t.intermediate;
      case 'advanced': return t.advanced;
      case 'any': return t.any;
      default: return level;
    }
  };

  // Topic çevirisi
  const getTopicTranslation = (topic: string) => {
    switch(topic) {
      case 'daily': return t.daily;
      case 'business': return t.business;
      case 'education': return t.education;
      case 'science': return t.science;
      case 'technology': return t.technology;
      case 'arts': return t.arts;
      case 'travel': return t.travel;
      case 'food': return t.food;
      case 'sports': return t.sports;
      case 'health': return t.health;
      case 'environment': return t.environment;
      case 'entertainment': return t.entertainment;
      default: return topic;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Yükleniyor...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hoş geldin kartı */}
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl shadow-lg p-6 border border-blue-400/30">
        <h2 className="text-2xl font-semibold text-white mb-2">
          {t.welcome}{userProfile?.displayName || userProfile?.firstName || "Kullanıcı"}
        </h2>
        <p className="text-white/90 mb-6">Konuşma sunucusu olarak bugün yeni bir toplantı oluşturabilir ve İngilizce pratik yapmak isteyen öğrencilere yardımcı olabilirsiniz.</p>
        <div className="flex flex-wrap gap-3">
          <button 
            onClick={() => router.push('/prouser-panel/create-meeting')}
            className="px-5 py-2.5 bg-white hover:bg-blue-50 text-blue-700 rounded-lg transition-colors text-sm font-medium shadow-sm flex items-center gap-2"
          >
            <Plus size={16} />
            {t.createMeeting}
          </button>
          <button 
            onClick={() => router.push('/prouser-panel/my-meetings')}
            className="px-5 py-2.5 bg-blue-700/30 hover:bg-blue-700/40 text-white rounded-lg transition-colors text-sm font-medium shadow-sm border border-white/10 flex items-center gap-2"
          >
            <Users size={16} />
            {t.viewParticipants}
          </button>
        </div>
      </div>
      
      {/* İstatistik kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{t.totalMeetings}</p>
              <p className="text-2xl font-bold text-slate-800">{statistics.totalMeetings}</p>
              <p className="text-xs text-green-600 mt-1">+{statistics.monthlyMeetings} {t.thisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Calendar size={24} className="text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{t.totalParticipants}</p>
              <p className="text-2xl font-bold text-slate-800">
                {activeMeetings.reduce((sum, meeting) => sum + meeting.participants.length, 0)}
              </p>
              <p className="text-xs text-green-600 mt-1">+{upcomingMeetings.length} {t.upcomingMeetings}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users size={24} className="text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">{t.averageRating}</p>
              <p className="text-2xl font-bold text-slate-800">4.8</p>
              <p className="text-xs text-green-600 mt-1">+0.2 {t.thisWeek}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Star size={24} className="text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md border border-slate-200/50 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-slate-600">Toplam Saat</p>
              <p className="text-2xl font-bold text-slate-800">
                {Math.round(statistics.totalMeetings * 1.5)}
              </p>
              <p className="text-xs text-green-600 mt-1">+{statistics.monthlyMeetings * 1.5} {t.thisMonth}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Clock size={24} className="text-purple-600" />
            </div>
          </div>
        </div>
      </div>
      
      {/* Aktif Toplantılarım */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-700 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-medium text-white flex items-center gap-2">
            <Calendar size={18} />
            {t.activeMeetings}
          </h2>
          <button 
            onClick={() => router.push('/prouser-panel/create-meeting')}
            className="text-xs bg-white/20 hover:bg-white/30 text-white px-3 py-1 rounded-full transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <Plus size={12} />
              {t.createMeeting}
            </span>
          </button>
        </div>
        <div className="p-6">
          {activeMeetings.length > 0 ? (
            <div className="grid gap-4">
              {activeMeetings.map((meeting) => (
                <div key={meeting.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-blue-200 transition-all duration-200 bg-white">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-slate-800">{meeting.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                        Aktif
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {getLevelTranslation(meeting.level)}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mt-2 mb-3">{meeting.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <MessageCircle size={12} />
                      {getTopicTranslation(meeting.topic)}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Users size={12} />
                      {meeting.participants.length}/{meeting.maxParticipants} {t.participants}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {meeting.startTime.toLocaleDateString()}, 
                      {meeting.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <button 
                      className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg hover:bg-slate-300 transition-colors text-sm font-medium flex items-center gap-1"
                      onClick={() => console.log('Edit meeting:', meeting.id)}
                    >
                      {t.edit}
                    </button>
                    {meeting.meetUrl && (
                      <a 
                        href={meeting.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm flex items-center gap-1"
                      >
                        {t.join} <Calendar size={14} />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 rounded-xl bg-slate-50/50 border border-slate-100">
              <Calendar size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 mb-4">{t.noActiveMeetings}</p>
              <button 
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm inline-flex items-center gap-2"
                onClick={() => router.push('/prouser-panel/create-meeting')}
              >
                <Plus size={16} />
                {t.createMeeting}
              </button>
            </div>
          )}
          
          <div className="mt-6 text-right">
            <button 
              className="text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors inline-flex items-center gap-1"
              onClick={() => router.push('/prouser-panel/my-meetings')}
            >
              {t.viewParticipants} <Calendar size={16} />
            </button>
          </div>
        </div>
      </div>
      
      {/* Yaklaşan Toplantılar */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
        <div className="bg-gradient-to-r from-slate-700 to-slate-800 px-6 py-3.5 flex items-center justify-between">
          <h2 className="text-base font-medium text-white flex items-center gap-2">
            <Clock size={18} />
            {t.upcomingMeetings}
          </h2>
        </div>
        <div className="p-6">
          {upcomingMeetings.length > 0 ? (
            <div className="grid gap-4">
              {upcomingMeetings.slice(0, 3).map((meeting) => (
                <div key={meeting.id} className="border border-slate-200 rounded-xl p-5 hover:shadow-md hover:border-slate-300 transition-all duration-200 bg-white">
                  <div className="flex justify-between items-start">
                    <h3 className="text-lg font-medium text-slate-800">{meeting.title}</h3>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        Zamanlanmış
                      </span>
                      <span className="px-2.5 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                        {getLevelTranslation(meeting.level)}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mt-2 mb-3">{meeting.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <MessageCircle size={12} />
                      {getTopicTranslation(meeting.topic)}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-100 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Users size={12} />
                      {meeting.participants.length}/{meeting.maxParticipants} {t.participants}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1">
                      <Clock size={12} />
                      {meeting.startTime.toLocaleDateString()}, 
                      {meeting.startTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 rounded-xl bg-slate-50/50 border border-slate-100">
              <Clock size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 mb-4">{t.noUpcomingMeetings}</p>
              <button 
                className="px-5 py-2.5 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg hover:from-slate-700 hover:to-slate-800 transition-colors text-sm font-medium shadow-sm inline-flex items-center gap-2"
                onClick={() => router.push('/prouser-panel/create-meeting')}
              >
                <Plus size={16} />
                {t.createMeeting}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 