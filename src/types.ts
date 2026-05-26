export interface UserProfile {
  uid: string;
  email: string;
  displayName?: string | null;
  createdAt: string;
  role: 'Admin' | 'User';
}

export interface FileItem {
  id: string;
  name: string;
  size: number;
  type: string;
  data: string; // Base64 encoding of contents
  uploadedAt: string; // ISO String or Firestore Server Timestamp string representation
}

export interface AppState {
  user: UserProfile | null;
  files: FileItem[];
  isLoading: boolean;
  error: string | null;
}
