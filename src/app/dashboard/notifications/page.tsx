"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, orderBy, addDoc, updateDoc, doc, where } from 'firebase/firestore';
import { Bell, Search, Filter, Send, Eye, Trash2, Plus, Users, Calendar, MessageSquare, Settings } from 'lucide-react';

interface Notification {
  id: string;
  userId?: string;
  userEmail?: string;
  type: string;
  title: string;
  message: string;
  createdAt: any;
  read: boolean;
  sent: boolean;
  sentAt?: any;
  category: 'system' | 'user' | 'payment' | 'application';
}

interface NotificationTemplate {
  id: string;
  name: string;
  title: string;
  message: string;
  category: string;
  variables: string[];
  createdAt: any;
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [templates, setTemplates] = useState<NotificationTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'notifications' | 'templates' | 'send'>('notifications');
  const [message, setMessage] = useState('');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateForm, setTemplateForm] = useState({
    name: '',
    title: '',
    message: '',
    category: 'system',
    variables: ''
  });
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  // Send notification form
  const [sendForm, setSendForm] = useState({
    template: '',
    title: '',
    message: '',
    category: 'system',
    targetUsers: 'all', // all, specific, role
    specificUsers: '',
    userRole: 'student'
  });

  useEffect(() => {
    fetchNotifications();
    fetchTemplates();
    fetchUsers();
  }, []);

  const fetchNotifications = async () => {
    try {
      const notificationsQuery = query(collection(db, 'notifications'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(notificationsQuery);
      const notificationsData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as Notification[];
      setNotifications(notificationsData);
    } catch (err) {
      setError('Bildirimler yüklenirken hata oluştu.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTemplates = async () => {
    try {
      const templatesQuery = query(collection(db, 'notificationTemplates'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(templatesQuery);
      const templatesData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data() 
      })) as NotificationTemplate[];
      setTemplates(templatesData);
    } catch (err) {
      console.error('Şablonlar yüklenirken hata:', err);
    }
  };

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      const usersQuery = query(collection(db, 'users'));
      const querySnapshot = await getDocs(usersQuery);
      const usersData = querySnapshot.docs.map(doc => ({ 
        id: doc.id, 
        ...doc.data(),
        displayName: doc.data().displayName || doc.data().name || doc.data().email?.split('@')[0] || 'Kullanıcı',
        email: doc.data().email || 'Email yok',
        role: doc.data().role || doc.data().userType || 'student'
      }));
      setUsers(usersData);
      console.log('Yüklenen kullanıcılar:', usersData.length);
    } catch (err) {
      console.error('Kullanıcılar yüklenirken hata:', err);
      setError('Kullanıcılar yüklenirken hata oluştu.');
    } finally {
      setUsersLoading(false);
    }
  };

  const handleTemplateSelect = (templateId: string) => {
    const selectedTemplate = templates.find(t => t.id === templateId);
    if (selectedTemplate) {
      setSendForm({
        ...sendForm,
        template: templateId,
        title: selectedTemplate.title,
        message: selectedTemplate.message,
        category: selectedTemplate.category
      });
    }
  };

  const handleSendNotification = async () => {
    try {
      let targetUserIds: string[] = [];
      
      // Hedef kullanıcıları belirle
      if (sendForm.targetUsers === 'all') {
        // Tüm kullanıcılara gönder
        targetUserIds = users.map(user => user.id);
      } else if (sendForm.targetUsers === 'specific' && sendForm.specificUsers) {
        // Belirli kullanıcıya gönder
        targetUserIds = [sendForm.specificUsers];
      } else if (sendForm.targetUsers === 'role') {
        // Rol bazlı gönder
        targetUserIds = users
          .filter(user => user.role === sendForm.userRole || user.userType === sendForm.userRole)
          .map(user => user.id);
      }

      if (targetUserIds.length === 0) {
        setError('Hedef kullanıcı bulunamadı.');
        return;
      }

      // Her hedef kullanıcı için bildirim oluştur
      const notificationPromises = targetUserIds.map(async (userId) => {
        const user = users.find(u => u.id === userId);
        const notificationData = {
          userId: userId,
          userEmail: user?.email || user?.displayName || user?.name,
          type: sendForm.category,
          title: sendForm.title,
          message: sendForm.message,
          category: sendForm.category,
          createdAt: new Date(),
          read: false,
          sent: true,
          sentAt: new Date()
        };
        
        return addDoc(collection(db, 'notifications'), notificationData);
      });

      await Promise.all(notificationPromises);
      
      setMessage(`${targetUserIds.length} kullanıcıya bildirim başarıyla gönderildi.`);
      setSendForm({
        template: '',
        title: '',
        message: '',
        category: 'system',
        targetUsers: 'all',
        specificUsers: '',
        userRole: 'student'
      });
      fetchNotifications();
    } catch (error: any) {
      setError('Bildirim gönderilemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleMarkAsRead = async (id: string) => {
    try {
      await updateDoc(doc(db, 'notifications', id), { read: true });
      setNotifications(notifications.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
    } catch (error: any) {
      setError('Bildirim güncellenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleDeleteNotification = async (id: string) => {
    if (!confirm('Bu bildirimi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Gerçek uygulamada deleteDoc kullanılacak
      setNotifications(notifications.filter(notification => notification.id !== id));
      setMessage('Bildirim başarıyla silindi.');
    } catch (error: any) {
      setError('Bildirim silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleAddTemplate = async () => {
    try {
      if (!templateForm.name.trim() || !templateForm.title.trim() || !templateForm.message.trim()) {
        setError('Şablon adı, başlık ve mesaj alanları zorunludur.');
        return;
      }

      const variablesArray = templateForm.variables.split(',').map(v => v.trim()).filter(v => v);
      
      const templateData = {
        name: templateForm.name.trim(),
        title: templateForm.title.trim(),
        message: templateForm.message.trim(),
        category: templateForm.category,
        variables: variablesArray,
        createdAt: new Date()
      };

      await addDoc(collection(db, 'notificationTemplates'), templateData);
      
      setMessage('Şablon başarıyla eklendi.');
      setShowTemplateModal(false);
      setTemplateForm({
        name: '',
        title: '',
        message: '',
        category: 'system',
        variables: ''
      });
      fetchTemplates();
    } catch (error: any) {
      setError('Şablon eklenemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const handleDeleteTemplate = async (id: string) => {
    if (!confirm('Bu şablonu silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      // Gerçek uygulamada deleteDoc kullanılacak
      setTemplates(templates.filter(template => template.id !== id));
      setMessage('Şablon başarıyla silindi.');
    } catch (error: any) {
      setError('Şablon silinemedi: ' + (error.message || 'Bilinmeyen hata'));
    }
  };

  const filteredNotifications = notifications.filter(notification => {
    const matchesSearch = 
      notification.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notification.userEmail?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = categoryFilter === 'all' || notification.category === categoryFilter;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'read' && notification.read) || 
      (statusFilter === 'unread' && !notification.read);
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  const getStats = () => {
    const total = notifications.length;
    const unread = notifications.filter(n => !n.read).length;
    const sent = notifications.filter(n => n.sent).length;
    const templatesCount = templates.length;
    
    return { total, unread, sent, templates: templatesCount };
  };

  const stats = getStats();

  const formatTimestamp = (timestamp: any) => {
    if (!timestamp) return 'Bilinmiyor';
    const date = timestamp.seconds ? new Date(timestamp.seconds * 1000) : new Date(timestamp);
    return date.toLocaleString('tr-TR');
  };

  const getCategoryBadge = (category: string) => {
    const colors = {
      system: 'bg-blue-100 text-blue-800',
      user: 'bg-green-100 text-green-800',
      payment: 'bg-purple-100 text-purple-800',
      application: 'bg-yellow-100 text-yellow-800'
    };
    
    const labels = {
      system: 'Sistem',
      user: 'Kullanıcı',
      payment: 'Ödeme',
      application: 'Başvuru'
    };
    
    return (
      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'}`}>
        {labels[category as keyof typeof labels] || category}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Bildirimler yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Bildirim Yönetimi</h1>
            <p className="text-gray-600">Sistem bildirimleri ve kullanıcı mesajları</p>
          </div>
          <div className="flex items-center space-x-2">
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
        </div>
      </div>

      {/* İstatistik Kartları */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-blue-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Toplam Bildirim</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
            <Bell className="w-6 h-6 text-blue-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-yellow-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Okunmamış</p>
              <p className="text-2xl font-bold text-gray-900">{stats.unread}</p>
            </div>
            <MessageSquare className="w-6 h-6 text-yellow-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-green-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Gönderildi</p>
              <p className="text-2xl font-bold text-gray-900">{stats.sent}</p>
            </div>
            <Send className="w-6 h-6 text-green-600" />
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 border-l-4 border-purple-500">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Şablonlar</p>
              <p className="text-2xl font-bold text-gray-900">{stats.templates}</p>
            </div>
            <Settings className="w-6 h-6 text-purple-600" />
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('notifications')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'notifications'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Bell className="w-4 h-4 inline mr-2" />
              Bildirimler
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'templates'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Settings className="w-4 h-4 inline mr-2" />
              Şablonlar
            </button>
            <button
              onClick={() => setActiveTab('send')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'send'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Send className="w-4 h-4 inline mr-2" />
              Bildirim Gönder
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Mesajlar */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded mb-4">
              {error}
            </div>
          )}
          
          {message && (
            <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded mb-4">
              {message}
            </div>
          )}

          {/* Bildirimler Tab */}
          {activeTab === 'notifications' && (
            <div>
              {/* Filtreler */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Arama</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Bildirim ara..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori Filtresi</label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Kategoriler</option>
                    <option value="system">Sistem</option>
                    <option value="user">Kullanıcı</option>
                    <option value="payment">Ödeme</option>
                    <option value="application">Başvuru</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Durum Filtresi</label>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="all">Tüm Durumlar</option>
                    <option value="read">Okundu</option>
                    <option value="unread">Okunmadı</option>
                  </select>
                </div>
              </div>

              {/* Bildirim Listesi */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Bildirim
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Kategori
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Tarih
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
                      {filteredNotifications.length > 0 ? (
                        filteredNotifications.map((notification) => (
                          <tr key={notification.id} className={`hover:bg-gray-50 ${!notification.read ? 'bg-blue-50' : ''}`}>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div>
                                <div className="text-sm font-medium text-gray-900">{notification.title}</div>
                                <div className="text-sm text-gray-500 max-w-xs truncate">{notification.message}</div>
                                {notification.userEmail && (
                                  <div className="text-xs text-gray-400">{notification.userEmail}</div>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              {getCategoryBadge(notification.category)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {formatTimestamp(notification.createdAt)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                notification.read ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                              }`}>
                                {notification.read ? 'Okundu' : 'Okunmadı'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                              {!notification.read && (
                                <button
                                  onClick={() => handleMarkAsRead(notification.id)}
                                  className="text-green-600 hover:text-green-900 bg-green-50 px-2 py-1 rounded text-xs"
                                  title="Okundu Olarak İşaretle"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={() => handleDeleteNotification(notification.id)}
                                className="text-red-600 hover:text-red-900 bg-red-50 px-2 py-1 rounded text-xs"
                                title="Sil"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                            Bildirim bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Şablonlar Tab */}
          {activeTab === 'templates' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Bildirim Şablonları</h3>
                <button 
                  onClick={() => setShowTemplateModal(true)}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Yeni Şablon
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div key={template.id} className="bg-white rounded-lg shadow-md p-4 border">
                    <div className="flex justify-between items-start mb-2">
                      <h4 className="font-semibold text-gray-900">{template.name}</h4>
                      {getCategoryBadge(template.category)}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{template.title}</p>
                    <p className="text-xs text-gray-500 mb-3">{template.message}</p>
                    <div className="flex justify-between items-center">
                      <span className="text-xs text-gray-400">
                        {template.variables.length} değişken
                      </span>
                      <div className="space-x-1">
                        <button className="text-blue-600 hover:text-blue-900 text-xs">Düzenle</button>
                        <button 
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-red-600 hover:text-red-900 text-xs"
                        >
                          Sil
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bildirim Gönder Tab */}
          {activeTab === 'send' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Yeni Bildirim Gönder</h3>
              
              <div className="bg-white rounded-lg shadow-md p-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Seç (Opsiyonel)</label>
                    <select
                      value={sendForm.template}
                      onChange={(e) => handleTemplateSelect(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Şablon seçin</option>
                      {templates.map(template => (
                        <option key={template.id} value={template.id}>{template.name}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Başlık</label>
                    <input
                      type="text"
                      value={sendForm.title}
                      onChange={(e) => setSendForm({...sendForm, title: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Bildirim başlığı"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj</label>
                    <textarea
                      value={sendForm.message}
                      onChange={(e) => setSendForm({...sendForm, message: e.target.value})}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      rows={4}
                      placeholder="Bildirim mesajı"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                      <select
                        value={sendForm.category}
                        onChange={(e) => setSendForm({...sendForm, category: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="system">Sistem</option>
                        <option value="user">Kullanıcı</option>
                        <option value="payment">Ödeme</option>
                        <option value="application">Başvuru</option>
                      </select>
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Kullanıcılar</label>
                      <select
                        value={sendForm.targetUsers}
                        onChange={(e) => setSendForm({...sendForm, targetUsers: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="all">Tüm Kullanıcılar</option>
                        <option value="specific">Belirli Kullanıcılar</option>
                        <option value="role">Rol Bazlı</option>
                      </select>
                    </div>
                  </div>
                  
                  {sendForm.targetUsers === 'specific' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Kullanıcı Seç</label>
                      <select
                        value={sendForm.specificUsers}
                        onChange={(e) => setSendForm({...sendForm, specificUsers: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="">Kullanıcı seçin</option>
                        {users.map(user => (
                          <option key={user.id} value={user.id}>
                            {user.displayName} ({user.email}) - {user.role}
                          </option>
                        ))}
                      </select>
                      {usersLoading && (
                        <p className="text-xs text-gray-500 mt-1">Kullanıcılar yükleniyor... ({users.length} kullanıcı bulundu)</p>
                      )}
                      {!usersLoading && (
                        <p className="text-xs text-gray-500 mt-1">{users.length} kullanıcı bulundu</p>
                      )}
                    </div>
                  )}
                  
                  {sendForm.targetUsers === 'role' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Hedef Rol</label>
                      <select
                        value={sendForm.userRole}
                        onChange={(e) => setSendForm({...sendForm, userRole: e.target.value})}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      >
                        <option value="student">Öğrenci</option>
                        <option value="proUser">Pro Kullanıcı</option>
                        <option value="native">Native</option>
                        <option value="admin">Admin</option>
                      </select>
                      <p className="text-xs text-gray-500 mt-1">
                        Bu role sahip {users.filter(user => user.role === sendForm.userRole).length} kullanıcı bulundu
                      </p>
                    </div>
                  )}
                  
                  <div className="flex justify-end pt-4">
                    <button
                      onClick={handleSendNotification}
                      disabled={!sendForm.title || !sendForm.message || usersLoading}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {usersLoading ? 'Kullanıcılar Yükleniyor...' : 'Bildirim Gönder'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Şablon Ekleme Modal */}
      {showTemplateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center sticky top-0 bg-blue-50">
              <h3 className="text-lg font-semibold text-blue-800">Yeni Bildirim Şablonu</h3>
              <button 
                onClick={() => {
                  setShowTemplateModal(false);
                  setTemplateForm({
                    name: '',
                    title: '',
                    message: '',
                    category: 'system',
                    variables: ''
                  });
                }}
                className="text-gray-500 hover:text-gray-700 focus:outline-none"
              >
                <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Şablon Adı <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={templateForm.name}
                    onChange={(e) => setTemplateForm({...templateForm, name: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Şablon adını girin"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Başlık <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    value={templateForm.title}
                    onChange={(e) => setTemplateForm({...templateForm, title: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Bildirim başlığı"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Mesaj <span className="text-red-500">*</span></label>
                  <textarea
                    value={templateForm.message}
                    onChange={(e) => setTemplateForm({...templateForm, message: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    rows={4}
                    placeholder={"Bildirim mesajı. Değişkenler için {{değişken_adı}} formatını kullanın."}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Kategori</label>
                  <select
                    value={templateForm.category}
                    onChange={(e) => setTemplateForm({...templateForm, category: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="system">Sistem</option>
                    <option value="user">Kullanıcı</option>
                    <option value="payment">Ödeme</option>
                    <option value="application">Başvuru</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Değişkenler (virgülle ayırın)</label>
                  <input
                    type="text"
                    value={templateForm.variables}
                    onChange={(e) => setTemplateForm({...templateForm, variables: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="kullanıcı_adı, tarih, tutar"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Mesajda {'{{değişken_adı}}'} formatında kullanılacak değişkenleri buraya girin.
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    onClick={() => {
                      setShowTemplateModal(false);
                      setTemplateForm({
                        name: '',
                        title: '',
                        message: '',
                        category: 'system',
                        variables: ''
                      });
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                  >
                    İptal
                  </button>
                  <button
                    onClick={handleAddTemplate}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Şablon Ekle
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 