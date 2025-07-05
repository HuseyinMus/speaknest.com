'use client';

import React, { useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, limit, where, Timestamp } from 'firebase/firestore';
import { Users, FileText, DollarSign, Star, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

interface DashboardStats {
  totalUsers: number;
  totalApplications: number;
  totalPayments: number;
  totalTestimonials: number;
  pendingApplications: number;
  pendingPayments: number;
  recentActivities: any[];
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalUsers: 0,
    totalApplications: 0,
    totalPayments: 0,
    totalTestimonials: 0,
    pendingApplications: 0,
    pendingPayments: 0,
    recentActivities: []
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      // Kullanıcı istatistikleri
      const usersSnap = await getDocs(collection(db, 'users'));
      const totalUsers = usersSnap.size;

      // Native başvuru istatistikleri
      const applicationsSnap = await getDocs(collection(db, 'nativeApplications'));
      const totalApplications = applicationsSnap.size;
      const pendingApplications = applicationsSnap.docs.filter(doc => doc.data().status === 'pending').length;

      // Ödeme istatistikleri
      const paymentsSnap = await getDocs(collection(db, 'paymentRequests'));
      const totalPayments = paymentsSnap.size;
      const pendingPayments = paymentsSnap.docs.filter(doc => doc.data().status === 'pending').length;

      // Yorum istatistikleri
      const testimonialsSnap = await getDocs(collection(db, 'testimonials'));
      const totalTestimonials = testimonialsSnap.size;

      // Son aktiviteler
      const recentActivities = await getRecentActivities();

      setStats({
        totalUsers,
        totalApplications,
        totalPayments,
        totalTestimonials,
        pendingApplications,
        pendingPayments,
        recentActivities
      });
    } catch (error) {
      console.error('Dashboard istatistikleri yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRecentActivities = async () => {
    const activities = [];
    
    try {
      // Son başvurular
      const recentApps = query(collection(db, 'nativeApplications'), orderBy('submittedAt', 'desc'), limit(3));
      const appsSnap = await getDocs(recentApps);
      appsSnap.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'application',
          title: 'Yeni Native Başvurusu',
          description: `${data.name} başvuru yaptı`,
          timestamp: data.submittedAt,
          status: data.status
        });
      });

      // Son ödeme talepleri
      const recentPayments = query(collection(db, 'paymentRequests'), orderBy('requestedAt', 'desc'), limit(3));
      const paymentsSnap = await getDocs(recentPayments);
      paymentsSnap.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'payment',
          title: 'Yeni Ödeme Talebi',
          description: `${data.amount} TL ödeme talebi`,
          timestamp: data.requestedAt,
          status: data.status
        });
      });

      // Son yorumlar
      const recentTestimonials = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'), limit(3));
      const testimonialsSnap = await getDocs(recentTestimonials);
      testimonialsSnap.docs.forEach(doc => {
        const data = doc.data();
        activities.push({
          id: doc.id,
          type: 'testimonial',
          title: 'Yeni Yorum',
          description: `${data.name} yorum yaptı`,
          timestamp: data.createdAt,
          status: data.approved ? 'approved' : 'pending'
        });
      });

      // Tarihe göre sırala
      activities.sort((a, b) => {
        const timeA = a.timestamp?.seconds || 0;
        const timeB = b.timestamp?.seconds || 0;
        return timeB - timeA;
      });

      return activities.slice(0, 8); // En son 8 aktivite
    } catch (error) {
      console.error('Son aktiviteler yüklenirken hata:', error);
      return [];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Onaylandı';
      case 'rejected':
        return 'Reddedildi';
      case 'pending':
        return 'Beklemede';
      default:
        return 'Bilinmiyor';
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('tr-TR');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Dashboard yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hoş Geldin Mesajı */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-6 text-white">
        <h1 className="text-2xl font-bold mb-2">SpeakNest Admin Paneli</h1>
        <p className="text-blue-100">Sistem yönetimi ve kullanıcı takibi için hoş geldiniz.</p>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Kullanıcı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <Users className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm text-green-600">
            <TrendingUp className="w-4 h-4 mr-1" />
            <span>+12% bu ay</span>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Native Başvuruları</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalApplications}</p>
              <p className="text-sm text-yellow-600">{stats.pendingApplications} beklemede</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FileText className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Ödeme Talepleri</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalPayments}</p>
              <p className="text-sm text-yellow-600">{stats.pendingPayments} beklemede</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <DollarSign className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Yorum</p>
              <p className="text-2xl font-bold text-gray-900">{stats.totalTestimonials}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Hızlı İşlemler */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Hızlı İşlemler</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button className="flex flex-col items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
            <Users className="w-8 h-8 text-blue-600 mb-2" />
            <span className="text-sm font-medium text-blue-800">Kullanıcılar</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors">
            <FileText className="w-8 h-8 text-green-600 mb-2" />
            <span className="text-sm font-medium text-green-800">Başvurular</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors">
            <DollarSign className="w-8 h-8 text-purple-600 mb-2" />
            <span className="text-sm font-medium text-purple-800">Ödemeler</span>
          </button>
          <button className="flex flex-col items-center p-4 bg-yellow-50 rounded-lg hover:bg-yellow-100 transition-colors">
            <Star className="w-8 h-8 text-yellow-600 mb-2" />
            <span className="text-sm font-medium text-yellow-800">Yorumlar</span>
          </button>
        </div>
      </div>

      {/* Son Aktiviteler */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Son Aktiviteler</h2>
        <div className="space-y-4">
          {stats.recentActivities.length > 0 ? (
            stats.recentActivities.map((activity, index) => (
              <div key={`${activity.type}-${activity.id}-${index}`} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getStatusIcon(activity.status)}
                  <div>
                    <p className="font-medium text-gray-900">{activity.title}</p>
                    <p className="text-sm text-gray-600">{activity.description}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">{formatTimestamp(activity.timestamp)}</p>
                  <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                    activity.status === 'approved' ? 'bg-green-100 text-green-800' :
                    activity.status === 'rejected' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {getStatusText(activity.status)}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-gray-500">
              Henüz aktivite bulunmuyor.
            </div>
          )}
        </div>
      </div>

      {/* Sistem Durumu */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Sistem Durumu</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Veritabanı</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">API Servisleri</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Bildirim Sistemi</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Aktif
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Ödeme Sistemi</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Aktif
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Bekleyen İşlemler</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Onay Bekleyen Başvurular</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {stats.pendingApplications}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Onay Bekleyen Ödemeler</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                {stats.pendingPayments}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Onay Bekleyen Yorumlar</span>
              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                0
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}