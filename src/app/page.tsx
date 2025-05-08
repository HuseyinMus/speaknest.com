'use client';

import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, Users, BookOpen, Clock } from 'lucide-react';
import Header from '@/components/Header';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center">
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              SpeakNest'e Hoşgeldiniz!
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              İngilizce konuşma pratiği yapmak için en iyi platform.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/login">
                <Button size="lg" className="w-full sm:w-auto">
                  Derslere Git
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link href="/register">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Hemen Başla
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            {/* Speaking Practice */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Konuşma Pratiği
              </h2>
              <p className="text-lg text-gray-600">
                Gerçek eğitmenlerle grup dersleri, esnek program ve daha fazlası.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 mr-3 text-blue-600" />
                  Grup Dersleri
                </li>
                <li className="flex items-center text-gray-700">
                  <Clock className="h-5 w-5 mr-3 text-blue-600" />
                  Esnek Takvim
                </li>
                <li className="flex items-center text-gray-700">
                  <Users className="h-5 w-5 mr-3 text-blue-600" />
                  Ana Dili İngilizce Eğitmenler
                </li>
              </ul>
            </div>

            {/* Vocabulary Learning */}
            <div className="space-y-6">
              <h2 className="text-3xl font-bold text-gray-900">
                Kelime Öğrenme
              </h2>
              <p className="text-lg text-gray-600">
                Akıllı tekrar sistemiyle kelime hazneni geliştir.
              </p>
              <ul className="space-y-4">
                <li className="flex items-center text-gray-700">
                  <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                  Aralıklı Tekrar
                </li>
                <li className="flex items-center text-gray-700">
                  <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                  Yapay Zeka Destekli Öğrenme
                </li>
                <li className="flex items-center text-gray-700">
                  <BookOpen className="h-5 w-5 mr-3 text-blue-600" />
                  Kişiselleştirilmiş Listeler
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
            Nasıl Çalışır?
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Kayıt Ol</h3>
              <p className="text-gray-600">Hemen ücretsiz kaydını oluştur.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Seviye Belirle</h3>
              <p className="text-gray-600">Seviyene uygun derslerle başla.</p>
            </div>
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <h3 className="text-xl font-semibold mb-4">Hemen Başla</h3>
              <p className="text-gray-600">Pratik yapmaya hemen başla.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-blue-600">
        <div className="max-w-7xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-6">
            Hemen Başla
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Şimdi kaydol, İngilizce konuşmaya başla!
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" variant="secondary" className="w-full sm:w-auto">
                Ücretsiz Dene
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
