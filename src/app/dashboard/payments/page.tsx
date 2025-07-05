"use client";

import React, { useEffect, useState } from 'react';
import { collection, getDocs, query, orderBy, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { DollarSign, Search, Filter, Eye, CheckCircle, XCircle, Clock, User, Calendar, CreditCard, TrendingUp, TrendingDown } from 'lucide-react';

interface PaymentRequest {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  amount: number;
  currency: string;
  paymentMethod: string;
  bankInfo?: {
    bankName: string;
    accountNumber: string;
    iban: string;
  };
  requestedAt: any;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
  processedAt?: any;
  processedBy?: string;
  reason?: string;
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedPayment, setSelectedPayment] = useState<PaymentRequest | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [notes, setNotes] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');

  useEffect(() => {
    fetchPayments();
  }, []);

  const fetchPayments = async () => {
    try {
      const paymentsQuery = query(collection(db, 'paymentRequests'), orderBy('requestedAt', 'desc'));
      const querySnapshot = await getDocs(paymentsQuery);
      const paymentsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as PaymentRequest[];
      setPayments(paymentsData);
    } catch (err) {
      setError('Ödeme talepleri yüklenirken hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, status: 'approved' | 'rejected') => {
    setProcessingId(id);
    setMessage('');
    
    try {
      const paymentRef = doc(db, 'paymentRequests', id);
      const updateData: any = {
        status,
        processedAt: new Date(),
        processedBy: 'admin'
      };

      if (status === 'rejected' && rejectionReason) {
        updateData.reason = rejectionReason;
      }

      if (notes) {
        updateData.notes = notes;
      }

      await updateDoc(paymentRef, updateData);
      
      setPayments(payments => payments.map(payment => 
        payment.id === id ? { ...payment, ...updateData } : payment
      ));
      
      setMessage(`Ödeme talebi ${status === 'approved' ? 'onaylandı' : 'reddedildi'}.`);
      setShowDetailsModal(false);
      setNotes('');
      setRejectionReason('');
    } catch (error: any) {
      setError('Durum güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setProcessingId(null);
    }
  };

  const filteredPayments = payments.filter(payment => {
    const matchesSearch = 
      payment.userName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userEmail?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      payment.userId?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    
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

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('tr-TR');
  };

  const formatCurrency = (amount: number, currency: string = 'TRY') => {
    return new Intl.NumberFormat('tr-TR', {
      style: 'currency',
      currency: currency
    }).format(amount);
  };

  const getStats = () => {
    const total = payments.length;
    const pending = payments.filter(payment => payment.status === 'pending');
    const approved = payments.filter(payment => payment.status === 'approved');
    const rejected = payments.filter(payment => payment.status === 'rejected');
    
    const totalAmount = payments.reduce((sum, payment) => sum + payment.amount, 0);
    const pendingAmount = pending.reduce((sum, payment) => sum + payment.amount, 0);
    const approvedAmount = approved.reduce((sum, payment) => sum + payment.amount, 0);
    
    return { 
      total, 
      pending: pending.length, 
      approved: approved.length, 
      rejected: rejected.length,
      totalAmount,
      pendingAmount,
      approvedAmount
    };
  };

  const stats = getStats();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Ödeme talepleri yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Ödeme Talepleri</h1>
            <p className="text-gray-600">Toplam {stats.total} ödeme talebi</p>
          </div>
          <div className="flex items-center space-x-2">
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Talep</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-sm text-gray-500">{formatCurrency(stats.totalAmount)}</p>
            </div>
            <DollarSign className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Beklemede</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
              <p className="text-sm text-gray-500">{formatCurrency(stats.pendingAmount)}</p>
            </div>
            <Clock className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Onaylandı</p>
              <p className="text-2xl font-bold text-gray-900">{stats.approved}</p>
              <p className="text-sm text-gray-500">{formatCurrency(stats.approvedAmount)}</p>
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
                placeholder="Kullanıcı adı, email veya ID ara..."
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

      {/* Ödeme Listesi */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Kullanıcı
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Tutar
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Ödeme Yöntemi
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Talep Tarihi
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
              {filteredPayments.length > 0 ? (
                filteredPayments.map((payment) => (
                  <tr key={payment.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          <div className="h-10 w-10 rounded-full bg-purple-500 flex items-center justify-center text-white font-medium">
                            {payment.userName?.charAt(0) || 'U'}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{payment.userName}</div>
                          <div className="text-sm text-gray-500">{payment.userEmail}</div>
                          <div className="text-xs text-gray-400">ID: {payment.userId?.slice(0, 8)}...</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(payment.amount, payment.currency)}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <CreditCard className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{payment.paymentMethod}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(payment.requestedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusBadge(payment.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      <button
                        onClick={() => {
                          setSelectedPayment(payment);
                          setShowDetailsModal(true);
                        }}
                        className="text-blue-600 hover:text-blue-900 bg-blue-50 px-2 py-1 rounded text-xs"
                        title="Detayları Görüntüle"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      
                      {payment.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleStatusChange(payment.id, 'approved')}
                            disabled={processingId === payment.id}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs disabled:opacity-50"
                            title="Onayla"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                          
                          <button
                            onClick={() => handleStatusChange(payment.id, 'rejected')}
                            disabled={processingId === payment.id}
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
                  <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                    Ödeme talebi bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ödeme Detay Modalı */}
      {showDetailsModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center sticky top-0 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">Ödeme Talebi Detayları</h3>
              <button 
                onClick={() => {
                  setShowDetailsModal(false);
                  setSelectedPayment(null);
                  setNotes('');
                  setRejectionReason('');
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
                {/* Sol Kolon - Kullanıcı ve Ödeme Bilgileri */}
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <User className="w-5 h-5 mr-2" />
                      Kullanıcı Bilgileri
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ad Soyad</label>
                        <p className="text-sm text-gray-900">{selectedPayment.userName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Email</label>
                        <p className="text-sm text-gray-900">{selectedPayment.userEmail}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Kullanıcı ID</label>
                        <p className="text-sm text-gray-900 font-mono">{selectedPayment.userId}</p>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <DollarSign className="w-5 h-5 mr-2" />
                      Ödeme Bilgileri
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Tutar</label>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(selectedPayment.amount, selectedPayment.currency)}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Ödeme Yöntemi</label>
                        <p className="text-sm text-gray-900">{selectedPayment.paymentMethod}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Talep Tarihi</label>
                        <p className="text-sm text-gray-900">{formatTimestamp(selectedPayment.requestedAt)}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Durum</label>
                        <div className="mt-1">{getStatusBadge(selectedPayment.status)}</div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sağ Kolon - Banka Bilgileri ve İşlem Geçmişi */}
                <div className="space-y-6">
                  {selectedPayment.bankInfo && (
                    <div>
                      <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                        <CreditCard className="w-5 h-5 mr-2" />
                        Banka Bilgileri
                      </h4>
                      <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                        <div>
                          <label className="text-sm font-medium text-gray-600">Banka Adı</label>
                          <p className="text-sm text-gray-900">{selectedPayment.bankInfo.bankName}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">Hesap Numarası</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedPayment.bankInfo.accountNumber}</p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600">IBAN</label>
                          <p className="text-sm text-gray-900 font-mono">{selectedPayment.bankInfo.iban}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div>
                    <h4 className="font-semibold text-gray-800 mb-4 flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      İşlem Geçmişi
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Talep Tarihi</label>
                        <p className="text-sm text-gray-900">{formatTimestamp(selectedPayment.requestedAt)}</p>
                      </div>
                      {selectedPayment.processedAt && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">İşlem Tarihi</label>
                          <p className="text-sm text-gray-900">{formatTimestamp(selectedPayment.processedAt)}</p>
                        </div>
                      )}
                      {selectedPayment.processedBy && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">İşlemi Yapan</label>
                          <p className="text-sm text-gray-900">{selectedPayment.processedBy}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Notlar ve İşlemler */}
              {selectedPayment.status === 'pending' && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">İşlem Notları</h4>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Ödeme talebi hakkında notlarınızı buraya yazabilirsiniz..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4"
                    rows={3}
                  />
                  
                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      onClick={() => handleStatusChange(selectedPayment.id, 'approved')}
                      disabled={processingId === selectedPayment.id}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Onayla
                    </button>
                    
                    <button
                      onClick={() => handleStatusChange(selectedPayment.id, 'rejected')}
                      disabled={processingId === selectedPayment.id}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 flex items-center"
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reddet
                    </button>
                  </div>
                </div>
              )}

              {selectedPayment.notes && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">İşlem Notları</h4>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedPayment.notes}</p>
                  </div>
                </div>
              )}

              {selectedPayment.reason && (
                <div className="mt-6 border-t pt-6">
                  <h4 className="font-semibold text-gray-800 mb-4">Red Nedeni</h4>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-sm text-gray-700">{selectedPayment.reason}</p>
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