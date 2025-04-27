import { auth, db } from '@/lib/firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { User } from 'firebase/auth';
import { RBACService, UserRole, Permission, RoleBasedAccess, PagePermissions } from '../rbac';

// Mock Firebase auth ve firestore
jest.mock('@/lib/firebase/config', () => ({
  auth: {
    currentUser: null,
  },
  db: {},
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(() => ({ id: 'mock-doc' })),
  getDoc: jest.fn(),
}));

describe('RBAC Service', () => {
  const mockUser = {
    uid: '123',
    email: 'test@example.com',
  } as User;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Singleton Pattern', () => {
    it('aynı instance\'ı döndürmeli', () => {
      const instance1 = RBACService.getInstance();
      const instance2 = RBACService.getInstance();
      expect(instance1).toBe(instance2);
    });
  });

  describe('getUserRole', () => {
    it('kullanıcı null ise GUEST rolü döndürmeli', async () => {
      const rbac = RBACService.getInstance();
      const role = await rbac.getUserRole(null);
      expect(role).toBe(UserRole.GUEST);
    });

    it('Firestore\'dan rol alındığında doğru rolü döndürmeli', async () => {
      const rbac = RBACService.getInstance();
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: UserRole.ADMIN }),
      });

      const role = await rbac.getUserRole(mockUser);
      expect(role).toBe(UserRole.ADMIN);
    });

    it('Firestore\'da rol yoksa STUDENT rolü döndürmeli', async () => {
      const rbac = RBACService.getInstance();
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({}),
      });

      const role = await rbac.getUserRole(mockUser);
      expect(role).toBe(UserRole.STUDENT);
    });

    it('hata durumunda GUEST rolü döndürmeli', async () => {
      const rbac = RBACService.getInstance();
      (getDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore hatası'));

      const role = await rbac.getUserRole(mockUser);
      expect(role).toBe(UserRole.GUEST);
    });
  });

  describe('hasPermission', () => {
    it('ADMIN rolü tüm izinlere sahip olmalı', async () => {
      const rbac = RBACService.getInstance();
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: UserRole.ADMIN }),
      });

      const hasPermission = await rbac.hasPermission(mockUser, Permission.MANAGE_USERS);
      expect(hasPermission).toBe(true);
    });

    it('STUDENT rolü sadece READ iznine sahip olmalı', async () => {
      const rbac = RBACService.getInstance();
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: UserRole.STUDENT }),
      });

      const hasReadPermission = await rbac.hasPermission(mockUser, Permission.READ);
      const hasWritePermission = await rbac.hasPermission(mockUser, Permission.WRITE);

      expect(hasReadPermission).toBe(true);
      expect(hasWritePermission).toBe(false);
    });

    it('TEACHER rolü için doğru izinleri kontrol etmeli', async () => {
      const rbac = RBACService.getInstance();
      
      // Her izin kontrolü için ayrı mock
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ role: UserRole.TEACHER }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ role: UserRole.TEACHER }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ role: UserRole.TEACHER }),
        });

      const hasReadPermission = await rbac.hasPermission(mockUser, Permission.READ);
      const hasWritePermission = await rbac.hasPermission(mockUser, Permission.WRITE);
      const hasManagePermission = await rbac.hasPermission(mockUser, Permission.MANAGE_USERS);

      expect(hasReadPermission).toBe(true);
      expect(hasWritePermission).toBe(true);
      expect(hasManagePermission).toBe(false);
    });

    it('geçersiz izin kontrolü yapmalı', async () => {
      const rbac = RBACService.getInstance();
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: UserRole.ADMIN }),
      });

      const hasInvalidPermission = await rbac.hasPermission(mockUser, 'INVALID_PERMISSION' as Permission);
      expect(hasInvalidPermission).toBe(false);
    });

    it('birden fazla izin kontrolü yapmalı', async () => {
      const rbac = RBACService.getInstance();
      
      // Her izin kontrolü için ayrı mock
      (getDoc as jest.Mock)
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ role: UserRole.ADMIN }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ role: UserRole.ADMIN }),
        })
        .mockResolvedValueOnce({
          exists: () => true,
          data: () => ({ role: UserRole.ADMIN }),
        });

      const hasMultiplePermissions = await Promise.all([
        rbac.hasPermission(mockUser, Permission.READ),
        rbac.hasPermission(mockUser, Permission.WRITE),
        rbac.hasPermission(mockUser, Permission.MANAGE_USERS)
      ]);

      expect(hasMultiplePermissions).toEqual([true, true, true]);
    });
  });

  describe('getPermissionsForRole', () => {
    it('her rol için doğru izinleri döndürmeli', () => {
      const rbac = RBACService.getInstance();

      const adminPermissions = rbac.getPermissionsForRole(UserRole.ADMIN);
      const studentPermissions = rbac.getPermissionsForRole(UserRole.STUDENT);

      expect(adminPermissions).toContain(Permission.MANAGE_USERS);
      expect(studentPermissions).toEqual([Permission.READ]);
    });
  });

  describe('getAllRoles', () => {
    it('tüm rolleri döndürmeli', () => {
      const rbac = RBACService.getInstance();
      const roles = rbac.getAllRoles();

      expect(roles).toContain(UserRole.ADMIN);
      expect(roles).toContain(UserRole.STUDENT);
      expect(roles).toContain(UserRole.GUEST);
    });
  });

  describe('getRoleDisplayName', () => {
    it('her rol için doğru görüntüleme adını döndürmeli', () => {
      const rbac = RBACService.getInstance();

      expect(rbac.getRoleDisplayName(UserRole.ADMIN)).toBe('Admin');
      expect(rbac.getRoleDisplayName(UserRole.TEACHER)).toBe('Öğretmen');
      expect(rbac.getRoleDisplayName(UserRole.STUDENT)).toBe('Öğrenci');
      expect(rbac.getRoleDisplayName('unknown')).toBe('unknown');
    });
  });
});

