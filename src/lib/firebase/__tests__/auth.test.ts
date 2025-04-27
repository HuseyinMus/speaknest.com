import { auth, db } from '../config';
import { GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { signInWithGoogle, getUserFromDatabase, signOut, User } from '../auth';

// Mock Firebase auth ve firestore
jest.mock('../config', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

describe('Firebase Auth', () => {
  const mockUser: User = {
    uid: '123',
    email: 'test@example.com',
    displayName: 'Test User',
    photoURL: 'https://example.com/photo.jpg',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date(),
    lastLogin: new Date(),
    provider: 'google'
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('signInWithGoogle', () => {
    it('yeni kullanıcı için Firestore\'a kayıt oluşturmalı', async () => {
      const mockResult = {
        user: {
          uid: '123',
          email: 'test@example.com',
          displayName: 'Test User',
          photoURL: 'https://example.com/photo.jpg'
        }
      };

      (signInWithPopup as jest.Mock).mockResolvedValue(mockResult);
      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await signInWithGoogle();
      expect(user).toEqual(mockResult.user);
      expect(setDoc).toHaveBeenCalledWith('user-doc', expect.objectContaining({
        uid: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'student'
      }));
    });

    it('mevcut kullanıcı için login bilgilerini güncellemeli', async () => {
      const mockResult = {
        user: {
          uid: '123',
          email: 'test@example.com'
        }
      };

      (signInWithPopup as jest.Mock).mockResolvedValue(mockResult);
      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => true });
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await signInWithGoogle();
      expect(user).toEqual(mockResult.user);
      expect(setDoc).toHaveBeenCalledWith('user-doc', {
        updatedAt: expect.any(Date),
        lastLogin: expect.any(Date)
      }, { merge: true });
    });

    it('hata durumunda hatayı fırlatmalı', async () => {
      const error = new Error('Google giriş hatası');
      (signInWithPopup as jest.Mock).mockRejectedValue(error);

      await expect(signInWithGoogle()).rejects.toThrow('Google giriş hatası');
    });
  });

  describe('getUserFromDatabase', () => {
    it('giriş yapmış kullanıcı bilgilerini getirmeli', async () => {
      (auth.currentUser as any) = { uid: '123' };
      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue({
        exists: () => true,
        data: () => mockUser
      });

      const user = await getUserFromDatabase();
      expect(user).toEqual({ ...mockUser, uid: '123' });
    });

    it('giriş yapmamış kullanıcı için null dönmeli', async () => {
      (auth.currentUser as any) = null;

      const user = await getUserFromDatabase();
      expect(user).toBeNull();
    });

    it('kullanıcı Firestore\'da yoksa null dönmeli', async () => {
      (auth.currentUser as any) = { uid: '123' };
      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue({ exists: () => false });

      const user = await getUserFromDatabase();
      expect(user).toBeNull();
    });

    it('hata durumunda hatayı fırlatmalı', async () => {
      (auth.currentUser as any) = { uid: '123' };
      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockRejectedValue(new Error('Firestore hatası'));

      await expect(getUserFromDatabase()).rejects.toThrow('Firestore hatası');
    });
  });

  describe('signOut', () => {
    it('başarılı çıkış yapmalı', async () => {
      (firebaseSignOut as jest.Mock).mockResolvedValue(undefined);

      await signOut();
      expect(firebaseSignOut).toHaveBeenCalledWith(auth);
    });

    it('hata durumunda hatayı fırlatmalı', async () => {
      const error = new Error('Çıkış hatası');
      (firebaseSignOut as jest.Mock).mockRejectedValue(error);

      await expect(signOut()).rejects.toThrow('Çıkış hatası');
    });
  });
}); 