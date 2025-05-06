'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Users, Clock, MessageCircle, Video, Calendar, User } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';
import OneSignal from 'react-onesignal';

interface UserMeeting {
  id: string;
  userId: string;
  meetingId: string;
  meetingTitle: string;
  meetingDescription: string;
  startTime: Date;
  level: string;
  topic: string;
  hostName: string;
  hostPhotoURL: string;
  meetUrl?: string;
  registeredAt: Date;
  status: string;
}

export default function PracticeRoomsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<UserMeeting[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserMeetings = async () => {
      if (!user) {
        setError('Lütfen giriş yapın');
        setLoading(false);
        return;
      }

      try {
        const userMeetingsRef = collection(db, 'user_meetings');
        const q = query(
          userMeetingsRef,
          where('userId', '==', user.uid),
          where('status', '==', 'registered'),
          orderBy('startTime', 'asc')
        );
        
        const querySnapshot = await getDocs(q);
        const meetingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime.toDate(),
          registeredAt: doc.data().registeredAt.toDate()
        })) as UserMeeting[];

        setMeetings(meetingsData);
        setError(null);
      } catch (error) {
        console.error('Toplantılar yüklenirken hata oluştu:', error);
        setError('Toplantılar yüklenirken bir hata oluştu. Lütfen daha sonra tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    };

    fetchUserMeetings();
  }, [user]);

  // OneSignal başlat
  useEffect(() => {
    OneSignal.init({
      appId: 'ONESIGNAL_APP_ID', // Buraya kendi OneSignal App ID'ni yaz
      notifyButton: { enable: true },
      allowLocalhostAsSecureOrigin: true
    });
    // Kullanıcı ID'sini almak için window.OneSignal kullan (güvenli yol)
    setTimeout(() => {
      if (typeof window !== "undefined" && window.OneSignal) {
        window.OneSignal.push(function() {
          if (window.OneSignal.getUserId) {
            window.OneSignal.getUserId().then(function(userId) {
              if (userId) {
                localStorage.setItem('onesignal_user_id', userId);
              }
            });
          } else if (window.OneSignal.getExternalUserId) {
            window.OneSignal.getExternalUserId().then(function(userId) {
              if (userId) {
                localStorage.setItem('onesignal_user_id', userId);
              }
            });
          }
        });
      }
    }, 2000);
  }, []);

  // Toplantı başlamadan 15 dakika önce bildirim
  useEffect(() => {
    if (!meetings.length) return;
    const now = new Date();
    meetings.forEach(meeting => {
      const diffMs = new Date(meeting.startTime).getTime() - now.getTime();
      const diffMin = diffMs / (1000 * 60);
      if (diffMin > 0 && diffMin <= 15) {
        // Uygulama içi bildirim
        alert(`"${meeting.meetingTitle}" toplantısı 15 dakika içinde başlayacak!`);
        // OneSignal push bildirimi
        const onesignalUserId = localStorage.getItem('onesignal_user_id');
        if (onesignalUserId) {
          fetch('https://onesignal.com/api/v1/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': 'Basic ONESIGNAL_REST_API_KEY' // Buraya kendi REST API Key'ini yaz
            },
            body: JSON.stringify({
              app_id: 'ONESIGNAL_APP_ID',
              include_player_ids: [onesignalUserId],
              headings: { tr: 'Toplantı Yaklaşıyor!' },
              contents: { tr: `"${meeting.meetingTitle}" toplantısı 15 dakika içinde başlayacak.` }
            })
          });
        }
      }
    });
  }, [meetings]);

  const handleJoinMeeting = (meeting: UserMeeting) => {
    if (meeting.meetUrl) {
      window.open(meeting.meetUrl, '_blank');
    }
  };

  const isMeetingActive = (meeting: UserMeeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
    return isAfter(now, startTime) && isBefore(now, endTime);
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner':
        return {
          card: 'from-emerald-50 to-blue-50 border-emerald-200',
          badge: 'bg-emerald-100 text-emerald-800',
          button: 'bg-emerald-500 hover:bg-emerald-600',
          timeBox: 'bg-emerald-50 border-emerald-200'
        };
      case 'intermediate':
        return {
          card: 'from-blue-50 to-cyan-50 border-blue-200',
          badge: 'bg-blue-100 text-blue-800',
          button: 'bg-blue-500 hover:bg-blue-600',
          timeBox: 'bg-blue-50 border-blue-200'
        };
      case 'advanced':
        return {
          card: 'from-cyan-50 to-teal-50 border-cyan-200',
          badge: 'bg-cyan-100 text-cyan-800',
          button: 'bg-cyan-500 hover:bg-cyan-600',
          timeBox: 'bg-cyan-50 border-cyan-200'
        };
      default:
        return {
          card: 'from-gray-50 to-slate-50 border-gray-200',
          badge: 'bg-gray-100 text-gray-800',
          button: 'bg-gray-500 hover:bg-gray-600',
          timeBox: 'bg-gray-50 border-gray-200'
        };
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center text-red-500">
          <h2 className="text-xl font-semibold mb-4">{error}</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('practiceRooms')}</h1>
          <p className="text-slate-600">{t('practiceRoomsDescription', { default: 'Kayıtlı olduğunuz toplantılar burada listelenir.' })}</p>
        </div>

        {meetings.filter(meeting => {
          const now = new Date();
          const startTime = new Date(meeting.startTime);
          const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
          return endTime > now;
        }).length === 0 ? (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('noMeetingsYet')}</h2>
            <p className="text-slate-600">{t('myMeetingsDescription')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.filter(meeting => {
              const now = new Date();
              const startTime = new Date(meeting.startTime);
              const endTime = new Date(startTime.getTime() + 60 * 60 * 1000);
              return endTime > now;
            }).map((meeting) => {
              const colors = getLevelColor(meeting.level);
              return (
                <Card 
                  key={meeting.id} 
                  className={`bg-gradient-to-br ${colors.card} border ${colors.card} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <CardHeader className="border-b border-slate-100">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-800 mb-2">{meeting.meetingTitle}</CardTitle>
                        <CardDescription className="text-slate-600">{meeting.meetingDescription}</CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                        {t(`level_${meeting.level}`)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-3 pt-4 border-t border-slate-100">
                      <img 
                        src={meeting.hostPhotoURL || '/default-avatar.png'} 
                        alt={meeting.hostName}
                        className="w-10 h-10 rounded-full border-2 border-white shadow-sm"
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">{meeting.hostName}</p>
                        <p className="text-xs text-slate-500">{t('host')}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <div className={`p-3 rounded-lg border ${colors.timeBox} mb-4`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-sm font-medium text-slate-800">
                          <Calendar className="mr-2 h-4 w-4 text-slate-500" />
                          <span>{format(meeting.startTime, 'dd MMMM yyyy', { locale: tr })}</span>
                        </div>
                        <div className="flex items-center text-sm font-medium text-slate-800">
                          <Clock className="mr-2 h-4 w-4 text-slate-500" />
                          <span>{format(meeting.startTime, 'HH:mm', { locale: tr })}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-4">
                      <div className="flex items-center text-sm text-slate-600">
                        <MessageCircle className="mr-2 h-4 w-4 text-slate-400" />
                        <span>{t(`topic_${meeting.topic}`)}</span>
                      </div>
                      {!isMeetingActive(meeting) && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-md text-yellow-700 text-xs">
                          <Clock className="inline-block mr-1 h-3 w-3" />
                          {t('meetingNotStarted')}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter className="border-t border-slate-100 pt-6">
                    <Button
                      className={`w-full ${
                        isMeetingActive(meeting)
                          ? `${colors.button} text-white`
                          : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      }`}
                      onClick={() => handleJoinMeeting(meeting)}
                      disabled={!isMeetingActive(meeting) || !meeting.meetUrl}
                    >
                      <Video className="mr-2 h-4 w-4" />
                      {isMeetingActive(meeting) ? t('joinMeeting') : t('meetingNotStarted')}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
} 