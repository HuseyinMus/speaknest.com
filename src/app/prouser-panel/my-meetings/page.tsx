'use client';

import { useState, useEffect } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Calendar, Users, Clock, MessageCircle, Plus } from 'lucide-react';

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

const translations = {
  en: {
    myMeetings: "My Meetings",
    activeMeetings: "Active Meetings",
    scheduledMeetings: "Scheduled Meetings",
    completedMeetings: "Completed Meetings",
    cancelledMeetings: "Cancelled Meetings",
    noMeetings: "No meetings found.",
    participants: "Participants",
    join: "Join",
    edit: "Edit",
    cancel: "Cancel",
    level: "Level",
    topic: "Topic",
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
    myMeetings: "Toplantılarım",
    activeMeetings: "Aktif Toplantılar",
    scheduledMeetings: "Zamanlanmış Toplantılar",
    completedMeetings: "Tamamlanan Toplantılar",
    cancelledMeetings: "İptal Edilen Toplantılar",
    noMeetings: "Toplantı bulunamadı.",
    participants: "Katılımcılar",
    join: "Katıl",
    edit: "Düzenle",
    cancel: "İptal Et",
    level: "Seviye",
    topic: "Konu",
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

export default function MyMeetings() {
  const router = useRouter();
  
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [lang, setLang] = useState<'en' | 'tr'>('en');
  const t = translations[lang];

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUserProfile(user.toJSON());
        await fetchMeetings(user.uid);
      } else {
        router.push('/login');
      }
      setLoading(false);
    });
    
    return () => unsubscribe();
  }, [router]);
  
  const fetchMeetings = async (userId: string) => {
    try {
      const meetingsRef = collection(db, 'meetings');
      const q = query(
        meetingsRef,
        where('hostId', '==', userId),
        orderBy('startTime', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const meetingsData: Meeting[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        meetingsData.push({
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
      
      setMeetings(meetingsData);
    } catch (error) {
      console.error('Toplantılar yüklenirken hata:', error);
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

  // Toplantıları filtrele
  const getFilteredMeetings = () => {
    const now = new Date();
    
    // Geçmiş toplantıları completed olarak işaretle
    const processedMeetings = meetings.map(meeting => {
      if (meeting.status === 'active' && meeting.startTime < now) {
        return { ...meeting, status: 'completed' };
      }
      return meeting;
    });
    
    switch (activeTab) {
      case 'active':
        return processedMeetings.filter(m => m.status === 'active' && m.startTime > now);
      case 'scheduled':
        return processedMeetings.filter(m => m.status === 'scheduled' && m.startTime > now);
      case 'completed':
        return processedMeetings.filter(m => m.status === 'completed' || (m.startTime < now && m.status === 'active'));
      case 'cancelled':
        return processedMeetings.filter(m => m.status === 'cancelled');
      default:
        return processedMeetings;
    }
  };

  // Gerçek toplantı sayılarını hesapla
  const getMeetingCounts = () => {
    const now = new Date();
    
    // Geçmiş toplantıları completed olarak işaretle
    const processedMeetings = meetings.map(meeting => {
      if (meeting.status === 'active' && meeting.startTime < now) {
        return { ...meeting, status: 'completed' };
      }
      return meeting;
    });
    
    return {
      total: processedMeetings.length,
      active: processedMeetings.filter(m => m.status === 'active' && m.startTime > now).length,
      scheduled: processedMeetings.filter(m => m.status === 'scheduled' && m.startTime > now).length,
      completed: processedMeetings.filter(m => m.status === 'completed' || (m.startTime < now && m.status === 'active')).length,
      cancelled: processedMeetings.filter(m => m.status === 'cancelled').length
    };
  };

  const meetingCounts = getMeetingCounts();

  const filteredMeetings = getFilteredMeetings();

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
      {/* Başlık */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-xl shadow-md p-6 text-white">
        <h2 className="text-xl font-semibold mb-1 flex items-center gap-2">
          <Calendar size={20} />
          {t.myMeetings}
        </h2>
        <p className="text-white/80">{t.myMeetings} - {t.activeMeetings}, {t.scheduledMeetings}, {t.completedMeetings}, {t.cancelledMeetings}</p>
      </div>
      
      {/* Tab Menüsü */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200/50 overflow-hidden">
        <div className="flex border-b border-slate-200">
          <div className="flex space-x-1 mb-6">
            <button
              onClick={() => setActiveTab('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'all'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.allMeetings} ({meetingCounts.total})
            </button>
            <button
              onClick={() => setActiveTab('active')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'active'
                  ? 'bg-green-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.activeMeetings} ({meetingCounts.active})
            </button>
            <button
              onClick={() => setActiveTab('scheduled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'scheduled'
                  ? 'bg-purple-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.scheduledMeetings} ({meetingCounts.scheduled})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'completed'
                  ? 'bg-gray-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.completedMeetings} ({meetingCounts.completed})
            </button>
            <button
              onClick={() => setActiveTab('cancelled')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                activeTab === 'cancelled'
                  ? 'bg-red-600 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {t.cancelledMeetings} ({meetingCounts.cancelled})
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {filteredMeetings.length > 0 ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredMeetings.map((meeting) => (
                <div key={meeting.id} className="border border-slate-200 rounded-2xl p-6 bg-white shadow-sm hover:shadow-lg transition-all duration-200 group relative overflow-hidden">
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-lg font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">{meeting.title}</h3>
                    <div className="flex items-center gap-2">
                      {/* Toplantı durumu badge */}
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold shadow-sm ${
                        meeting.status === 'active' ? 'bg-green-100 text-green-700' : 
                        meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        meeting.status === 'completed' ? 'bg-gray-100 text-gray-700' : 
                        'bg-red-100 text-red-700'
                      }`}>
                        {meeting.status === 'active' && t.activeMeetings}
                        {meeting.status === 'scheduled' && t.scheduledMeetings}
                        {meeting.status === 'completed' && t.completedMeetings}
                        {meeting.status === 'cancelled' && t.cancelledMeetings}
                      </span>
                      {/* Seviye badge */}
                      <span className="px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full text-xs font-medium border border-blue-100">
                        {getLevelTranslation(meeting.level)}
                      </span>
                    </div>
                  </div>
                  <p className="text-slate-600 text-sm mb-4 line-clamp-2 min-h-[40px]">{meeting.description}</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 rounded-full text-xs font-medium flex items-center gap-1 border border-indigo-100">
                      <MessageCircle size={12} />
                      {getTopicTranslation(meeting.topic)}
                    </span>
                    <span className="px-2.5 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium flex items-center gap-1 border border-purple-100">
                      <Users size={12} />
                      {meeting.participants.length}/{meeting.maxParticipants} {t.participants}
                    </span>
                    <span className="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full text-xs font-medium flex items-center gap-1 border border-amber-100">
                      <Clock size={12} />
                      {meeting.startTime.toLocaleDateString(lang === 'tr' ? 'tr-TR' : 'en-US', { day: '2-digit', month: 'short', year: 'numeric' })},
                      {meeting.startTime.toLocaleTimeString(lang === 'tr' ? 'tr-TR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <div className="flex justify-end gap-2 mt-2">
                    <button 
                      className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors text-sm font-medium flex items-center gap-1 border border-slate-200"
                      onClick={() => console.log('Edit meeting:', meeting.id)}
                    >
                      {t.edit}
                    </button>
                    {meeting.status === 'active' && meeting.meetUrl && new Date() < meeting.startTime && (
                      <a 
                        href={meeting.meetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm flex items-center gap-1 border border-blue-700"
                      >
                        {t.join} <Calendar size={14} />
                      </a>
                    )}
                    {(meeting.status === 'active' || meeting.status === 'scheduled') && new Date() < meeting.startTime && (
                      <button 
                        className="px-4 py-2 bg-red-50 text-red-700 rounded-lg hover:bg-red-100 transition-colors text-sm font-medium flex items-center gap-1 border border-red-200"
                        onClick={() => console.log('Cancel meeting:', meeting.id)}
                      >
                        {t.cancel}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 px-4 rounded-xl bg-slate-50/50 border border-slate-100">
              <Calendar size={40} className="mx-auto text-slate-400 mb-3" />
              <p className="text-slate-600 mb-4">{t.noMeetings}</p>
              <button 
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-lg hover:from-blue-700 hover:to-indigo-800 transition-colors text-sm font-medium shadow-sm inline-flex items-center gap-2"
                onClick={() => router.push('/prouser-panel/create-meeting')}
              >
                <Plus size={16} />
                {t.scheduledMeetings}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 