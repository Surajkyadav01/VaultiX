import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut as firebaseSignOut, 
  onAuthStateChanged,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { 
  setDoc, 
  doc, 
  collection, 
  onSnapshot, 
  deleteDoc, 
  query, 
  orderBy,
  getDocs,
  getDoc,
  limit
} from 'firebase/firestore';
import { auth, db, isRealFirebase, handleFirestoreError, OperationType } from '../firebase';
import { UserProfile, FileItem } from '../types';

// Helper to convert browser File to base64 string
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

// Global local storage mock state namespaces
const MOCK_USERS_KEY = 'vaultix_mock_users';
const MOCK_FILES_KEY = 'vaultix_mock_files_prefix_';
const MOCK_SESSION_KEY = 'vaultix_mock_session';

// --- Local Storage fallback simulation helpers ---
function getMockUsers(): any[] {
  try {
    const usersJson = localStorage.getItem(MOCK_USERS_KEY);
    return usersJson ? JSON.parse(usersJson) : [];
  } catch {
    return [];
  }
}

function saveMockUsers(users: any[]) {
  localStorage.setItem(MOCK_USERS_KEY, JSON.stringify(users));
}

function getMockFiles(userId: string): FileItem[] {
  try {
    const filesJson = localStorage.getItem(MOCK_FILES_KEY + userId);
    return filesJson ? JSON.parse(filesJson) : [];
  } catch {
    return [];
  }
}

function saveMockFiles(userId: string, files: FileItem[]) {
  localStorage.setItem(MOCK_FILES_KEY + userId, JSON.stringify(files));
}

// --- End of Mock Helpers ---

