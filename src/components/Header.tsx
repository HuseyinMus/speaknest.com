'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X, ChevronDown, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { signOut } from 'firebase/auth';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        setUser(user);
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserProfile(userDoc.data());
        }
      } else {
        setUser(null);
        setUserProfile(null);
      }
    });

    return () => unsubscribe();
  }, []);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      router.push('/');
    } catch (error) {
      console.error('Çıkış yapılırken hata oluştu:', error);
    }
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  const navLinks = [
    { href: '/', label: 'Anasayfa' },
    { href: '/about', label: 'Hakkımızda' },
    { href: '/practices', label: 'Pratikler' },
    { href: '/pricing', label: 'Fiyatlandırma' },
    { href: '/contact', label: 'İletişim' },
  ];

  return (
    <header 
      className={`fixed w-full top-0 z-50 transition-all duration-300 ${
        isScrolled 
          ? 'bg-white/80 backdrop-blur-md shadow-sm' 
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3">
            <img
              src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_oqb01o9l6rcglswonop4_2.png"
              alt="SpeakNest Logo"
              className="w-10 h-10 rounded-lg"
            />
            <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">
              SpeakNest
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors duration-200 ${
                  isActive(link.href)
                    ? 'text-green-600'
                    : 'text-gray-600 hover:text-green-600'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="flex items-center space-x-4 ml-4">
              {user ? (
                <div className="relative">
                  <button
                    onClick={() => setIsProfileMenuOpen(!isProfileMenuOpen)}
                    className="flex items-center space-x-2 text-gray-600 hover:text-green-600"
                  >
                    <User className="h-5 w-5" />
                    <span className="text-sm font-medium">
                      {userProfile?.name || user.email}
                    </span>
                    <ChevronDown className="h-4 w-4" />
                  </button>
                  
                  <AnimatePresence>
                    {isProfileMenuOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1"
                      >
                        <Link href="/student-panel">
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">
                            Öğrenci Paneli
                          </button>
                        </Link>
                        <Link href="/student-panel/profile">
                          <button className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600">
                            Profil
                          </button>
                        </Link>
                        <button
                          onClick={handleLogout}
                          className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-green-50 hover:text-green-600"
                        >
                          Çıkış Yap
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ) : (
                <>
                  <Link href="/login">
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className="text-gray-600 hover:text-green-600 hover:bg-green-50"
                    >
                      Giriş Yap
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button 
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white"
                    >
                      Ücretsiz Dene
                    </Button>
                  </Link>
                </>
              )}
            </div>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-gray-600 hover:text-green-600 focus:outline-none"
            >
              {isMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white border-t"
          >
            <div className="px-4 py-3 space-y-1">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`block px-3 py-2 rounded-md text-base font-medium ${
                    isActive(link.href)
                      ? 'text-green-600 bg-green-50'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                  onClick={closeMenu}
                >
                  {link.label}
                </Link>
              ))}
              <div className="pt-4 pb-3 border-t">
                {user ? (
                  <>
                    <Link href="/student-panel" onClick={closeMenu}>
                      <Button 
                        variant="ghost" 
                        className="w-full mb-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
                      >
                        Öğrenci Paneli
                      </Button>
                    </Link>
                    <Link href="/student-panel/profile" onClick={closeMenu}>
                      <Button 
                        variant="ghost" 
                        className="w-full mb-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
                      >
                        Profil
                      </Button>
                    </Link>
                    <Button 
                      onClick={() => {
                        handleLogout();
                        closeMenu();
                      }}
                      variant="ghost" 
                      className="w-full text-gray-600 hover:text-green-600 hover:bg-green-50"
                    >
                      Çıkış Yap
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/login" onClick={closeMenu}>
                      <Button 
                        variant="ghost" 
                        className="w-full mb-2 text-gray-600 hover:text-green-600 hover:bg-green-50"
                      >
                        Giriş Yap
                      </Button>
                    </Link>
                    <Link href="/register" onClick={closeMenu}>
                      <Button 
                        className="w-full bg-green-600 hover:bg-green-700 text-white"
                      >
                        Ücretsiz Dene
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
} 