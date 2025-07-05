"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Star } from 'lucide-react';

export default function CommentsManagementPage() {
  const [testimonials, setTestimonials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [newTestimonial, setNewTestimonial] = useState({
    name: '',
    role: '',
    content: '',
    rating: 5,
    date: ''
  });

  useEffect(() => {
    fetchTestimonials();
  }, []);

  const fetchTestimonials = async () => {
    try {
      const testimonialsQuery = query(collection(db, 'testimonials'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(testimonialsQuery);
      const testimonialsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setTestimonials(testimonialsData);
    } catch (err) {
      setError('Yorumlar yüklenemedi.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApproveTestimonial = async (id: string) => {
    try {
      const testimonialRef = doc(db, 'testimonials', id);
      await updateDoc(testimonialRef, {
        approved: true,
        approvedAt: serverTimestamp()
      });
      fetchTestimonials();
    } catch (error) {
      console.error('Yorum onaylanamadı:', error);
      setError('Yorum onaylanırken bir hata oluştu.');
    }
  };

  const handleRejectTestimonial = async (id: string) => {
    if (window.confirm('Bu yorumu reddetmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
        fetchTestimonials();
      } catch (error) {
        console.error('Yorum reddedilemedi:', error);
        setError('Yorum reddedilirken bir hata oluştu.');
      }
    }
  };

  const handleAddTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTestimonial.name || !newTestimonial.role || !newTestimonial.content) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      await addDoc(collection(db, 'testimonials'), {
        ...newTestimonial,
        createdAt: serverTimestamp(),
        approved: true
      });
      setShowAddModal(false);
      setNewTestimonial({ name: '', role: '', content: '', rating: 5, date: '' });
      fetchTestimonials();
    } catch (error) {
      console.error('Yorum eklenemedi:', error);
      setError('Yorum eklenirken bir hata oluştu.');
    }
  };

  const handleEditTestimonial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTestimonial.name || !editingTestimonial.role || !editingTestimonial.content) {
      setError('Lütfen tüm alanları doldurun.');
      return;
    }

    try {
      const testimonialRef = doc(db, 'testimonials', editingTestimonial.id);
      await updateDoc(testimonialRef, {
        name: editingTestimonial.name,
        role: editingTestimonial.role,
        content: editingTestimonial.content,
        rating: editingTestimonial.rating,
        date: editingTestimonial.date,
        updatedAt: serverTimestamp()
      });
      setShowEditModal(false);
      setEditingTestimonial(null);
      fetchTestimonials();
    } catch (error) {
      console.error('Yorum güncellenemedi:', error);
      setError('Yorum güncellenirken bir hata oluştu.');
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (window.confirm('Bu yorumu silmek istediğinizden emin misiniz?')) {
      try {
        await deleteDoc(doc(db, 'testimonials', id));
        fetchTestimonials();
      } catch (error) {
        console.error('Yorum silinemedi:', error);
        setError('Yorum silinirken bir hata oluştu.');
      }
    }
  };

  if (loading) return <div className="p-6 text-center">Yorumlar yükleniyor...</div>;
  if (error) return <div className="p-6 text-red-500">{error}</div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
          <h2 className="text-lg font-semibold text-gray-800">Yorum Yönetimi</h2>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            + Yeni Yorum Ekle
          </button>
        </div>
      </div>

      {/* Testimonials List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full max-w-full w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İsim</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rol</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Yorum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Puan</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Durum</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Kaynak</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tarih</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">İşlemler</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {testimonials.length > 0 ? (
                testimonials.map((testimonial) => (
                  <tr key={testimonial.id} className={`hover:bg-gray-50 ${!testimonial.approved ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {testimonial.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {testimonial.role}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-500 max-w-xs truncate">
                      {testimonial.content}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <div className="flex">
                        {[...Array(testimonial.rating || 5)].map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      {testimonial.approved ? (
                        <span className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Onaylandı
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                          Beklemede
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {testimonial.source === 'notification_response' ? (
                        <span className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full">
                          Bildirim Yanıtı
                        </span>
                      ) : (
                        <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-800 rounded-full">
                          Manuel
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {testimonial.date || 'Belirtilmemiş'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                      {!testimonial.approved && (
                        <>
                          <button
                            onClick={() => handleApproveTestimonial(testimonial.id)}
                            className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                          >
                            Onayla
                          </button>
                          <button
                            onClick={() => handleRejectTestimonial(testimonial.id)}
                            className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                          >
                            Reddet
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => {
                          setEditingTestimonial(testimonial);
                          setShowEditModal(true);
                        }}
                        className="text-indigo-600 hover:text-indigo-900 bg-indigo-50 px-2 py-1 rounded text-xs"
                      >
                        Düzenle
                      </button>
                      <button
                        onClick={() => handleDeleteTestimonial(testimonial.id)}
                        className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                      >
                        Sil
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="px-6 py-4 text-center text-sm text-gray-500">
                    Henüz yorum bulunmuyor.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-green-50 border-b border-green-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-green-800">Yeni Yorum Ekle</h3>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleAddTestimonial} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İsim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.name}
                    onChange={(e) => setNewTestimonial({...newTestimonial, name: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Kullanıcı adı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={newTestimonial.role}
                    onChange={(e) => setNewTestimonial({...newTestimonial, role: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Meslek/Rol"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yorum <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={newTestimonial.content}
                    onChange={(e) => setNewTestimonial({...newTestimonial, content: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    placeholder="Kullanıcı yorumu"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puan
                    </label>
                    <select
                      value={newTestimonial.rating}
                      onChange={(e) => setNewTestimonial({...newTestimonial, rating: parseInt(e.target.value)})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                    >
                      <option value={5}>5 Yıldız</option>
                      <option value={4}>4 Yıldız</option>
                      <option value={3}>3 Yıldız</option>
                      <option value={2}>2 Yıldız</option>
                      <option value={1}>1 Yıldız</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarih
                    </label>
                    <input
                      type="text"
                      value={newTestimonial.date}
                      onChange={(e) => setNewTestimonial({...newTestimonial, date: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
                      placeholder="1 hafta önce"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-md hover:bg-green-700"
                >
                  Yorum Ekle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && editingTestimonial && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-lg overflow-hidden">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-blue-800">Yorum Düzenle</h3>
              <button 
                onClick={() => setShowEditModal(false)}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <form onSubmit={handleEditTestimonial} className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    İsim <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.name}
                    onChange={(e) => setEditingTestimonial({...editingTestimonial, name: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kullanıcı adı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Rol <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={editingTestimonial.role}
                    onChange={(e) => setEditingTestimonial({...editingTestimonial, role: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Meslek/Rol"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Yorum <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={editingTestimonial.content}
                    onChange={(e) => setEditingTestimonial({...editingTestimonial, content: e.target.value})}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Kullanıcı yorumu"
                    rows={4}
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Puan
                    </label>
                    <select
                      value={editingTestimonial.rating}
                      onChange={(e) => setEditingTestimonial({...editingTestimonial, rating: parseInt(e.target.value)})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={5}>5 Yıldız</option>
                      <option value={4}>4 Yıldız</option>
                      <option value={3}>3 Yıldız</option>
                      <option value={2}>2 Yıldız</option>
                      <option value={1}>1 Yıldız</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tarih
                    </label>
                    <input
                      type="text"
                      value={editingTestimonial.date}
                      onChange={(e) => setEditingTestimonial({...editingTestimonial, date: e.target.value})}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="1 hafta önce"
                    />
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
                >
                  İptal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
                >
                  Güncelle
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
} 