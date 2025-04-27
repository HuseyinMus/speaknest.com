import { db } from '@/lib/firebase/config';
import { collection, doc, getDoc, getDocs, setDoc, updateDoc, deleteDoc, query, where } from 'firebase/firestore';
import { User, UserService } from '../UserService';

// Mock Firebase Firestore
jest.mock('@/lib/firebase/config', () => ({
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  collection: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  getDocs: jest.fn(),
  setDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
}));

describe('User Service', () => {
  const mockUserData = {
    email: 'test@example.com',
    displayName: 'Test User',
    role: 'student',
    createdAt: new Date(),
    updatedAt: new Date()
  };

  const mockUser = new User(
    '123',
    mockUserData.email,
    mockUserData.displayName,
    mockUserData.role,
    mockUserData.createdAt,
    mockUserData.updatedAt
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('aynı instance\'ı döndürmeli', () => {
      const instance1 = UserService.getInstance();
      const instance2 = UserService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('User Class', () => {
    it('toJSON metodu doğru veriyi döndürmeli', () => {
      const json = mockUser.toJSON();
      expect(json).toEqual({
        id: '123',
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'student',
        createdAt: mockUserData.createdAt,
        updatedAt: mockUserData.updatedAt
      });
    });

    it('fromFirestore metodu Firestore verilerini doğru işlemeli', () => {
      const firestoreData = {
        email: 'test@example.com',
        displayName: 'Test User',
        role: 'student',
        createdAt: { seconds: 1234567890 },
        updatedAt: { seconds: 1234567890 }
      };

      const user = User.fromFirestore('123', firestoreData);
      expect(user).toBeInstanceOf(User);
      expect(user.id).toBe('123');
      expect(user.email).toBe('test@example.com');
      expect(user.displayName).toBe('Test User');
      expect(user.role).toBe('student');
      expect(user.createdAt).toBeInstanceOf(Date);
      expect(user.updatedAt).toBeInstanceOf(Date);
    });
  });

  describe('CRUD Operations', () => {
    it('getAllUsers tüm kullanıcıları getirmeli', async () => {
      const userService = UserService.getInstance();
      const mockSnapshot = {
        docs: [
          { id: '123', data: () => mockUserData },
          { id: '456', data: () => ({ ...mockUserData, email: 'test2@example.com' }) }
        ]
      };

      (collection as jest.Mock).mockReturnValue('users');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const users = await userService.getAllUsers();
      expect(users).toHaveLength(2);
      expect(users[0]).toBeInstanceOf(User);
      expect(users[0].email).toBe('test@example.com');
    });

    it('getUserById kullanıcıyı getirmeli', async () => {
      const userService = UserService.getInstance();
      const mockDoc = {
        exists: () => true,
        data: () => mockUserData
      };

      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const user = await userService.getUserById('123');
      expect(user).toBeInstanceOf(User);
      expect(user?.email).toBe('test@example.com');
    });

    it('createUser yeni kullanıcı oluşturmalı', async () => {
      const userService = UserService.getInstance();
      const newUserData = {
        email: 'new@example.com',
        displayName: 'New User',
        role: 'student'
      };

      (doc as jest.Mock).mockReturnValue('user-doc');
      (setDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await userService.createUser('123', newUserData);
      expect(user).toBeInstanceOf(User);
      expect(user.email).toBe('new@example.com');
      expect(setDoc).toHaveBeenCalled();
    });

    it('updateUser kullanıcıyı güncellemeli', async () => {
      const userService = UserService.getInstance();
      const updatedData = {
        displayName: 'Updated User'
      };

      const mockDoc = {
        exists: () => true,
        data: () => mockUserData
      };

      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue(mockDoc);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await userService.updateUser('123', updatedData);
      expect(user).toBeInstanceOf(User);
      expect(user.displayName).toBe('Updated User');
      expect(updateDoc).toHaveBeenCalled();
    });

    it('deleteUser kullanıcıyı silmeli', async () => {
      const userService = UserService.getInstance();

      (doc as jest.Mock).mockReturnValue('user-doc');
      (deleteDoc as jest.Mock).mockResolvedValue(undefined);

      await userService.deleteUser('123');
      expect(deleteDoc).toHaveBeenCalled();
    });
  });

  describe('Role-based Operations', () => {
    it('getUsersByRole belirli role sahip kullanıcıları getirmeli', async () => {
      const userService = UserService.getInstance();
      const mockSnapshot = {
        docs: [
          { id: '123', data: () => mockUserData },
          { id: '456', data: () => ({ ...mockUserData, email: 'test2@example.com' }) }
        ]
      };

      (collection as jest.Mock).mockReturnValue('users');
      (query as jest.Mock).mockReturnValue('query');
      (where as jest.Mock).mockReturnValue('where');
      (getDocs as jest.Mock).mockResolvedValue(mockSnapshot);

      const users = await userService.getUsersByRole('student');
      expect(users).toHaveLength(2);
      expect(users[0].role).toBe('student');
    });

    it('updateUserRole kullanıcı rolünü güncellemeli', async () => {
      const userService = UserService.getInstance();
      const mockDoc = {
        exists: () => true,
        data: () => mockUserData
      };

      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue(mockDoc);
      (updateDoc as jest.Mock).mockResolvedValue(undefined);

      const user = await userService.updateUserRole('123', 'teacher');
      expect(user).toBeInstanceOf(User);
      expect(user.role).toBe('teacher');
      expect(updateDoc).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('getUserById kullanıcı bulunamadığında null dönmeli', async () => {
      const userService = UserService.getInstance();
      const mockDoc = {
        exists: () => false
      };

      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      const user = await userService.getUserById('123');
      expect(user).toBeNull();
    });

    it('updateUser kullanıcı bulunamadığında hata fırlatmalı', async () => {
      const userService = UserService.getInstance();
      const mockDoc = {
        exists: () => false
      };

      (doc as jest.Mock).mockReturnValue('user-doc');
      (getDoc as jest.Mock).mockResolvedValue(mockDoc);

      await expect(userService.updateUser('123', { displayName: 'Updated' }))
        .rejects
        .toThrow('Kullanıcı bulunamadı');
    });

    it('Firestore hatası durumunda hata fırlatmalı', async () => {
      const userService = UserService.getInstance();

      (collection as jest.Mock).mockReturnValue('users');
      (getDocs as jest.Mock).mockRejectedValue(new Error('Firestore hatası'));

      await expect(userService.getAllUsers())
        .rejects
        .toThrow('Firestore hatası');
    });
  });
}); 