'use client';

import { useState, useEffect, useCallback } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { useRouter } from 'next/navigation';
import { collection, query, where, getDocs, orderBy, doc, updateDoc, arrayUnion, arrayRemove, addDoc, deleteDoc } from 'firebase/firestore';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useToast } from '@/lib/context/ToastContext';
import { Shimmer, ShimmerCard, ShimmerList } from '@/components/ui/Shimmer';
import { Calendar, Users, MessageCircle, Clock, CheckSquare, X } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';

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
  const [filteredMeetings, setFilteredMeetings] = useState<Meeting[]>([]);
  const [error, setError] = useState('');
  const toast = useToast();
  const [showRegistrationModal, setShowRegistrationModal] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [showLateRegistrationModal, setShowLateRegistrationModal] = useState(false);
  const [lateRegistrationMessage, setLateRegistrationMessage] = useState('');
  
  // Filtreleme state'leri
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedTopic, setSelectedTopic] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Seviye renkleri
  const levelColors = {
    beginner: 'from-blue-400 to-blue-600',
    intermediate: 'from-purple-400 to-purple-600',
    advanced: 'from-red-400 to-red-600',
    any: 'from-green-400 to-green-600'
  };

  // Filtreleme fonksiyonu
  const filterMeetings = useCallback(() => {
    let filtered = [...meetings];

    // Seviye filtresi
    if (selectedLevel !== 'all') {
      filtered = filtered.filter(meeting => meeting.level === selectedLevel);
    }

    // Konu filtresi
    if (selectedTopic !== 'all') {
      filtered = filtered.filter(meeting => meeting.topic === selectedTopic);
    }

    // Arama filtresi
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(meeting => 
        meeting.title.toLowerCase().includes(query) ||
        meeting.description.toLowerCase().includes(query) ||
        meeting.hostName.toLowerCase().includes(query)
      );
    }

    setFilteredMeetings(filtered);
  }, [meetings, selectedLevel, selectedTopic, searchQuery]);

  // Filtreleme değişikliklerini izle
  useEffect(() => {
    filterMeetings();
  }, [filterMeetings]);

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
      setFilteredMeetings(meetingsData);
      setLoading(false);
    } catch (err) {
      console.error('Toplantı verileri alınamadı:', err);
      setError(t('sessionCheckError', { default: 'Oturum kontrolü sırasında bir hata oluştu.' }));
      setLoading(false);
    }
  }, []);

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
        setError(t('sessionCheckError', { default: 'Oturum kontrolü sırasında bir hata oluştu.' }));
        setLoading(false);
      }
    };
    
    checkAuth();
  }, [router, fetchMeetings, t]);

  // Toplantı seviyesi için çevirileri manuel olarak yapan yardımcı fonksiyon
  const getLevelTranslation = (level: string) => {
    return t(`level_${level}`, { default: getLevelFallback(level) });
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
    return t(`topic_${topic}`, { default: getTopicFallback(topic) });
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
        toast.error('Oturum bulunamadı');
        return;
      }

      // Kullanıcının mevcut kayıtlarını kontrol et
      const userMeetingsRef = collection(db, 'user_meetings');
      const userMeetingsQuery = query(
        userMeetingsRef,
        where('userId', '==', user.uid),
        where('meetingId', '==', meeting.id),
        where('status', '==', 'registered')
      );
      
      const userMeetingsSnapshot = await getDocs(userMeetingsQuery);
      if (!userMeetingsSnapshot.empty) {
        console.log('Kullanıcı zaten bu toplantıya kayıtlı');
        toast.error('Bu toplantıya zaten kayıtlısınız.');
        return;
      }

      // Toplantının başlamasına 30 dakikadan az kaldıysa kayıt yapılamaz
      const now = new Date();
      const meetingStartTime = meeting.startTime;
      const timeDiff = meetingStartTime.getTime() - now.getTime();
      const minutesDiff = timeDiff / (1000 * 60);

      console.log('Toplantı başlangıcına kalan süre:', minutesDiff, 'dakika');

      // Toplantı geçmiş mi kontrol et
      if (timeDiff < 0) {
        console.log('Toplantı geçmiş');
        toast.error('Bu toplantı geçmiş. Geçmiş toplantılara kayıt yapılamaz.');
        return;
      }

      if (minutesDiff < 30) {
        console.log('30 dakikadan az kaldı');
        const message = `Bu toplantıya kayıt olamazsınız çünkü toplantı başlamasına ${Math.ceil(minutesDiff)} dakika kaldı. Toplantı başlamasına 30 dakikadan az kaldığında kayıt yapılamaz.`;
        toast.error(message);
        return;
      }

      // Toplantı dolu mu kontrol et
      if (meeting.participants.length >= meeting.maxParticipants) {
        console.log('Toplantı dolu');
        toast.error('Bu toplantı dolu.');
        return;
      }

      // Kayıt işlemini gerçekleştir
      await processRegistration(meeting);
    } catch (error) {
      console.error('Kayıt hatası:', error);
      toast.error('Kayıt işlemi sırasında bir hata oluştu.');
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
        }),
        participantCount: meeting.participantCount + 1
      });

      // Kullanıcının kayıtlarını güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        registeredMeetings: arrayUnion(meeting.id)
      });

      // Kullanıcının toplantı koleksiyonuna ekle
      const userMeetingRef = collection(db, 'user_meetings');
      await addDoc(userMeetingRef, {
        userId: user.uid,
        meetingId: meeting.id,
        meetingTitle: meeting.title,
        meetingDescription: meeting.description,
        startTime: meeting.startTime,
        level: meeting.level,
        topic: meeting.topic,
        hostName: meeting.hostName,
        hostPhotoURL: meeting.hostPhotoURL,
        meetUrl: meeting.meetUrl,
        registeredAt: new Date(),
        status: 'registered'
      });

      toast.success(t('registrationSuccess', { default: 'Toplantıya başarıyla kayıt oldunuz.' }));
      setIsRegistered(true);
      fetchMeetings(); // Toplantı listesini güncelle
    } catch (error) {
      console.error('Kayıt işlemi hatası:', error);
      toast.error(t('registrationError', { default: 'Kayıt işlemi sırasında bir hata oluştu.' }));
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
        toast.error(t('cancellationClosed', { default: 'Toplantıdan ayrılmak için çok geç. Toplantı başlamasına 30 dakikadan az kaldı.' }));
        return;
      }

      // Kullanıcının user_meetings kaydını bul ve sil
      const userMeetingsRef = collection(db, 'user_meetings');
      const userMeetingsQuery = query(
        userMeetingsRef,
        where('userId', '==', user.uid),
        where('meetingId', '==', meeting.id),
        where('status', '==', 'registered')
      );
      
      const userMeetingsSnapshot = await getDocs(userMeetingsQuery);
      if (!userMeetingsSnapshot.empty) {
        const userMeetingDoc = userMeetingsSnapshot.docs[0];
        await deleteDoc(doc(db, 'user_meetings', userMeetingDoc.id));
      }

      // Toplantıdan kaydı iptal et
      const meetingRef = doc(db, 'meetings', meeting.id);
      await updateDoc(meetingRef, {
        participants: arrayRemove({
          id: user.uid,
          name: user.displayName || 'Anonim',
          email: user.email
        }),
        participantCount: meeting.participantCount - 1
      });

      // Kullanıcının kayıtlarını güncelle
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        registeredMeetings: arrayRemove(meeting.id)
      });

      toast.success(t('cancellationSuccess', { default: 'Toplantıdan ayrıldınız.' }));
      setIsRegistered(false);
      fetchMeetings(); // Toplantı listesini güncelle
    } catch (error) {
      console.error('İptal hatası:', error);
      toast.error(t('cancellationError', { default: 'İptal işlemi sırasında bir hata oluştu.' }));
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
        <div className="bg-white rounded-xl shadow-md p-6 mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">{t('availableSessions')}</h1>
          <p className="text-slate-600">{t('myMeetingsDescription', { default: 'Katılabileceğiniz toplantılar burada listelenir.' })}</p>
        </div>

        {/* Filtreleme Bölümü */}
        <div className="bg-white rounded-xl shadow-md p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Arama Kutusu */}
            <div className="relative">
              <input
                type="text"
                placeholder={t('search')}
                className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            {/* Seviye Filtresi */}
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
            >
              <option value="all">{t('allLevels')}</option>
              <option value="beginner">{t('level_beginner')}</option>
              <option value="intermediate">{t('level_intermediate')}</option>
              <option value="advanced">{t('level_advanced')}</option>
            </select>

            {/* Konu Filtresi */}
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
            >
              <option value="all">{t('allTopics')}</option>
              <option value="daily">{t('topic_daily')}</option>
              <option value="business">{t('topic_business')}</option>
              <option value="education">{t('topic_education')}</option>
              <option value="science">{t('topic_science')}</option>
              <option value="technology">{t('topic_technology')}</option>
              <option value="arts">{t('topic_arts')}</option>
              <option value="travel">{t('topic_travel')}</option>
              <option value="food">{t('topic_food')}</option>
              <option value="sports">{t('topic_sports')}</option>
              <option value="health">{t('topic_health')}</option>
              <option value="environment">{t('topic_environment')}</option>
              <option value="entertainment">{t('topic_entertainment')}</option>
            </select>
          </div>
        </div>

        {filteredMeetings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMeetings.map((meeting) => {
              const isUserRegistered = meeting.participants.some(p => p.id === auth.currentUser?.uid);
              const now = new Date();
              const meetingStartTime = meeting.startTime;
              const timeDiff = meetingStartTime.getTime() - now.getTime();
              const minutesDiff = timeDiff / (1000 * 60);
              const canRegister = minutesDiff >= 30;
              const colors = getLevelColor(meeting.level);

              return (
                <Card 
                  key={meeting.id} 
                  className={`bg-gradient-to-br ${colors.card} border ${colors.card} hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <CardTitle className="text-xl font-bold text-slate-800 mb-2">{meeting.title}</CardTitle>
                        <CardDescription className="text-slate-600">{meeting.description}</CardDescription>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors.badge}`}>
                        {getLevelTranslation(meeting.level)}
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
                  <CardContent>
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
                        <span>{getTopicTranslation(meeting.topic)}</span>
                      </div>
                      <div className="flex items-center text-sm text-slate-600">
                        <Users className="mr-2 h-4 w-4 text-slate-400" />
                        <span>{meeting.participants.length}/{meeting.maxParticipants} {t('participants')}</span>
                      </div>
                      {!canRegister && (
                        <div className="mt-2 p-2 bg-yellow-50 rounded-md text-yellow-700 text-xs">
                          <Clock className="inline-block mr-1 h-3 w-3" />
                          {t('registrationClosed', { default: 'Toplantı başlamasına 30 dakikadan az kaldığı için kayıt yapılamaz.' })}
                        </div>
                      )}
                    </div>
                  </CardContent>
                  <CardFooter>
                    {isUserRegistered ? (
                      <Button
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-3 px-6 rounded-xl shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:transform-none disabled:hover:shadow-md"
                        onClick={() => cancelRegistration(meeting)}
                        disabled={!canRegister}
                      >
                        <X className="h-5 w-5" />
                        <span className="text-base">{t('cancelRegistration')}</span>
                      </Button>
                    ) : (
                      <Button
                        className={`w-full font-semibold py-3 px-6 rounded-xl shadow-md transition-all duration-200 flex items-center justify-center gap-2
                          ${(!canRegister || meeting.participants.length >= meeting.maxParticipants)
                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                            : 'bg-emerald-500 hover:bg-emerald-600 text-white hover:shadow-lg transform hover:-translate-y-0.5 cursor-pointer'
                          }`}
                        onClick={() => {
                          setSelectedMeeting(meeting);
                          setShowRegistrationModal(true);
                        }}
                        disabled={!canRegister || meeting.participants.length >= meeting.maxParticipants}
                      >
                        {meeting.participants.length >= meeting.maxParticipants ? (
                          <>
                            <Users className="h-5 w-5" />
                            <span className="text-base">{t('meetingFull')}</span>
                          </>
                        ) : !canRegister ? (
                          <>
                            <Clock className="h-5 w-5" />
                            <span className="text-base">{t('registrationClosed')}</span>
                          </>
                        ) : (
                          <>
                            <CheckSquare className="h-5 w-5" />
                            <span className="text-base">{t('register')}</span>
                          </>
                        )}
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md p-8 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="w-8 h-8 text-slate-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-800 mb-2">{t('noMeetingsAvailable')}</h2>
            <p className="text-slate-600">{t('noMeetingsAvailableDescription', { default: 'Daha sonra tekrar kontrol edin.' })}</p>
          </div>
        )}
      </div>

      {/* Kayıt Onay Modalı */}
      {showRegistrationModal && selectedMeeting && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-slate-800 mb-4">{t('confirmRegistration')}</h3>
            <p className="text-slate-600 mb-6">
              {t('registrationConfirmation')}
            </p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowRegistrationModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-all duration-300 cursor-pointer"
              >
                {t('cancel')}
              </button>
              <button
                onClick={() => {
                  if (selectedMeeting) {
                    registerToMeeting(selectedMeeting);
                    setShowRegistrationModal(false);
                  }
                }}
                className="flex-1 py-2.5 px-4 rounded-lg bg-emerald-500 text-white font-medium hover:bg-emerald-600 transition-all duration-300 hover:shadow-md cursor-pointer"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Seviye renklerini belirleyen yardımcı fonksiyon
const getLevelColor = (level: string) => {
  switch (level) {
    case 'beginner':
      return {
        card: 'from-emerald-50 to-blue-50 border-emerald-200',
        badge: 'bg-emerald-100 text-emerald-800',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        cancelButton: 'bg-red-400 hover:bg-red-500',
        timeBox: 'bg-emerald-50 border-emerald-200'
      };
    case 'intermediate':
      return {
        card: 'from-blue-50 to-cyan-50 border-blue-200',
        badge: 'bg-blue-100 text-blue-800',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        cancelButton: 'bg-red-400 hover:bg-red-500',
        timeBox: 'bg-blue-50 border-blue-200'
      };
    case 'advanced':
      return {
        card: 'from-cyan-50 to-teal-50 border-cyan-200',
        badge: 'bg-cyan-100 text-cyan-800',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        cancelButton: 'bg-red-400 hover:bg-red-500',
        timeBox: 'bg-cyan-50 border-cyan-200'
      };
    default:
      return {
        card: 'from-gray-50 to-slate-50 border-gray-200',
        badge: 'bg-gray-100 text-gray-800',
        button: 'bg-emerald-500 hover:bg-emerald-600',
        cancelButton: 'bg-red-400 hover:bg-red-500',
        timeBox: 'bg-gray-50 border-gray-200'
      };
  }
}; 