"use client";

import React, { useEffect, useState } from 'react';
import { db } from '@/lib/firebase/config';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { Settings, Shield, Users, Bell, Globe, Database, Key, Save, RefreshCw } from 'lucide-react';

interface SystemSettings {
  siteName: string;
  siteDescription: string;
  maintenanceMode: boolean;
  registrationEnabled: boolean;
  emailNotifications: boolean;
  maxFileSize: number;
  sessionTimeout: number;
  securityLevel: 'low' | 'medium' | 'high';
  backupFrequency: 'daily' | 'weekly' | 'monthly';
  analyticsEnabled: boolean;
  debugMode: boolean;
}

interface UserSettings {
  defaultRole: string;
  emailVerificationRequired: boolean;
  maxLoginAttempts: number;
  passwordMinLength: number;
  sessionDuration: number;
  allowProfileUpdates: boolean;
}

export default function SettingsPage() {
  const [systemSettings, setSystemSettings] = useState<SystemSettings>({
    siteName: 'SpeakNest',
    siteDescription: 'Modern dil öğrenme platformu',
    maintenanceMode: false,
    registrationEnabled: true,
    emailNotifications: true,
    maxFileSize: 10,
    sessionTimeout: 30,
    securityLevel: 'medium',
    backupFrequency: 'daily',
    analyticsEnabled: true,
    debugMode: false
  });

  const [userSettings, setUserSettings] = useState<UserSettings>({
    defaultRole: 'student',
    emailVerificationRequired: true,
    maxLoginAttempts: 5,
    passwordMinLength: 8,
    sessionDuration: 24,
    allowProfileUpdates: true
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'system' | 'users' | 'security' | 'advanced'>('system');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      // Gerçek uygulamada Firestore'dan ayarları çekeceğiz
      // Şimdilik varsayılan değerler kullanıyoruz
      setLoading(false);
    } catch (err) {
      setError('Ayarlar yüklenirken hata oluştu.');
      console.error(err);
      setLoading(false);
    }
  };

  const handleSaveSystemSettings = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      // Gerçek uygulamada Firestore'a kaydedeceğiz
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş kaydetme
      
      setMessage('Sistem ayarları başarıyla kaydedildi.');
    } catch (error: any) {
      setError('Ayarlar kaydedilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  const handleSaveUserSettings = async () => {
    setSaving(true);
    setMessage('');
    setError('');

    try {
      // Gerçek uygulamada Firestore'a kaydedeceğiz
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simüle edilmiş kaydetme
      
      setMessage('Kullanıcı ayarları başarıyla kaydedildi.');
    } catch (error: any) {
      setError('Ayarlar kaydedilemedi: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  const handleResetSettings = async () => {
    if (!confirm('Tüm ayarları varsayılan değerlere sıfırlamak istediğinizden emin misiniz?')) {
      return;
    }

    setSaving(true);
    setMessage('');
    setError('');

    try {
      // Varsayılan değerlere sıfırla
      setSystemSettings({
        siteName: 'SpeakNest',
        siteDescription: 'Modern dil öğrenme platformu',
        maintenanceMode: false,
        registrationEnabled: true,
        emailNotifications: true,
        maxFileSize: 10,
        sessionTimeout: 30,
        securityLevel: 'medium',
        backupFrequency: 'daily',
        analyticsEnabled: true,
        debugMode: false
      });

      setUserSettings({
        defaultRole: 'student',
        emailVerificationRequired: true,
        maxLoginAttempts: 5,
        passwordMinLength: 8,
        sessionDuration: 24,
        allowProfileUpdates: true
      });

      setMessage('Ayarlar varsayılan değerlere sıfırlandı.');
    } catch (error: any) {
      setError('Ayarlar sıfırlanamadı: ' + (error.message || 'Bilinmeyen hata'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl">Ayarlar yükleniyor...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Sistem Ayarları</h1>
            <p className="text-gray-600">Platform konfigürasyonu ve güvenlik ayarları</p>
          </div>
          <div className="flex items-center space-x-2">
            <Settings className="w-6 h-6 text-blue-600" />
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

      {/* Tab Navigation */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'system'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Globe className="w-4 h-4 inline mr-2" />
              Sistem
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Users className="w-4 h-4 inline mr-2" />
              Kullanıcılar
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'security'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              Güvenlik
            </button>
            <button
              onClick={() => setActiveTab('advanced')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'advanced'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Database className="w-4 h-4 inline mr-2" />
              Gelişmiş
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Sistem Ayarları Tab */}
          {activeTab === 'system' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Sistem Ayarları</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Adı</label>
                  <input
                    type="text"
                    value={systemSettings.siteName}
                    onChange={(e) => setSystemSettings({...systemSettings, siteName: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Site Açıklaması</label>
                  <input
                    type="text"
                    value={systemSettings.siteDescription}
                    onChange={(e) => setSystemSettings({...systemSettings, siteDescription: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Dosya Boyutu (MB)</label>
                  <input
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oturum Zaman Aşımı (dakika)</label>
                  <input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Güvenlik Seviyesi</label>
                  <select
                    value={systemSettings.securityLevel}
                    onChange={(e) => setSystemSettings({...systemSettings, securityLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Düşük</option>
                    <option value="medium">Orta</option>
                    <option value="high">Yüksek</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yedekleme Sıklığı</label>
                  <select
                    value={systemSettings.backupFrequency}
                    onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                  </select>
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bakım Modu</label>
                    <p className="text-xs text-gray-500">Siteyi bakım moduna alır</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Kayıt Olmaya İzin Ver</label>
                    <p className="text-xs text-gray-500">Yeni kullanıcı kayıtlarına izin verir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.registrationEnabled}
                      onChange={(e) => setSystemSettings({...systemSettings, registrationEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">E-posta Bildirimleri</label>
                    <p className="text-xs text-gray-500">Sistem e-posta bildirimlerini etkinleştirir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.emailNotifications}
                      onChange={(e) => setSystemSettings({...systemSettings, emailNotifications: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Analitik</label>
                    <p className="text-xs text-gray-500">Kullanıcı analitiklerini toplar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.analyticsEnabled}
                      onChange={(e) => setSystemSettings({...systemSettings, analyticsEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hata Ayıklama Modu</label>
                    <p className="text-xs text-gray-500">Geliştirici hata ayıklama bilgilerini gösterir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.debugMode}
                      onChange={(e) => setSystemSettings({...systemSettings, debugMode: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleResetSettings}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Sıfırla
                </button>
                <button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* Kullanıcı Ayarları Tab */}
          {activeTab === 'users' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Kullanıcı Ayarları</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Varsayılan Kullanıcı Rolü</label>
                  <select
                    value={userSettings.defaultRole}
                    onChange={(e) => setUserSettings({...userSettings, defaultRole: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="student">Öğrenci</option>
                    <option value="proUser">Pro Kullanıcı</option>
                    <option value="native">Native</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Giriş Denemesi</label>
                  <input
                    type="number"
                    value={userSettings.maxLoginAttempts}
                    onChange={(e) => setUserSettings({...userSettings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Şifre Uzunluğu</label>
                  <input
                    type="number"
                    value={userSettings.passwordMinLength}
                    onChange={(e) => setUserSettings({...userSettings, passwordMinLength: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oturum Süresi (saat)</label>
                  <input
                    type="number"
                    value={userSettings.sessionDuration}
                    onChange={(e) => setUserSettings({...userSettings, sessionDuration: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">E-posta Doğrulama Gerekli</label>
                    <p className="text-xs text-gray-500">Kullanıcıların e-posta adreslerini doğrulamasını zorunlu kılar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.emailVerificationRequired}
                      onChange={(e) => setUserSettings({...userSettings, emailVerificationRequired: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Profil Güncellemelerine İzin Ver</label>
                    <p className="text-xs text-gray-500">Kullanıcıların profil bilgilerini güncellemesine izin verir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.allowProfileUpdates}
                      onChange={(e) => setUserSettings({...userSettings, allowProfileUpdates: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveUserSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* Güvenlik Ayarları Tab */}
          {activeTab === 'security' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Güvenlik Ayarları</h3>
              
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex">
                  <Shield className="w-5 h-5 text-yellow-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Güvenlik Uyarısı</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      Bu ayarlar sistem güvenliğini doğrudan etkiler. Değişiklik yapmadan önce güvenlik etkilerini değerlendirin.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Güvenlik Seviyesi</label>
                  <select
                    value={systemSettings.securityLevel}
                    onChange={(e) => setSystemSettings({...systemSettings, securityLevel: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="low">Düşük - Temel güvenlik</option>
                    <option value="medium">Orta - Dengeli güvenlik</option>
                    <option value="high">Yüksek - Sıkı güvenlik</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Oturum Zaman Aşımı (dakika)</label>
                  <input
                    type="number"
                    value={systemSettings.sessionTimeout}
                    onChange={(e) => setSystemSettings({...systemSettings, sessionTimeout: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Giriş Denemesi</label>
                  <input
                    type="number"
                    value={userSettings.maxLoginAttempts}
                    onChange={(e) => setUserSettings({...userSettings, maxLoginAttempts: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Minimum Şifre Uzunluğu</label>
                  <input
                    type="number"
                    value={userSettings.passwordMinLength}
                    onChange={(e) => setUserSettings({...userSettings, passwordMinLength: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">E-posta Doğrulama Zorunlu</label>
                    <p className="text-xs text-gray-500">Tüm yeni kullanıcıların e-posta doğrulaması yapmasını zorunlu kılar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={userSettings.emailVerificationRequired}
                      onChange={(e) => setUserSettings({...userSettings, emailVerificationRequired: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">İki Faktörlü Kimlik Doğrulama</label>
                    <p className="text-xs text-gray-500">Kullanıcılar için 2FA desteğini etkinleştirir</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      disabled
                    />
                    <div className="w-11 h-6 bg-gray-200 rounded-full peer opacity-50"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end pt-4">
                <button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          )}

          {/* Gelişmiş Ayarlar Tab */}
          {activeTab === 'advanced' && (
            <div className="space-y-6">
              <h3 className="text-lg font-semibold text-gray-900">Gelişmiş Ayarlar</h3>
              
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex">
                  <Key className="w-5 h-5 text-red-400 mr-2 mt-0.5" />
                  <div>
                    <h4 className="text-sm font-medium text-red-800">Gelişmiş Ayarlar</h4>
                    <p className="text-sm text-red-700 mt-1">
                      Bu ayarlar sadece geliştiriciler ve sistem yöneticileri içindir. Yanlış yapılandırma sistem sorunlarına neden olabilir.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Yedekleme Sıklığı</label>
                  <select
                    value={systemSettings.backupFrequency}
                    onChange={(e) => setSystemSettings({...systemSettings, backupFrequency: e.target.value as any})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="daily">Günlük</option>
                    <option value="weekly">Haftalık</option>
                    <option value="monthly">Aylık</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Maksimum Dosya Boyutu (MB)</label>
                  <input
                    type="number"
                    value={systemSettings.maxFileSize}
                    onChange={(e) => setSystemSettings({...systemSettings, maxFileSize: parseInt(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Hata Ayıklama Modu</label>
                    <p className="text-xs text-gray-500">Geliştirici hata ayıklama bilgilerini gösterir (sadece geliştirme ortamında)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.debugMode}
                      onChange={(e) => setSystemSettings({...systemSettings, debugMode: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Analitik Toplama</label>
                    <p className="text-xs text-gray-500">Kullanıcı davranış analitiklerini toplar</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.analyticsEnabled}
                      onChange={(e) => setSystemSettings({...systemSettings, analyticsEnabled: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Bakım Modu</label>
                    <p className="text-xs text-gray-500">Siteyi bakım moduna alır (sadece adminler erişebilir)</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={systemSettings.maintenanceMode}
                      onChange={(e) => setSystemSettings({...systemSettings, maintenanceMode: e.target.checked})}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={handleResetSettings}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 disabled:opacity-50"
                >
                  <RefreshCw className="w-4 h-4 inline mr-2" />
                  Sıfırla
                </button>
                <button
                  onClick={handleSaveSystemSettings}
                  disabled={saving}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 flex items-center"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saving ? 'Kaydediliyor...' : 'Kaydet'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 