describe('RoleBasedAccess', () => {
  describe('hasPageAccess', () => {
    it('tanımlı olmayan sayfalara herkes erişebilmeli', () => {
      expect(RoleBasedAccess.hasPageAccess('/unknown-page', UserRole.GUEST)).toBe(true);
    });

    it('admin tüm sayfalara erişebilmeli', () => {
      expect(RoleBasedAccess.hasPageAccess('/dashboard', UserRole.ADMIN)).toBe(true);
      expect(RoleBasedAccess.hasPageAccess('/teacher-panel', UserRole.ADMIN)).toBe(true);
      expect(RoleBasedAccess.hasPageAccess('/student-panel', UserRole.ADMIN)).toBe(true);
    });

    it('öğrenci sadece kendi paneline erişebilmeli', () => {
      expect(RoleBasedAccess.hasPageAccess('/student-panel', UserRole.STUDENT)).toBe(true);
      expect(RoleBasedAccess.hasPageAccess('/teacher-panel', UserRole.STUDENT)).toBe(false);
    });

    it('öğretmen öğrenci paneline erişebilmeli', () => {
      expect(RoleBasedAccess.hasPageAccess('/student-panel', UserRole.TEACHER)).toBe(true);
    });
  });

  describe('normalizePath', () => {
    it('sonundaki / işaretini kaldırmalı', () => {
      expect(RoleBasedAccess.hasPageAccess('/student-panel/', UserRole.STUDENT)).toBe(true);
    });

    it('boş path kontrolü yapmalı', () => {
      expect(RoleBasedAccess.hasPageAccess('', UserRole.STUDENT)).toBe(true);
    });

    it('çoklu slash kontrolü yapmalı', () => {
      expect(RoleBasedAccess.hasPageAccess('//student-panel//', UserRole.STUDENT)).toBe(true);
    });

    it('query parametreleri ile path kontrolü yapmalı', () => {
      expect(RoleBasedAccess.hasPageAccess('/student-panel?page=1', UserRole.STUDENT)).toBe(true);
    });
  });

  describe('getUserRole', () => {
    it('kullanıcı null ise GUEST rolü döndürmeli', async () => {
      const role = await RoleBasedAccess.getUserRole(null);
      expect(role).toBe(UserRole.GUEST);
    });

    it('Firestore\'dan rol alındığında doğru rolü döndürmeli', async () => {
      const mockUser = { uid: '123' } as User;
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: UserRole.ADMIN }),
      });

      const role = await RoleBasedAccess.getUserRole(mockUser);
      expect(role).toBe(UserRole.ADMIN);
    });

    it('Firestore\'dan veri alınamadığında varsayılan rol döndürmeli', async () => {
      const rbac = RBACService.getInstance();
      const mockUser = { uid: '123' } as User;
      
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => false,
        data: () => null,
      });

      const role = await rbac.getUserRole(mockUser);
      expect(role).toBe(UserRole.STUDENT);
    });

    it('geçersiz rol değeri kontrolü yapmalı', async () => {
      const rbac = RBACService.getInstance();
      const mockUser = { uid: '123' } as User;
      
      (getDoc as jest.Mock).mockResolvedValueOnce({
        exists: () => true,
        data: () => ({ role: 'INVALID_ROLE' }),
      });

      const role = await rbac.getUserRole(mockUser);
      expect(role).toBe(UserRole.STUDENT);
    });
  });
}); 