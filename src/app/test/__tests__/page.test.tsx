import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import TestPage from '../page';
import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';

// Mock auth
jest.mock('@/lib/firebase/config', () => ({
  auth: {
    onAuthStateChanged: jest.fn(),
  },
  db: {},
}));

// Mock fetch
global.fetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({ success: true }),
  })
) as jest.Mock;

// Mock Firestore
jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
}));

// Mock window.alert
global.alert = jest.fn();

describe('TestPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('yükleme durumunu gösterir', () => {
    render(<TestPage />);
    expect(screen.getByText('Yükleniyor...')).toBeInTheDocument();
  });

  it('giriş yapılmamışsa uygun mesajı gösterir', async () => {
    // Auth state'i null olarak ayarla
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(null);
      return jest.fn();
    });

    render(<TestPage />);
    
    await waitFor(() => {
      expect(screen.getByText('Lütfen giriş yapın')).toBeInTheDocument();
    });
  });

  it('giriş yapılmışsa kullanıcı bilgilerini gösterir', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    };

    const mockUserProfile = {
      role: 'student'
    };

    // Auth state'i ayarla
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Firestore mock
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockUserProfile
    });

    render(<TestPage />);

    await waitFor(() => {
      // Daha spesifik seçiciler kullan
      const uidElement = screen.getByText('UID:').parentElement;
      expect(uidElement).toHaveTextContent(mockUser.uid);

      const emailElement = screen.getByText('Email:').parentElement;
      expect(emailElement).toHaveTextContent(mockUser.email);

      const roleElement = screen.getByText('Rol:').parentElement;
      expect(roleElement).toHaveTextContent(mockUserProfile.role);
    });
  });

  it('test butonu tıklandığında cookie ayarlar', async () => {
    const mockUser = {
      uid: 'test-uid',
      email: 'test@example.com'
    };

    const mockUserProfile = {
      role: 'student'
    };

    // Auth state'i ayarla
    (auth.onAuthStateChanged as jest.Mock).mockImplementation((callback) => {
      callback(mockUser);
      return jest.fn();
    });

    // Firestore mock
    (getDoc as jest.Mock).mockResolvedValue({
      exists: () => true,
      data: () => mockUserProfile
    });

    render(<TestPage />);

    // Test butonunu bul ve tıkla
    const testButton = await screen.findByText('Test Et');
    fireEvent.click(testButton);

    // fetch çağrısını kontrol et
    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith('/api/auth/cookie', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          uid: mockUser.uid,
          role: mockUserProfile.role
        })
      });
    });

    // Alert çağrısını kontrol et
    expect(global.alert).toHaveBeenCalledWith('Test başarılı! Cookie ayarlandı.');
  });
}); 