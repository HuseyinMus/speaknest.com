'use client';

import React from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Menu, X } from 'lucide-react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const closeMenu = () => {
    setIsMenuOpen(false);
  };

  const isActive = (path: string) => {
    return pathname === path;
  };

  return (
    <header className="bg-white shadow-sm fixed w-full top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            <img
              src="/images/homepage_hero_illustration_for_a_modern_language_learning_platform_soft_green_color_palette_minimal_oqb01o9l6rcglswonop4_2.png"
              alt="SpeakNest Logo"
              className="w-8 h-8 rounded-lg"
            />
            <span className="text-xl font-bold text-gray-900">SpeakNest</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium ${
                isActive('/') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Anasayfa
            </Link>
            <Link
              href="/about"
              className={`text-sm font-medium ${
                isActive('/about') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              Hakkında
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-medium ${
                isActive('/contact') ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              İletişim
            </Link>
            <Link href="/login">
              <Button variant="outline" size="sm">
                Giriş Yap
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">
                Kayıt Ol
              </Button>
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center space-x-4">
            <button
              onClick={toggleMenu}
              className="text-gray-500 hover:text-gray-900 focus:outline-none"
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
      {isMenuOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link
              href="/"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/') ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              Anasayfa
            </Link>
            <Link
              href="/about"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/about') ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              Hakkında
            </Link>
            <Link
              href="/contact"
              className={`block px-3 py-2 rounded-md text-base font-medium ${
                isActive('/contact') ? 'text-blue-600 bg-blue-50' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
              }`}
              onClick={closeMenu}
            >
              İletişim
            </Link>
            <div className="px-3 py-2">
              <Link href="/login" onClick={closeMenu}>
                <Button variant="outline" className="w-full mb-2">
                  Giriş Yap
                </Button>
              </Link>
              <Link href="/register" onClick={closeMenu}>
                <Button className="w-full">
                  Kayıt Ol
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
} 