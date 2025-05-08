'use client';

import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Meeting } from '@/lib/types';
import { MeetingList } from './components/MeetingList';
import { db, collections } from '@/lib/firebase/config';
import { collection, query, where, getDocs, doc, getDoc, updateDoc } from 'firebase/firestore';
import { useAuth } from '@/lib/context/AuthContext';

export default function UpcomingMeetingsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [favoriteMeetings, setFavoriteMeetings] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMeetings = async () => {
      if (!user) return;

      try {
        // Yaklaşan toplantıları çek
        const meetingsRef = collection(db, collections.meetings);
        const q = query(
          meetingsRef,
          where('date', '>=', new Date()),
          where('status', '==', 'upcoming')
        );
        const querySnapshot = await getDocs(q);
        
        const meetingsData = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        })) as Meeting[];

        setMeetings(meetingsData);

        // Favori toplantıları çek
        const userDocRef = doc(db, collections.users, user.uid);
        const userDoc = await getDoc(userDocRef);
        const userData = userDoc.data();
        setFavoriteMeetings(userData?.favoriteMeetings || []);
      } catch (error) {
        console.error('Toplantılar yüklenirken hata oluştu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMeetings();
  }, [user]);

  const handleJoinMeeting = (meetingId: string) => {
    window.location.href = `/student-panel/meeting/${meetingId}`;
  };

  const handleFavoriteMeeting = async (meetingId: string) => {
    if (!user) return;

    try {
      const isFavorite = favoriteMeetings.includes(meetingId);
      const newFavorites = isFavorite
        ? favoriteMeetings.filter(id => id !== meetingId)
        : [...favoriteMeetings, meetingId];

      setFavoriteMeetings(newFavorites);

      // Firebase'de güncelle
      const userDocRef = doc(db, collections.users, user.uid);
      await updateDoc(userDocRef, {
        favoriteMeetings: newFavorites
      });
    } catch (error) {
      console.error('Favori güncellenirken hata oluştu:', error);
    }
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
      <h1 className="text-3xl font-bold mb-8">{t('upcomingMeetings')}</h1>
      <MeetingList
        meetings={meetings}
        favoriteMeetings={favoriteMeetings}
        onJoin={handleJoinMeeting}
        onFavorite={handleFavoriteMeeting}
      />
    </div>
  );
} 