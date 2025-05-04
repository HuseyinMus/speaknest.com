'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { useAuth } from '@/lib/context/AuthContext';
import { db, collections } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Users, Clock, MessageCircle, Video } from 'lucide-react';
import { format, isAfter, isBefore } from 'date-fns';
import { tr } from 'date-fns/locale';

interface Meeting {
  id: string;
  title: string;
  description: string;
  startTime: Date;
  level: string;
  topic: string;
  participantCount: number;
  maxParticipants: number;
  hostName: string;
  hostPhotoURL: string;
  meetUrl?: string;
}

export default function MyMeetingsPage() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;

      try {
        // Kullanıcının kayıtlı olduğu toplantıları çek
        const userDocRef = doc(db, collections.users, user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        const registeredMeetingIds = userData?.registeredMeetings || [];

        if (registeredMeetingIds.length === 0) {
          setMeetings([]);
          return;
        }

        // Kayıtlı toplantıların detaylarını çek
        const meetingsRef = collection(db, collections.meetings);
        const q = query(
          meetingsRef,
          where('id', 'in', registeredMeetingIds)
        );
        const querySnapshot = await getDocs(q);
        
        const meetingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          startTime: doc.data().startTime?.toDate()
        })) as Meeting[];

        setMeetings(meetingsData);
      } catch (error) {
        console.error('Toplantılar yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [user]);

  const handleJoinMeeting = (meeting: Meeting) => {
    if (meeting.meetUrl) {
      window.open(meeting.meetUrl, '_blank');
    }
  };

  const isMeetingActive = (meeting: Meeting) => {
    const now = new Date();
    const startTime = new Date(meeting.startTime);
    const endTime = new Date(startTime.getTime() + 60 * 60 * 1000); // 1 saat sonra
    return isAfter(now, startTime) && isBefore(now, endTime);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t('myMeetings')}</h1>

      {meetings.length === 0 ? (
        <div className="text-center py-12">
          <h2 className="text-xl font-semibold mb-4">{t('noMeetingsYet')}</h2>
          <p className="text-muted-foreground">{t('myMeetingsDescription')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {meetings.map((meeting) => (
            <Card key={meeting.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <CardTitle>{meeting.title}</CardTitle>
                <CardDescription>{meeting.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Users className="mr-2 h-4 w-4" />
                    <span>
                      {meeting.participantCount}/{meeting.maxParticipants} {t('participants')}
                    </span>
                  </div>
                  <div className="flex items-center text-sm">
                    <MessageCircle className="mr-2 h-4 w-4" />
                    <span>{t(`level_${meeting.level}`)}</span>
                  </div>
                  <div className="flex items-center text-sm">
                    <Clock className="mr-2 h-4 w-4" />
                    <span>
                      {format(meeting.startTime, 'dd MMMM yyyy HH:mm', { locale: tr })}
                    </span>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button
                  className="w-full"
                  onClick={() => handleJoinMeeting(meeting)}
                  disabled={!isMeetingActive(meeting) || !meeting.meetUrl}
                >
                  <Video className="mr-2 h-4 w-4" />
                  {isMeetingActive(meeting) ? t('joinMeeting') : t('meetingNotStarted')}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 