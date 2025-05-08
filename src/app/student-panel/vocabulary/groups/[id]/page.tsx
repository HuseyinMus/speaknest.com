'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/context/AuthContext';
import { doc, getDoc, collection, getDocs, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { BookOpen, ArrowLeft, CheckCircle, XCircle, Clock, ThumbsUp, ThumbsDown, RefreshCw, HelpCircle, Smile, Meh, Volume2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface Word {
  id: string;
  english: string;
  turkish: string;
  example?: string;
  imageUrl?: string;
  pronunciation?: string;
  status?: 'new' | 'learning' | 'mastered';
  lastReview?: Date;
  nextReview?: Date;
}

interface WordGroup {
  id: string;
  title: string;
  description: string;
  words: Word[];
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface WordLearningStatus {
  userId: string;
  wordId: string;
  interval: number; // Days until next review
  easeFactor: number; // How easy the word is (default ~2.5)
  consecutiveCorrectReviews: number; // Number of times answered 'Good' or 'Easy' consecutively
  lastReviewed: Timestamp;
  nextReview: Timestamp;
  createdAt?: Timestamp; // Keep createdAt optional
  note?: string;
  skipped?: boolean;
}

export default function WordGroupPage({ params }: { params: { id: string } }) {
  // Debug loglar
  console.log('params:', params);
  const resolvedParams = React.use(params as unknown as React.Usable<{ id: string }>);
  console.log('resolvedParams:', resolvedParams);
  const id = resolvedParams.id;
  console.log('id:', id);

  const { t } = useTranslation();
  const router = useRouter();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [wordGroup, setWordGroup] = useState<WordGroup | null>(null);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [currentWordStatus, setCurrentWordStatus] = useState<WordLearningStatus | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [showCongrats, setShowCongrats] = useState(false);
  const [transitioning, setTransitioning] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [noteInput, setNoteInput] = useState('');
  const [noteSaving, setNoteSaving] = useState(false);
  const [wrongWords, setWrongWords] = useState<string[]>([]);
  const [reviewingWrong, setReviewingWrong] = useState(false);
  const [wrongIndex, setWrongIndex] = useState(0);

  const INITIAL_EASE_FACTOR = 2.5;
  const MIN_EASE_FACTOR = 1.3;

  // currentWordStatus fetch optimizasyonu
  const lastFetchedWordId = React.useRef<string | null>(null);

  // currentWord'u wrongWords veya normal akışa göre belirle
  const currentWord = reviewingWrong
    ? wordGroup?.words.find(w => w.id === wrongWords[wrongIndex])
    : wordGroup?.words[currentWordIndex];

  // currentWord değiştiğinde sadece fetchWordStatus çağır
  useEffect(() => {
    if (currentWord && user?.uid) {
      fetchWordStatus(currentWord.id);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord?.id, user?.uid]);

  // Otomatik sesli okuma sadece currentWord değiştiğinde çalışsın
  useEffect(() => {
    if (currentWord && currentWord.english) {
      speakWord(currentWord.english, 'en-US');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentWord?.id]);

  useEffect(() => {
    console.log('useEffect user:', user, 'id:', id);
    if (user && id) {
      fetchWordGroup(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, id]);

  const fetchWordGroup = async (groupId: string) => {
    setLoading(true);
    setFetchError(null);
    try {
      const wordGroupDocRef = doc(db, 'wordGroups', groupId);
      const wordGroupDocSnap = await getDoc(wordGroupDocRef);

      if (!wordGroupDocSnap.exists()) {
        console.log('Word group not found!');
        setWordGroup(null);
        setLoading(false);
        return;
      }
      
      const groupData = wordGroupDocSnap.data();

      const wordsRef = collection(db, 'wordGroups', groupId, 'words');
      const wordsSnapshot = await getDocs(wordsRef);
      
      const mappedWords: Word[] = wordsSnapshot.docs.map(doc => ({
        id: doc.id,
        english: doc.data().english || '',
        turkish: doc.data().turkish || '',
        example: doc.data().example || '',
        imageUrl: doc.data().imageUrl,
        pronunciation: doc.data().pronunciation,
      }));
      
      setWordGroup({
        id: wordGroupDocSnap.id,
        title: groupData.title,
        description: groupData.description,
        words: mappedWords,
        level: groupData.level || 'beginner'
      });

      if (mappedWords.length > 0 && user?.uid) {
         fetchWordStatus(mappedWords[0].id);
      }
    } catch (error) {
      console.error('Kelime grubu yüklenirken hata:', error);
      setWordGroup(null);
      setFetchError('Kelime grubu veya kelimeler yüklenirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const fetchWordStatus = async (wordId: string) => {
    if (!user?.uid || !wordId) return;
    if (lastFetchedWordId.current === wordId) return; // Aynı kelime için tekrar fetch etme
    lastFetchedWordId.current = wordId;
    try {
      const statusDocRef = doc(db, 'wordLearningStatus', `${user.uid}_${wordId}`);
      const statusDocSnap = await getDoc(statusDocRef);
      if (statusDocSnap.exists()) {
        setCurrentWordStatus(statusDocSnap.data() as WordLearningStatus);
      } else {
        setCurrentWordStatus(null);
      }
    } catch (error) {
      console.error("Error fetching word status:", error);
      setCurrentWordStatus(null);
    }
  };

  const handleSaveNote = async () => {
    if (!user?.uid || !currentWord) return;
    setNoteSaving(true);
    try {
      const statusDocRef = doc(db, 'wordLearningStatus', `${user.uid}_${currentWord.id}`);
      await setDoc(statusDocRef, { note: noteInput }, { merge: true });
      fetchWordStatus(currentWord.id); // Notu güncelle
    } catch (e) {
      alert('Not kaydedilemedi!');
    } finally {
      setNoteSaving(false);
    }
  };

  const handleSkipWord = async () => {
    if (!user?.uid || !currentWord) return;
    await setDoc(doc(db, 'wordLearningStatus', `${user.uid}_${currentWord.id}`), { skipped: true }, { merge: true });
    handleNext();
  };

  const handleUpdateWordStatus = async (wordId: string, quality: number) => {
    if (!user?.uid || !wordId) {
      console.error('User or Word ID is missing.');
      return;
    }
    setUpdatingStatus(true);
    const userId = user.uid;
    const now = new Date();
    const statusDocRef = doc(db, 'wordLearningStatus', `${userId}_${wordId}`);
    let interval = INITIAL_EASE_FACTOR;
    let easeFactor = INITIAL_EASE_FACTOR;
    let consecutiveCorrectReviews = 0;
    let nextReviewDate = new Date(now);
    let isNew = true;
    try {
      const statusDocSnap = await getDoc(statusDocRef);
      if (statusDocSnap.exists()) {
        isNew = false;
        const currentStatus = statusDocSnap.data() as WordLearningStatus;
        interval = currentStatus.interval;
        easeFactor = typeof currentStatus.easeFactor === 'number' && !isNaN(currentStatus.easeFactor)
          ? currentStatus.easeFactor
          : INITIAL_EASE_FACTOR;
        consecutiveCorrectReviews = currentStatus.consecutiveCorrectReviews;
      }
      if (quality < 2) {
        consecutiveCorrectReviews = 0;
        interval = quality === 0 ? 0.007 : Math.max(1, interval * 0.8);
        setWrongWords(prev => prev.includes(wordId) ? prev : [...prev, wordId]);
      } else {
        consecutiveCorrectReviews += 1;
        if (isNew || consecutiveCorrectReviews <= 1) {
          interval = 1;
        } else if (consecutiveCorrectReviews === 2) {
          interval = 6;
        } else {
          interval = Math.round(interval * easeFactor);
        }
        setWrongWords(prev => prev.filter(id => id !== wordId));
      }
      if (quality > 0) {
        easeFactor = Math.max(MIN_EASE_FACTOR, easeFactor + (0.1 - (3 - quality) * (0.08 + (3 - quality) * 0.02)));
      }
      if (isNaN(interval) || interval < 1) interval = 1;
      if (quality === 0) {
        nextReviewDate.setMinutes(now.getMinutes() + 10);
      } else {
        nextReviewDate.setDate(now.getDate() + Math.max(1, Math.round(interval)));
      }
      console.log('interval:', interval, 'now:', now, 'nextReviewDate:', nextReviewDate);
      if (isNaN(nextReviewDate.getTime())) {
        setUpdatingStatus(false);
        alert('Tarih hesaplanamadı, lütfen tekrar deneyin.');
        return;
      }
      const newStatus: WordLearningStatus = {
        userId: userId,
        wordId: wordId,
        interval: typeof interval === 'number' && !isNaN(interval) ? interval : INITIAL_EASE_FACTOR,
        easeFactor: typeof easeFactor === 'number' && !isNaN(easeFactor) ? easeFactor : INITIAL_EASE_FACTOR,
        consecutiveCorrectReviews: consecutiveCorrectReviews,
        lastReviewed: Timestamp.fromDate(now),
        nextReview: Timestamp.fromDate(nextReviewDate),
        ...(isNew && { createdAt: Timestamp.fromDate(now) })
      };
      await setDoc(statusDocRef, newStatus, { merge: !isNew });
      console.log(`Status updated for word ${wordId}. Quality: ${quality}, New Interval: ${interval} days, EF: ${easeFactor.toFixed(2)}`);
      handleNext();
    } catch (error) {
      console.error('Error updating word learning status:', error);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleNext = () => {
    if (reviewingWrong) {
      if (wrongIndex < wrongWords.length - 1) {
        setWrongIndex(wrongIndex + 1);
        setShowTranslation(false);
      } else {
        setShowCongrats(true);
        setReviewingWrong(false);
        setWrongIndex(0);
        setWrongWords([]);
      }
      return;
    }
    if (wordGroup && wordGroup.words && currentWordIndex < wordGroup.words.length - 1) {
      setTransitioning(true);
      setTimeout(() => {
        const nextIndex = currentWordIndex + 1;
        setCurrentWordIndex(nextIndex);
        setShowTranslation(false);
        setTransitioning(false);
        if (user?.uid) {
          fetchWordStatus(wordGroup.words[nextIndex].id);
        }
      }, 300);
    } else if (wordGroup && wordGroup.words && currentWordIndex === wordGroup.words.length - 1) {
      if (wrongWords.length > 0) {
        setReviewingWrong(true);
        setWrongIndex(0);
        setShowTranslation(false);
        fetchWordStatus(wrongWords[0]);
      } else {
        setShowCongrats(true);
      }
    }
  };

  const handlePrevious = () => {
    if (currentWordIndex > 0) {
      setTransitioning(true);
      setTimeout(() => {
        setCurrentWordIndex(prev => prev - 1);
        setShowTranslation(false);
        setTransitioning(false);
      }, 300);
    }
  };

  // Sesli okuma fonksiyonu
  const speakWord = (text: string, lang: string = 'en-US') => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new window.SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 0.9;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-4 border-t-blue-500 border-blue-200 rounded-full animate-spin"></div>
        {fetchError && (
          <div className="text-red-500 mt-4">{fetchError}</div>
        )}
      </div>
    );
  }

  if (!wordGroup) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Kelime grubu bulunamadı</h2>
            <button
              onClick={() => router.push('/student-panel/vocabulary')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (wordGroup.words.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg p-8 text-center">
            <h2 className="text-xl font-semibold text-slate-800 mb-2">Bu kelime grubunda henüz kelime bulunmuyor.</h2>
            <p className="text-slate-600 mb-4">"{wordGroup.title}"</p>
            <button
              onClick={() => router.push('/student-panel/vocabulary')}
              className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
            >
              Geri Dön
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-xl font-semibold text-slate-800 mb-2">Gösterilecek kelime bulunamadı</h2>
          <p className="text-slate-600 mb-4">Bu grupta hiç kelime olmayabilir veya bir hata oluştu.</p>
          <button
            onClick={() => router.push('/student-panel/vocabulary')}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  if (showCongrats) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-slate-100">
        <div className="bg-white rounded-2xl shadow-lg p-10 text-center max-w-md mx-auto">
          <div className="text-5xl mb-4">🎉</div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Tebrikler!</h2>
          <p className="text-slate-600 mb-6">Bu gruptaki tüm kelimeleri tamamladın.</p>
          <button
            onClick={() => router.push('/student-panel/vocabulary')}
            className="px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
          >
            Ana Sayfaya Dön
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-100 p-4 md:p-8">
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push('/student-panel/vocabulary')}
                className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-6 h-6 text-slate-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-800">{wordGroup.title}</h1>
                <p className="text-slate-600">{wordGroup.description}</p>
              </div>
            </div>
            <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium">
              {currentWordIndex + 1} / {wordGroup.words.length}
            </span>
          </div>
        </div>

        <div className={`bg-white rounded-2xl shadow-lg p-8 mb-8 transition-all duration-300 ${transitioning ? 'opacity-0 scale-95' : 'opacity-100 scale-100'}`}>
          <div className="text-center">
            <div className="flex items-center justify-center gap-3 mb-4">
              <h2 className="text-3xl font-bold text-slate-800">{currentWord.english}</h2>
              <button
                onClick={() => speakWord(currentWord.english, 'en-US')}
                className="p-2 rounded-full bg-purple-100 text-purple-700 hover:bg-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-400"
                title="İngilizceyi seslendir"
                disabled={isSpeaking}
              >
                <Volume2 className="w-6 h-6" />
              </button>
            </div>
            <button
              onClick={handleSkipWord}
              className="mb-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors text-sm w-full md:w-auto"
              disabled={updatingStatus}
            >
              Atla / Biliniyor
            </button>
            
            {showTranslation ? (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2">
                  <p className="text-xl text-slate-600">{currentWord.turkish || <span className='italic text-slate-400'>Çeviri yok</span>}</p>
                  <button
                    onClick={() => speakWord(currentWord.turkish, 'tr-TR')}
                    className="p-2 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 focus:outline-none focus:ring-2 focus:ring-emerald-400"
                    title="Türkçeyi seslendir"
                    disabled={isSpeaking}
                  >
                    <Volume2 className="w-5 h-5" />
                  </button>
                </div>
                {currentWord.example && (
                  <p className="text-slate-500 italic">"{currentWord.example.length > 120 ? currentWord.example.slice(0, 120) + '...' : currentWord.example}"</p>
                )}
                {!currentWord.example && (
                  <p className="text-slate-400 italic">Örnek cümle yok</p>
                )}
                {currentWord.imageUrl && (
                  <img src={currentWord.imageUrl} alt={`Image for ${currentWord.english}`} className="mt-4 mx-auto max-h-40 rounded-lg" />
                )}
                {currentWord.pronunciation && (
                  <p className="text-slate-500 mt-2">Telaffuz: {currentWord.pronunciation}</p>
                )}
                <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <button
                    onClick={() => handleUpdateWordStatus(currentWord.id, 0)}
                    disabled={updatingStatus}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center w-full md:w-auto ${updatingStatus ? 'bg-gray-300 cursor-not-allowed' : 'bg-red-100 hover:bg-red-200 text-red-700'}`}
                  >
                    <RefreshCw className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Tekrar <span className="hidden md:inline">(1)</span></span>
                    <span className="text-xs text-red-600">(~10 dk)</span> 
                  </button>
                  <button
                    onClick={() => handleUpdateWordStatus(currentWord.id, 1)}
                    disabled={updatingStatus}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center w-full md:w-auto ${updatingStatus ? 'bg-gray-300 cursor-not-allowed' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}
                  >
                    <Meh className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Zor <span className="hidden md:inline">(2)</span></span>
                  </button>
                  <button
                    onClick={() => handleUpdateWordStatus(currentWord.id, 2)}
                    disabled={updatingStatus}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center w-full md:w-auto ${updatingStatus ? 'bg-gray-300 cursor-not-allowed' : 'bg-blue-100 hover:bg-blue-200 text-blue-700'}`}
                  >
                    <Smile className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">İyi <span className="hidden md:inline">(3)</span></span>
                  </button>
                  <button
                    onClick={() => handleUpdateWordStatus(currentWord.id, 3)}
                    disabled={updatingStatus}
                    className={`p-3 rounded-lg transition-colors flex flex-col items-center justify-center w-full md:w-auto ${updatingStatus ? 'bg-gray-300 cursor-not-allowed' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}
                  >
                     <ThumbsUp className="w-6 h-6 mb-1" />
                    <span className="text-sm font-medium">Kolay <span className="hidden md:inline">(4)</span></span>
                  </button>
                </div>
                <div className="mt-4 flex flex-col items-center">
                  <textarea
                    value={noteInput}
                    onChange={e => setNoteInput(e.target.value)}
                    placeholder="Not ekle..."
                    className="w-full max-w-md rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
                    rows={2}
                  />
                  <button
                    onClick={handleSaveNote}
                    disabled={noteSaving}
                    className="mt-2 px-4 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm"
                  >
                    {noteSaving ? 'Kaydediliyor...' : 'Notu Kaydet'}
                  </button>
                  {currentWordStatus?.note && (
                    <div className="mt-2 text-slate-500 text-sm italic">Notun: {currentWordStatus.note}</div>
                  )}
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowTranslation(true)}
                className="mt-4 px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
              >
                Çeviriyi Göster
              </button>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-6">
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 rounded-full transition-all duration-300"
              style={{ width: `${((currentWordIndex + 1) / wordGroup.words.length) * 100}%` }}
            ></div>
          </div>
          <div className="flex justify-between mt-2 text-sm text-slate-600">
            <span>{currentWordIndex + 1} kelime</span>
            <span>Toplam {wordGroup.words.length} kelime</span>
          </div>
        </div>
      </div>
    </div>
  );
} 