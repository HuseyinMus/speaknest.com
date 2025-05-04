'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useToast } from '@/lib/context/ToastContext';
import { Shimmer, ShimmerCard, ShimmerList } from '@/components/ui/Shimmer';
import { Calendar, Users, MessageCircle, Clock, CheckSquare, X } from 'lucide-react';

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

export default function SessionsPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState('');
  const toast = useToast();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showLateRegistrationModal, setShowLateRegistrationModal] = useState(false);
  const [lateRegistrationMessage, setLateRegistrationMessage] = useState('');

  // Toplantı verilerini getir
  const fetchMeetings = useCallback(async () => {
    try {
      const meetingsQuery = query(
        collection(db, 'meetings'),
        where('status', '==', 'active'),
        orderBy('startTime', 'asc')
      );
      
      const meetingsSnapshot = await getDocs(meetingsQuery);
      const meetingsData: Meeting[] = [];
      const now = new Date();
      
      meetingsSnapshot.forEach((doc) => {
        const data = doc.data();
        const meetingStartTime = data.startTime.toDate();
        
        // Sadece gelecekteki toplantıları göster
        if (meetingStartTime > now) {
          meetingsData.push({
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
            maxParticipants: data.maxParticipants
          });
        }
      });
      
      setMeetings(meetingsData);
      setLoading(false);
    } catch (err) {
      console.error('Toplantı verileri alınamadı:', err);
      setError(t('meetingsDataError', 'Toplantı verileri alınırken bir hata oluştu.'));
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
          if (user) {
            await fetchMeetings();
          } else {
            router.push('/login');
          }
        });
        
        return () => unsubscribe();
      } catch (err) {
        console.error('Auth kontrolü sırasında hata:', err);
        setError(t('sessionCheckError', 'Oturum kontrolü sırasında bir hata oluştu.'));
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router, fetchMeetings, t]);

  // Toplantı seviyesi için çevirileri manuel olarak yapan yardımcı fonksiyon
  const getLevelTranslation = (level: string) => {
    return t(`level_${level}`, getLevelFallback(level));
  };

  // Level için fallback değerlerini döndüren yardımcı fonksiyon
  const getLevelFallback = (level: string) => {
    switch(level) {
      case 'beginner': return 'Başlangıç Seviyesi';
      case 'intermediate': return 'Orta Seviye';
      case 'advanced': return 'İleri Seviye';
      case 'any': return 'Tüm Seviyeler';
      default: return level;
    }
  };

  // Toplantı konusu için çevirileri manuel olarak yapan yardımcı fonksiyon
  const getTopicTranslation = (topic: string) => {
    return t(`topic_${topic}`, getTopicFallback(topic));
  };

  // Topic için fallback değerlerini döndüren yardımcı fonksiyon
  const getTopicFallback = (topic: string) => {
    switch(topic) {
      case 'daily': return 'Günlük Konuşma';
      case 'business': return 'İş Dünyası';
      case 'education': return 'Eğitim/Okul';
      case 'science': return 'Bilim';
      case 'technology': return 'Teknoloji';
      case 'arts': return 'Sanat ve Kültür';
      case 'travel': return 'Seyahat';
      case 'food': return 'Yemek ve Mutfak';
      case 'sports': return 'Spor';
      case 'health': return 'Sağlık ve Wellness';
      case 'environment': return 'Çevre';
      case 'entertainment': return 'Eğlence ve Hobiler';
      default: return topic;
    }
  };

  // Toplantıya kayıt ol
  const registerToMeeting = async (meeting: Meeting) => {
    try {
      console.log('Kayıt işlemi başlatılıyor...');
      const user = auth.currentUser;
      if (!user) {
        console.error('Kullanıcı oturumu bulunamadı');
        toast.error(t('sessionCheckError'));
        return;
      }

      console.log('Kullanıcı:', user.uid);

      // Toplantının başlamasına 30 dakikadan az kaldıysa kayıt yapılamaz
      const now = new Date();
      const meetingStartTime = meeting.startTime;
      const timeDiff = meetingStartTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      console.log('Toplantı başlangıcına kalan süre:', minutesDiff, 'dakika');

      // Toplantı geçmiş mi kontrol et
      if (timeDiff < 0) {
        console.log('Toplantı geçmiş');
        toast.error(t('meetingPassed', 'Bu toplantı geçmiş.'));
        return;
      }

      if (minutesDiff < 30) {
        toast.error(t('registrationClosed', 'Toplantıya kayıt olmak için çok geç. Toplantı başlamasına 30 dakikadan az kaldı.'));
        return;
      }

      // Toplantı dolu mu kontrol et
      if (meeting.participants.length >= meeting.maxParticipants) {
        console.log('Toplantı dolu:', meeting.participants.length, '/', meeting.maxParticipants);
        toast.error(t('meetingFull', 'Bu toplantı dolu.'));
        return;
      }

      // Kullanıcı zaten kayıtlı mı kontrol et
      if (meeting.participants.some(p => p.id === user.uid)) {
        console.log('Kullanıcı zaten kayıtlı');
        toast.error(t('alreadyRegistered', 'Bu toplantıya zaten kayıtlısınız.'));
        return;
      }

      // 30 dakikadan az kala kayıt olma uyarısı
      if (minutesDiff < 60) {
        const message = `
          ⚠️ Önemli Bilgilendirme ⚠️

          Bu toplantıya kayıt olmak üzeresiniz, ancak toplantı başlamasına ${Math.ceil(minutesDiff)} dakika kaldı.

          Dikkat: Toplantı başlamasına 30 dakikadan az kaldığı için, kayıt olduktan sonra kaydınızı iptal edemeyeceksiniz.

          Devam etmek istiyor musunuz?
        `;
        setLateRegistrationMessage(message);
        setShowLateRegistrationModal(true);
        setSelectedMeeting(meeting);
        return;
      }

      // Normal kayıt işlemi
      await processRegistration(meeting);
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast.error(t('registrationError', 'Kayıt işlemi sırasında bir hata oluştu.'));
    }
  };

  // Kayıt işlemini gerçekleştir
  const processRegistration = async (meeting: Meeting) => {
    try {
      const user = auth.currentUser;
      if (!user) return;

      // Toplantıya kayıt ol
      const meetingRef = doc(db, 'meetings', meeting.id);
      await updateDoc(meetingRef, {
        participants: arrayUnion({
          id: user.uid,
          name: user.displayName || 'Anonim',
          email: user.email
        })
      });

      // Kullanıcının kayıtlarını güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        registeredMeetings: arrayUnion(meeting.id)
      });

      toast.success(t('registrationSuccess', 'Toplantıya başarıyla kayıt oldunuz.'));
      setIsRegistered(true);
      fetchMeetings(); // Toplantı listesini güncelle
    } catch (error) {
      console.error('Kayıt işlemi hatası:', error);
      toast.error(t('registrationError', 'Kayıt işlemi sırasında bir hata oluştu.'));
    }
  };

  // Toplantıdan kaydı iptal et
  const cancelRegistration = async (meeting: Meeting) => {
    try {
      const user = auth.currentUser;
      if (!user) {
        toast.error(t('sessionCheckError'));
        return;
      }

      // Toplantının başlamasına 30 dakikadan az kaldıysa iptal edilemez
      const now = new Date();
      const meetingStartTime = meeting.startTime;
      const timeDiff = meetingStartTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      if (minutesDiff < 30) {
        toast.error(t('cancellationClosed', 'Toplantıdan ayrılmak için çok geç. Toplantı başlamasına 30 dakikadan az kaldı.'));
        return;
      }

      // Toplantıdan kaydı iptal et
      const meetingRef = doc(db, 'meetings', meeting.id);
      await updateDoc(meetingRef, {
        participants: arrayRemove({
          id: user.uid,
          name: user.displayName || 'Anonim',
          email: user.email
        })
      });

      // Kullanıcının kayıtlarını güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        registeredMeetings: arrayRemove(meeting.id)
      });

      toast.success(t('cancellationSuccess', 'Toplantıdan ayrıldınız.'));
      setIsRegistered(false);
      fetchMeetings(); // Toplantı listesini güncelle
    } catch (error) {
      console.error('İptal hatası:', error);
      toast.error(t('cancellationError', 'İptal işlemi sırasında bir hata oluştu.'));
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col gap-6 p-6 bg-slate-50">
        <div className="bg-white p-6 shadow-md rounded-lg border-l-4 border-emerald-500">
          <Shimmer className="w-3/4" height="1.75rem" />
          <Shimmer className="w-1/2 mt-2" height="1rem" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ShimmerCard rows={2} />
          <ShimmerCard rows={1} />
        </div>
        
        <ShimmerList items={3} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="bg-white border border-slate-200 text-slate-700 px-6 py-5 rounded-lg max-w-md shadow-sm">
          <h2 className="text-lg font-semibold mb-3 text-red-600">{t('error')}</h2>
          <p className="text-slate-600">{error}</p>
          <button 
            onClick={() => router.push('/login')}
            className="mt-5 w-full py-2 px-4 rounded-md bg-slate-700 text-white font-medium hover:bg-slate-800 transition-colors"
          >
            {t('returnToLogin')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold text-slate-800 mb-8">{t('availableSessions', 'Mevcut Toplantılar')}</h1>
        
        {meetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {meetings.map((meeting) => {
              const isUserRegistered = meeting.participants.some(p => p.id === auth.currentUser?.uid);
              const now = new Date();
              const meetingStartTime = meeting.startTime;
              const timeDiff = meetingStartTime.getTime() - now.getTime();
              const minutesDiff = timeDiff / (1000 * 60);
              const canRegister = minutesDiff >= 30;

              return (
                <div key={meeting.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-slate-200 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <h2 className="text-xl font-bold text-slate-800">{meeting.title}</h2>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        meeting.status === 'active' ? 'bg-green-100 text-green-700' : 
                        meeting.status === 'scheduled' ? 'bg-blue-100 text-blue-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {meeting.status === 'active' ? t('active') : t('scheduled')}
                      </span>
                    </div>
                    
                    <p className="text-slate-600 text-sm mb-4">{meeting.description}</p>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <MessageCircle size={16} className="text-emerald-500" />
                        <span>{getTopicTranslation(meeting.topic)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Users size={16} className="text-blue-500" />
                        <span>{meeting.participants.length}/{meeting.maxParticipants} {t('participants')}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Calendar size={16} className="text-purple-500" />
                        <span className="font-medium">{meeting.startTime.toLocaleDateString()} {meeting.startTime.toLocaleTimeString()}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-slate-600">
                        <Clock size={16} className="text-orange-500" />
                        <span>{getLevelTranslation(meeting.level)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 mb-4">
                      <img 
                        src={meeting.hostPhotoURL || '/default-avatar.png'} 
                        alt={meeting.hostName}
                        className="w-8 h-8 rounded-full"
                      />
                      <span className="text-sm text-slate-600">{meeting.hostName}</span>
                    </div>

                    {isUserRegistered ? (
                      <button
                        onClick={() => cancelRegistration(meeting)}
                        className="w-full py-2 px-4 rounded-md bg-red-100 text-red-700 font-medium hover:bg-red-200 transition-colors"
                        disabled={!canRegister}
                      >
                        {t('cancelRegistration', 'Kaydı İptal Et')}
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setShowRegistrationModal(true);
                        }}
                        className="w-full py-2 px-4 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
                        disabled={!canRegister || meeting.participants.length >= meeting.maxParticipants}
                      >
                        {t('register', 'Kayıt Ol')}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-6 text-center">
            <p className="text-slate-600">{t('noMeetingsAvailable')}</p>
          </div>
        )}
      </div>

      {/* Kayıt Onay Modalı */}
      {showRegistrationModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{t('confirmRegistration', 'Kayıt Onayı')}</h3>
            <p className="text-slate-600 mb-6">
              {t('registrationConfirmation', 'Bu toplantıya kayıt olmak istediğinizden emin misiniz?')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="flex-1 py-2 px-4 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                {t('cancel', 'İptal')}
              </button>
              <button
                onClick={() => {
                  if (selectedMeeting) {
                    registerToMeeting(selectedMeeting);
                  }
                }}
                className="flex-1 py-2 px-4 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
              >
                {t('confirm', 'Onayla')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Geç Kayıt Uyarı Modalı */}
      {showLateRegistrationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 max-w-md w-full">
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock size={24} className="text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-800 mb-2">Geç Kayıt Uyarısı</h3>
              <p className="text-slate-600 whitespace-pre-line">{lateRegistrationMessage}</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => {
                  setShowLateRegistrationModal(false);
                  setSelectedMeeting(null);
                }}
                className="flex-1 py-2 px-4 rounded-md bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
              >
                {t('cancel', 'İptal')}
              </button>
              <button
                onClick={() => {
                  if (selectedMeeting) {
                    processRegistration(selectedMeeting);
                    setShowLateRegistrationModal(false);
                  }
                }}
                className="flex-1 py-2 px-4 rounded-md bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-colors"
              >
                {t('confirm', 'Onayla')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 