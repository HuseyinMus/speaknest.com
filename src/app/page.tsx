'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import Header from '@/components/Header';
import { useLanguage } from '@/lib/context/LanguageContext';

export default function Home() {
  const { t } = useLanguage();
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAuth = async () => {
      const unsubscribe = auth.onAuthStateChanged(async (user) => {
        if (user) {
          setUser(user);
          await fetchUserProfile(user.uid);
        }
        setLoading(false);
      });
      return () => unsubscribe();
    };
    checkAuth();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        setUserProfile(userDoc.data());
      }
    } catch (err) {
      console.error('Kullanıcı bilgileri alınamadı:', err);
    }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setUser(null);
      setUserProfile(null);
      router.push('/');
    } catch (err) {
      console.error('Çıkış yapılamadı:', err);
    }
  };
  
  const navigateToUserPanel = (userProfile: any) => {
    if (!userProfile) return;
    
    let redirectPath = '/';
    switch (userProfile.role) {
      case 'admin':
        redirectPath = '/dashboard';
        break;
      case 'teacher':
        redirectPath = '/teacher-panel';
        break;
      case 'proUser':
        redirectPath = '/prouser-panel';
        break;
      case 'student':
        redirectPath = '/student-panel/dashboard';
        break;
      default:
        redirectPath = '/';
    }
    
    router.push(redirectPath);
  };
  
  const renderProfileButton = () => {
    if (userProfile) {
      let buttonText = "";
      
      if (userProfile.role === 'admin') {
        buttonText = "Admin Paneli";
      } else if (userProfile.role === 'teacher') {
        buttonText = "Öğretmen Paneli";
      } else if (userProfile.role === 'proUser') {
        buttonText = "Konuşma Sunucusu Paneli";
      } else {
        buttonText = "Öğrenci Paneli";
      }
      
      return (
        <button 
          onClick={() => navigateToUserPanel(userProfile)} 
          className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition-colors"
        >
          {buttonText}
        </button>
      );
    } else {
      return (
        <>
          <button 
            onClick={() => router.push('/login')} 
            className="bg-green-600 hover:bg-green-700 text-white rounded-md px-4 py-2 transition-colors"
          >
            {t('login')}
          </button>
          <button 
            onClick={() => router.push('/register')} 
            className="bg-white hover:bg-gray-100 text-green-700 border border-green-700 rounded-md px-4 py-2 transition-colors ml-3"
          >
            {t('register')}
          </button>
        </>
      );
    }
  };
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      {/* Hero Section */}
      <div className="pt-32 pb-16 md:pt-40 md:pb-24">
        <div className="container mx-auto px-4 flex flex-col md:flex-row items-center gap-10">
          <div className="text-center max-w-3xl mx-auto md:text-left md:max-w-xl md:mx-0 flex-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
              {t('heroTitle')}
            </h1>
            <p className="text-lg text-gray-600 mb-8">
              {t('heroDescription')}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              {user ? (
                <Link
                  href={userProfile?.role === 'admin' ? '/dashboard' : 
                        userProfile?.role === 'teacher' ? '/teacher-panel' : 
                        userProfile?.role === 'proUser' ? '/prouser-panel' : 
                        '/student-panel/dashboard'}
                  className="px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-lg font-medium"
                >
                  {t('goToLessons')}
                </Link>
              ) : (
                <Link
                  href="/register"
                  className="px-8 py-3 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors text-lg font-medium"
                >
                  {t('startNow')}
                </Link>
              )}
            </div>
          </div>
          <div className="flex-1 flex justify-center md:justify-end">
            <img
              src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_teklhgamgsi16zbt6zux_0.png"
              alt="Hero Görseli"
              className="w-full max-w-md rounded-xl shadow-lg"
            />
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Speaking Practice */}
            <div className="space-y-6 flex items-start">
              <img
                src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_oqb01o9l6rcglswonop4_2.png"
                alt="Konuşma Pratiği Görseli"
                className="w-24 h-24 object-contain mr-6 hidden md:block"
              />
              <div>
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('speakingPracticeTitle')}</h2>
                </div>
                <p className="text-gray-600 mt-4">
                  {t('speakingPracticeDescription')}
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('groupLessons')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('flexibleSchedule')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('nativeTeachers')}</span>
                  </li>
                </ul>
              </div>
            </div>

            {/* Vocabulary Learning */}
            <div className="space-y-6 flex items-start">
              <img
                src="/images/openart-image_wkhjsl34_1745756262406_raw.jpg"
                alt="Kelime Öğrenme Görseli"
                className="w-24 h-24 object-contain mr-6 hidden md:block rounded-lg"
              />
              <div>
                <div className="flex items-center space-x-4">
                  <div className="bg-green-100 p-3 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900">{t('vocabularyLearningTitle')}</h2>
                </div>
                <p className="text-gray-600 mt-4">
                  {t('vocabularyLearningDescription')}
                </p>
                <ul className="space-y-3 mt-4">
                  <li className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('spacedRepetition')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('aiLearning')}</span>
                  </li>
                  <li className="flex items-center space-x-2">
                    <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{t('personalizedLists')}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">{t('howItWorks')}</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
              <img
                src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_mnqngpyixixe3rka9dl4_2.png"
                alt="Kayıt Ol Görseli"
                className="w-16 h-16 object-contain mb-4"
              />
              <div className="text-4xl font-bold text-green-600 mb-4">1</div>
              <h3 className="text-xl font-semibold mb-2">{t('registerStep')}</h3>
              <p className="text-gray-600">{t('registerDescription')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
              <img
                src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_teklhgamgsi16zbt6zux_0.png"
                alt="Seviye Belirleme Görseli"
                className="w-16 h-16 object-contain mb-4"
              />
              <div className="text-4xl font-bold text-green-600 mb-4">2</div>
              <h3 className="text-xl font-semibold mb-2">{t('levelStep')}</h3>
              <p className="text-gray-600">{t('levelDescription')}</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-md flex flex-col items-center">
              <img
                src="/images/openart-image_wkhjsl34_1745756262406_raw.jpg"
                alt="Öğrenmeye Başla Görseli"
                className="w-16 h-16 object-contain mb-4 rounded-lg"
              />
              <div className="text-4xl font-bold text-green-600 mb-4">3</div>
              <h3 className="text-xl font-semibold mb-2">{t('startLearningStep')}</h3>
              <p className="text-gray-600">{t('startLearningDescription')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 bg-green-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-6">{t('startNowTitle')}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto">
            {t('startNowDescription')}
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-3 bg-white text-green-600 rounded-lg shadow hover:bg-gray-100 transition-colors text-lg font-medium"
          >
            {t('tryFree')}
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-200 pt-12 pb-6 mt-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-10">
            {/* Logo ve açıklama */}
            <div className="mb-8 md:mb-0 flex-1">
              <div className="flex items-center mb-4">
                <img src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_oqb01o9l6rcglswonop4_2.png" alt="SpeakNest Logo" className="w-10 h-10 rounded-lg mr-2" />
                <span className="text-2xl font-bold text-green-400">SpeakNest</span>
              </div>
              <p className="text-gray-400 max-w-xs">{t('footerDescription')}</p>
              <div className="flex space-x-4 mt-4">
                <a href="#" aria-label="Instagram" className="hover:text-green-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/></svg>
                </a>
                <a href="#" aria-label="Twitter" className="hover:text-green-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53A4.48 4.48 0 0 0 22.43.36a9.09 9.09 0 0 1-2.88 1.1A4.52 4.52 0 0 0 16.11 0c-2.5 0-4.52 2.02-4.52 4.52 0 .35.04.7.11 1.03A12.94 12.94 0 0 1 3.1.67a4.48 4.48 0 0 0-.61 2.27c0 1.56.8 2.93 2.02 3.74A4.48 4.48 0 0 1 2 6.13v.06c0 2.18 1.55 4 3.8 4.42a4.52 4.52 0 0 1-2.04.08c.58 1.8 2.26 3.11 4.25 3.15A9.05 9.05 0 0 1 2 19.54a12.8 12.8 0 0 0 6.95 2.04c8.34 0 12.9-6.91 12.9-12.9 0-.2 0-.39-.01-.58A9.22 9.22 0 0 0 23 3z"/></svg>
                </a>
                <a href="#" aria-label="LinkedIn" className="hover:text-green-400 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect width="20" height="20" x="2" y="2" rx="5"/><line x1="16" y1="11" x2="16" y2="16"/><line x1="8" y1="11" x2="8" y2="16"/><line x1="12" y1="8" x2="12" y2="16"/></svg>
                </a>
              </div>
            </div>
            {/* Linkler */}
            <div className="flex-1 grid grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold mb-3 text-green-300">{t('aboutUs')}</h3>
                <ul className="space-y-2">
                  <li><Link href="/about" className="text-gray-400 hover:text-white transition-colors">{t('aboutUs')}</Link></li>
                  <li><Link href="/teachers" className="text-gray-400 hover:text-white transition-colors">{t('ourTeachers')}</Link></li>
                  <li><Link href="/career" className="text-gray-400 hover:text-white transition-colors">{t('career')}</Link></li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold mb-3 text-green-300">{t('support')}</h3>
                <ul className="space-y-2">
                  <li><Link href="/contact" className="text-gray-400 hover:text-white transition-colors">{t('contactUs')}</Link></li>
                  <li><Link href="/faq" className="text-gray-400 hover:text-white transition-colors">{t('faq')}</Link></li>
                  <li><Link href="/help" className="text-gray-400 hover:text-white transition-colors">{t('helpCenter')}</Link></li>
                </ul>
              </div>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-10 pt-6 text-center text-gray-500 text-sm">
            {t('copyright')}
          </div>
        </div>
      </footer>
    </div>
  );
}
