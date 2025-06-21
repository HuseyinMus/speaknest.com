'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { auth, db } from '@/lib/firebase/config';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { signInWithGoogle } from '@/lib/firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import Image from 'next/image';
import { setAuthCookie } from '@/lib/auth/setCookie';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState('');
  const [authChecked, setAuthChecked] = useState(false);
  const [showDestinationSelector, setShowDestinationSelector] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const router = useRouter();
  
  // Kullanıcı giriş durumunu kontrol et
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setCurrentUser(user);
        // Kullanıcının rolünü kontrol et
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          
          if (userDoc.exists()) {
            const userData = userDoc.data();
            
            // Auth cookie'sini ayarla
            await setAuthCookie({
              uid: user.uid,
              role: userData.role || 'student',
            });
            
            // Eğer admin, teacher veya proUser ise direkt yönlendir
            if (userData.role === 'admin') {
              router.push('/dashboard');
            } else if (userData.role === 'teacher') {
              router.push('/teacher-panel');
            } else if (userData.role === 'proUser') {
              router.push('/prouser-panel');
            } else {
              // Öğrenci ise seçim sayfasını göster
              setShowDestinationSelector(true);
            }
          } else {
            // Kullanıcı verisi yoksa seçim sayfasını göster
            await setAuthCookie({
              uid: user.uid,
              role: 'student',
            });
            setShowDestinationSelector(true);
          }
        } catch (error) {
          console.error('Rol kontrolü sırasında hata:', error);
          setError('Oturum açma sırasında bir hata oluştu. Lütfen tekrar deneyin.');
          setLoading(false);
        }
      } else {
        // Auth kontrolü tamamlandı
        setAuthChecked(true);
      }
    });
    
    return () => unsubscribe();
  }, [router]);
  
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // Email/şifre ile giriş yap
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      setCurrentUser(userCredential.user);
      
      // Kullanıcının rolünü kontrol et
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Auth cookie'sini ayarla
        await setAuthCookie({
          uid: userCredential.user.uid,
          role: userData.role || 'student',
        });
        
        // Eğer admin, teacher veya proUser ise direkt yönlendir
        if (userData.role === 'admin') {
          router.push('/dashboard');
        } else if (userData.role === 'teacher') {
          router.push('/teacher-panel');
        } else if (userData.role === 'proUser') {
          router.push('/prouser-panel');
        } else {
          // Öğrenci ise seçim sayfasını göster
          setShowDestinationSelector(true);
        }
      } else {
        // Kullanıcı verisi yoksa seçim sayfasını göster
        await setAuthCookie({
          uid: userCredential.user.uid,
          role: 'student',
        });
        setShowDestinationSelector(true);
      }
    } catch (err: any) {
      setError('Giriş yapılamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    setError('');
    
    try {
      // Google ile giriş yap
      const user = await signInWithGoogle();
      setCurrentUser(user);
      
      // Kullanıcının rolünü kontrol et
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      
      if (userDoc.exists()) {
        const userData = userDoc.data();
        
        // Auth cookie'sini ayarla
        await setAuthCookie({
          uid: user.uid,
          role: userData.role || 'student',
        });
        
        // Eğer admin, teacher veya proUser ise direkt yönlendir
        if (userData.role === 'admin') {
          router.push('/dashboard');
        } else if (userData.role === 'teacher') {
          router.push('/teacher-panel');
        } else if (userData.role === 'proUser') {
          router.push('/prouser-panel');
        } else {
          // Öğrenci ise seçim sayfasını göster
          setShowDestinationSelector(true);
        }
      } else {
        // Kullanıcı verisi yoksa seçim sayfasını göster
        await setAuthCookie({
          uid: user.uid,
          role: 'student',
        });
        setShowDestinationSelector(true);
      }
    } catch (err: any) {
      setError('Google ile giriş yapılamadı: ' + (err.message || 'Bilinmeyen hata'));
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleDestinationSelect = (destination: string) => {
    switch (destination) {
      case 'student':
        router.push('/student-panel');
        break;
      case 'apply':
        router.push('/apply');
        break;
      case 'home':
        router.push('/');
        break;
      default:
        router.push('/student-panel');
    }
  };
  
  // Auth kontrolü tamamlanana kadar yükleniyor göster
  if (!authChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Yükleniyor...</div>
      </div>
    );
  }

  // Giriş yapmış kullanıcı için seçim sayfası
  if (showDestinationSelector && currentUser) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-500 via-sky-400 to-green-300 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="bg-white/90 backdrop-blur-md py-8 px-4 shadow-xl rounded-2xl sm:px-10">
            <div className="text-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900 mb-2">
                Hoş Geldiniz! 👋
              </h1>
              <p className="text-gray-600">
                {currentUser.email}
              </p>
            </div>
            
            <div className="space-y-4">
              <button
                onClick={() => handleDestinationSelect('student')}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                📚 Öğrenci Paneli
              </button>
              
              <button
                onClick={() => handleDestinationSelect('apply')}
                className="w-full flex items-center justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
              >
                🎯 ProUser Başvurusu Yap
              </button>
              
              <button
                onClick={() => handleDestinationSelect('home')}
                className="w-full flex items-center justify-center py-3 px-4 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                🏠 Ana Sayfaya Git
              </button>
            </div>
            
            <div className="mt-6 text-center">
              <button
                onClick={() => {
                  auth.signOut();
                  setShowDestinationSelector(false);
                  setCurrentUser(null);
                }}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Farklı hesap ile giriş yap
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h1 className="text-center text-3xl font-bold text-gray-900 mb-8">
          Giriş Yap
        </h1>
        
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}
          
          <form className="space-y-6" onSubmit={handleLogin}>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-posta Adresi
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Şifre
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                />
              </div>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className={`w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${loading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Giriş Yapılıyor...' : 'Giriş Yap'}
              </button>
            </div>
          </form>
          
          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">
                  veya
                </span>
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                disabled={googleLoading}
                className={`w-full flex justify-center items-center py-2 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${googleLoading ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 48 48">
                  <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z" />
                  <path fill="#FF3D00" d="m6.306 14.691 6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z" />
                  <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0 1 24 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z" />
                  <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 0 1-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z" />
                </svg>
                {googleLoading ? 'Google ile Giriş Yapılıyor...' : 'Google ile Giriş Yap'}
              </button>
            </div>
          </div>
          
          <div className="mt-6">
            <div className="text-center">
              <Link
                href="/register"
                className="font-medium text-blue-600 hover:text-blue-500"
              >
                Hesabınız yok mu? Kaydolun
              </Link>
            </div>
            <div className="text-center mt-3">
              <Link
                href="/"
                className="font-medium text-gray-600 hover:text-gray-500"
              >
                Ana Sayfaya Dön
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 