export const storageService = {
  /**
   * Register a new user with Email and Password
   */
  async signUp(email: string, password: string, displayName: string): Promise<UserProfile> {
    if (isRealFirebase) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;
        
        // Update display name
        await updateProfile(fbUser, { displayName });

        // Query Firestore to see if this is the very first registered user
        let isFirstUser = false;
        try {
          const usersCol = collection(db, 'users');
          const q = query(usersCol, limit(1));
          const usersSnapshot = await getDocs(q);
          isFirstUser = usersSnapshot.empty;
        } catch (error) {
          console.warn("VaultiX: Could not verify if users collection is empty. Defaulting to Admin role.", error);
          isFirstUser = true;
        }

        const role: 'Admin' | 'User' = isFirstUser ? 'Admin' : 'User';

        const userProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || email,
          displayName: displayName,
          createdAt: new Date().toISOString(),
          role: role
        };

        // Save user profile metadata to Firestore
        const userPath = `users/${fbUser.uid}`;
        try {
          await setDoc(doc(db, 'users', fbUser.uid), userProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, userPath);
        }

        return userProfile;
      } catch (error: any) {
        throw new Error(error?.message || "Registration failed");
      }
    } else {
      // Offline/Local mock registration
      const users = getMockUsers();
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error("An account with this email already exists.");
      }

      const isFirstMockUser = users.length === 0;
      const role: 'Admin' | 'User' = isFirstMockUser ? 'Admin' : 'User';

      const mockUser = {
        uid: 'mock_uid_' + Math.random().toString(36).substr(2, 9),
        email,
        password, // stored locally for simple mock validations
        displayName,
        createdAt: new Date().toISOString(),
        role: role
      };

      users.push(mockUser);
      saveMockUsers(users);

      const profile: UserProfile = {
        uid: mockUser.uid,
        email: mockUser.email,
        displayName: mockUser.displayName,
        createdAt: mockUser.createdAt,
        role: mockUser.role as 'Admin' | 'User'
      };

      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(profile));
      return profile;
    }
  },

  /**
   * Log In an existing user with Email and Password
   */
  async signIn(email: string, password: string): Promise<UserProfile> {
    if (isRealFirebase) {
      try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const fbUser = userCredential.user;

        const profile = await storageService.getUserProfile(fbUser.uid, fbUser.email || email, fbUser.displayName);
        return profile;
      } catch (error: any) {
        throw new Error(error?.message || "Invalid credentials.");
      }
    } else {
      // Offline mock authentication
      const users = getMockUsers();
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase() && u.password === password);
      
      if (!user) {
        throw new Error("Invalid email or password. Please verify and try again.");
      }

      const profile: UserProfile = {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        createdAt: user.createdAt,
        role: (user.role || 'User') as 'Admin' | 'User'
      };

      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(profile));
      return profile;
    }
  },

  /**
   * Log in or Register via Google Sign-In
   */
  async signInWithGoogle(): Promise<UserProfile> {
    if (isRealFirebase) {
      try {
        const provider = new GoogleAuthProvider();
        const userCredential = await signInWithPopup(auth, provider);
        const fbUser = userCredential.user;

        // Check if user profile already exists in Firestore
        const docRef = doc(db, 'users', fbUser.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            uid: data.uid,
            email: data.email,
            displayName: data.displayName || null,
            createdAt: data.createdAt,
            role: (data.role || 'User') as 'Admin' | 'User'
          };
        }

        // It doesn't exist, we must create a new profile.
        // Query Firestore to see if this is the very first registered user
        let isFirstUser = false;
        try {
          const usersCol = collection(db, 'users');
          const q = query(usersCol, limit(1));
          const usersSnapshot = await getDocs(q);
          isFirstUser = usersSnapshot.empty;
        } catch (error) {
          console.warn("VaultiX: Could not verify if users collection is empty. Defaulting to Admin role.", error);
          isFirstUser = true;
        }

        const role: 'Admin' | 'User' = isFirstUser ? 'Admin' : 'User';

        const userProfile: UserProfile = {
          uid: fbUser.uid,
          email: fbUser.email || '',
          displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
          role: role
        };

        const userPath = `users/${fbUser.uid}`;
        try {
          await setDoc(doc(db, 'users', fbUser.uid), userProfile);
        } catch (error) {
          handleFirestoreError(error, OperationType.WRITE, userPath);
        }

        return userProfile;
      } catch (error: any) {
        throw new Error(error?.message || "Google Authentication failed");
      }
    } else {
      // Offline mock Google sign-in
      const mockEmail = "ksurajyadav93@gmail.com";
      const mockName = "Suraj Yadav";
      const users = getMockUsers();
      
      let existingMockUser = users.find(u => u.email.toLowerCase() === mockEmail.toLowerCase());
      
      if (!existingMockUser) {
        const isFirstMockUser = users.length === 0;
        const role: 'Admin' | 'User' = isFirstMockUser ? 'Admin' : 'User';

        existingMockUser = {
          uid: 'mock_google_uid_' + Math.random().toString(36).substr(2, 9),
          email: mockEmail,
          displayName: mockName,
          createdAt: new Date().toISOString(),
          role: role
        };
        users.push(existingMockUser);
        saveMockUsers(users);
      }

      const profile: UserProfile = {
        uid: existingMockUser.uid,
        email: existingMockUser.email,
        displayName: existingMockUser.displayName,
        createdAt: existingMockUser.createdAt,
        role: existingMockUser.role as 'Admin' | 'User'
      };

      localStorage.setItem(MOCK_SESSION_KEY, JSON.stringify(profile));
      return profile;
    }
  },

  /**
   * Log out active user
   */
  async signOutUser(): Promise<void> {
    if (isRealFirebase) {
      await firebaseSignOut(auth);
    } else {
      localStorage.removeItem(MOCK_SESSION_KEY);
    }
  },

  /**
   * Get specific profile details
   */
  async getUserProfile(uid: string, fallbackEmail: string, fallbackDisplayName?: string | null): Promise<UserProfile> {
    if (isRealFirebase) {
      try {
        const docRef = doc(db, 'users', uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          return {
            uid: data.uid,
            email: data.email,
            displayName: data.displayName || null,
            createdAt: data.createdAt,
            role: (data.role || 'User') as 'Admin' | 'User'
          };
        }
      } catch (e) {
        console.warn("VaultiX: Error retrieving profile doc from Firestore:", e);
      }
      return {
        uid,
        email: fallbackEmail,
        displayName: fallbackDisplayName || fallbackEmail.split('@')[0],
        createdAt: new Date().toISOString(),
        role: 'User'
      };
    } else {
      const users = getMockUsers();
      const user = users.find(u => u.uid === uid);
      if (user) {
        return {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          createdAt: user.createdAt,
          role: (user.role || 'User') as 'Admin' | 'User'
        };
      }
      return {
        uid,
        email: fallbackEmail,
        displayName: fallbackDisplayName || fallbackEmail.split('@')[0],
        createdAt: new Date().toISOString(),
        role: 'User'
      };
    }
  },

  /**
   * Listen to Authentication state changes
   */
  subscribeAuth(callback: (user: UserProfile | null) => void): () => void {
    if (isRealFirebase) {
      return onAuthStateChanged(auth, async (fbUser) => {
        if (fbUser) {
          try {
            const profile = await storageService.getUserProfile(fbUser.uid, fbUser.email || '', fbUser.displayName);
            callback(profile);
          } catch (e) {
            console.error("VaultiX: Error retrieving sub auth details:", e);
            callback({
              uid: fbUser.uid,
              email: fbUser.email || '',
              displayName: fbUser.displayName || fbUser.email?.split('@')[0] || 'User',
              createdAt: new Date().toISOString(),
              role: 'User'
            });
          }
        } else {
          callback(null);
        }
      });
    } else {
      // Mock triggers
      const sessionJson = localStorage.getItem(MOCK_SESSION_KEY);
      const activeUser = sessionJson ? JSON.parse(sessionJson) : null;
      callback(activeUser);

      // Periodically check session changes
      const interval = setInterval(() => {
        const updatedSession = localStorage.getItem(MOCK_SESSION_KEY);
        const updatedUser = updatedSession ? JSON.parse(updatedSession) : null;
        if (JSON.stringify(updatedUser) !== JSON.stringify(activeUser)) {
          callback(updatedUser);
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  },

  /**
   * Upload and save a client file
   */
  async uploadFile(file: File, userId: string): Promise<FileItem> {
    const base64Data = await fileToBase64(file);
    const fileId = 'file_' + Math.random().toString(36).substr(2, 9);
    
    const fileItem: FileItem = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type || 'application/octet-stream',
      data: base64Data,
      uploadedAt: new Date().toISOString()
    };

    if (isRealFirebase && !userId.startsWith('mock_')) {
      const fileRoute = `users/${userId}/files/${fileId}`;
      try {
        await setDoc(doc(db, 'users', userId, 'files', fileId), fileItem);
        return fileItem;
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, fileRoute);
      }
    } else {
      const currentFiles = getMockFiles(userId);
      currentFiles.unshift(fileItem);
      saveMockFiles(userId, currentFiles);
    }

    return fileItem;
  },

  /**
   * Delete an uploaded file
   */
  async deleteFile(userId: string, fileId: string): Promise<void> {
    if (isRealFirebase && !userId.startsWith('mock_')) {
      const fileRoute = `users/${userId}/files/${fileId}`;
      try {
        await deleteDoc(doc(db, 'users', userId, 'files', fileId));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, fileRoute);
      }
    } else {
      const files = getMockFiles(userId);
      const updated = files.filter(f => f.id !== fileId);
      saveMockFiles(userId, updated);
    }
  },

  /**
   * Listen to live file collection lists
   */
  subscribeFiles(userId: string, callback: (files: FileItem[]) => void): () => void {
    if (isRealFirebase && !userId.startsWith('mock_')) {
      const filesColRef = collection(db, 'users', userId, 'files');
      // Sub collection listener
      return onSnapshot(filesColRef, (snapshot) => {
        const fileList: FileItem[] = [];
        snapshot.forEach((documentDoc) => {
          const item = documentDoc.data() as FileItem;
          fileList.push(item);
        });
        
        // Sort files locally by date descending
        fileList.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
        callback(fileList);
      }, (error) => {
        handleFirestoreError(error, OperationType.LIST, `users/${userId}/files`);
      });
    } else {
      // Mock local storage polling
      const firstFiles = getMockFiles(userId);
      callback(firstFiles);

      const interval = setInterval(() => {
        const currentFiles = getMockFiles(userId);
        callback(currentFiles);
      }, 1500);

      return () => clearInterval(interval);
    }
  }
};
