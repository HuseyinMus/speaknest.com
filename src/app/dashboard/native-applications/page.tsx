"use client";

import React, { useEffect, useState } from "react";
import { db } from "@/lib/firebase/config";
import { collection, getDocs, updateDoc, doc, query, orderBy, where } from "firebase/firestore";
import { FileText, Search, Filter, Eye, CheckCircle, XCircle, Clock, MapPin, Mail, Phone, Calendar, User, MessageSquare } from 'lucide-react';

interface NativeApplication {
  id: string;
  name: string;
  email: string;
  country: string;
  city?: string;
  phone?: string;
  motivation: string;
  proof: string;
  zoom: string;
  availability: string;
  submittedAt: any;
  status: 'pending' | 'approved' | 'rejected';
  userId?: string;
  userEmail?: string;
  notes?: string;
  reviewedAt?: any;
  reviewedBy?: string;
}

export default function NativeApplicationsPage() {
  const [applications, setApplications] = useState<NativeApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedApp, setSelectedApp] = useState<NativeApplication | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    setLoading(true);
    try {
      const q = query(collection(db, "nativeApplications"), orderBy("submittedAt", "desc"));
      const querySnapshot = await getDocs(q);
      const apps = querySnapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })) as NativeApplication[];
      setApplications(apps);
    } catch (err) {
      setError("Başvurular yüklenemedi.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    setMessage('');
    
    try {
      const appRef = doc(db, 'nativeApplications', id);
      await updateDoc(appRef, { 
        status,
        reviewedAt: new Date(),
        reviewedBy: 'admin', // Gerçek uygulamada mevcut admin kullanıcısı
        notes: notes || undefined
      });
      
      setApplications(apps => apps.map(app => 
        app.id === id ? { ...app, status, reviewedAt: new Date(), notes: notes || undefined } : app
      ));
      
      setMessage(`Başvuru ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
      setShowDetailsModal(false);
      setNotes('');
    } catch (error: any) {
      setError('Durum güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.country?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">Onaylandı</span>;
      case 'rejected':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Reddedildi</span>;
      case 'pending':
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">Beklemede</span>;
      default:
        return <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">Bilinmiyor</span>;
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
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('tr-TR');
  };

  const getStats = () => {
    const total = applications.length;
    const pending = applications.filter(app => app.status === 'pending').length;
    const approved = applications.filter(app => app.status === 'approved').length;
    const rejected = applications.filter(app => app.status === 'rejected').length;
    
    return { total, pending, approved, rejected };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Başvurular yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Native Başvuruları</h1>
            <p className="text-gray-600">Toplam {stats.total} başvuru</p>
          </div>
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <FileText className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Beklemede</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Onaylandı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
            </div>
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-red-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Reddedildi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.rejected}</p>
            </div>
            <XCircle className="w-6 h-6 text-red-600" />
          </div>
        </div>
      </div>

      {/* Filtreler */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="İsim, email veya ülke ara..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Durum Filtresi</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">Tüm Durumlar</option>
              <option value="pending">Beklemede</option>
              <option value="approved">Onaylandı</option>
              <option value="rejected">Reddedildi</option>
            </select>
          </div>
        </div>
      </div>

      {/* Mesajlar */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          {error}
        </div>
      )}
      
      {message && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
          {message}
        </div>
      )}

      {/* Başvuru Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başvuru Sahibi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ülke
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Başvuru Tarihi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Durum
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  İşlemler
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredApplications.length > 0 ? (
                filteredApplications.map((app) => (
                  <tr key={app.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-green-500 flex items-center justify-center text-white font-medium">
                            {app.name?.charAt(0) || 'N'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{app.name}</div>
                          <div className="text-sm text-gray-500">{app.email}</div>
                          {app.phone && <div className="text-xs text-gray-400">{app.phone}</div>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{app.country}</span>
                        {app.city && <span className="text-sm text-gray-500 ml-1">, {app.city}</span>}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(app.submittedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(app.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedApp(app);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {app.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(app.id, 'approved')}
                            disabled={processingId === app.id}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Onayla"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleStatusChange(app.id, 'rejected')}
                            disabled={processingId === app.id}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Reddet"
                          >
                            <XCircle className="w-4 h-4" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                    Başvuru bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Başvuru Detay Modalı */}
      {showDetailsModal && selectedApp && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center sticky top-0 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">Başvuru Detayları</h3>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedApp(null);
                  setNotes('');
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Sol Kolon - Temel Bilgiler */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Kişisel Bilgiler
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ad Soyad</label>
                        <p className="text-sm text-gray-900">{selectedApp.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900">{selectedApp.email}</p>
                      </div>
                      {selectedApp.phone && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Telefon</label>
                          <p className="text-sm text-gray-900">{selectedApp.phone}</p>
                        </div>
                      )}
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ülke/Şehir</label>
                        <p className="text-sm text-gray-900">
                          {selectedApp.country}
                          {selectedApp.city && `, ${selectedApp.city}`}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Başvuru Bilgileri
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Başvuru Tarihi</label>
                        <p className="text-sm text-gray-900">{formatTimestamp(selectedApp.submittedAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Durum</label>
                        <div className="mt-1">{getStatusBadge(selectedApp.status)}</div>
                      </div>
                      {selectedApp.reviewedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">İnceleme Tarihi</label>
                          <p className="text-sm text-gray-900">{formatTimestamp(selectedApp.reviewedAt)}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Sağ Kolon - Detaylı Bilgiler */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <MessageSquare className="w-5 h-5 mr-2" />
                      Motivasyon ve Biyografi
                    </h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedApp.motivation}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">İngilizce Ana Dil Kanıtı</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedApp.proof}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Zoom Hesabı</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700">{selectedApp.zoom}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4">Haftalık Müsaitlik</h4>
                    <div className="bg-gray-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedApp.availability}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notlar ve İşlemler */}
              {selectedApp.status === 'pending' && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">İnceleme Notları</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Başvuru hakkında notlarınızı buraya yazabilirsiniz..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={3}
                  />
                  
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, 'approved')}
                      disabled={processingId === selectedApp.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Onayla
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(selectedApp.id, 'rejected')}
                      disabled={processingId === selectedApp.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reddet
                    </button>
                  </div>
                </div>
              )}

              {selectedApp.notes && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">İnceleme Notları</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedApp.notes}</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 