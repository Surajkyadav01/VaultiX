import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, Sparkles, Database, ChevronRight, UserCheck } from 'lucide-react';
import { UserProfile, FileItem } from './types';
import { storageService } from './services/storageService';
import { isRealFirebase } from './firebase';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import UploadArea from './components/UploadArea';
import FileList from './components/FileList';
import PortalGuidelines from './components/PortalGuidelines';

export default function App() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [files, setFiles] = useState<FileItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'workspace' | 'settings' | 'info'>('workspace');

  // 1. Subscribe to User Authentication State Change
  useEffect(() => {
    const unsubscribe = storageService.subscribeAuth((activeUser) => {
      setUser(activeUser);
      setIsLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Subscribe to Real-time or Local Files State Change when logged in
  useEffect(() => {
    if (!user) {
      setFiles([]);
      return;
    }

    const unsubscribe = storageService.subscribeFiles(user.uid, (syncedFiles) => {
      setFiles(syncedFiles);
    });

    return () => unsubscribe();
  }, [user]);

  // Handle individual uploads and push records
  const handleUpload = async (file: File) => {
    if (!user) throw new Error("Access denied: missing active authorized credentials.");
    await storageService.uploadFile(file, user.uid);
  };

  // Handle individual deletions
  const handleDeleteFile = async (fileId: string) => {
    if (!user) return;
    await storageService.deleteFile(user.uid, fileId);
  };

  // Handle global Sign-Out parameters
  const handleSignOut = async () => {
    setIsLoading(true);
    try {
      await storageService.signOutUser();
      setUser(null);
      setActiveTab('workspace');
    } catch (e) {
      console.error("Logout caught an exception:", e);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 border-3 border-indigo-650/20 border-t-indigo-600 rounded-full animate-spin mb-4" />
        <p className="text-xs text-slate-500 font-medium font-sans animate-pulse">Verifying client session credentials...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthPage onAuthSuccess={(profile) => setUser(profile)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex overflow-hidden" id="app-viewport">
      {/* Sidebar navigation */}
      <Sidebar 
        user={user} 
        files={files} 
        onSignOut={handleSignOut} 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
      />

      {/* Main workspace container panel */}
      <main className="flex-1 flex flex-col overflow-y-auto" id="app-main-panel">
        {/* Upper Toolbar / Welcome Breadcrumbs */}
        <header className="bg-white border-b border-slate-200 py-5 px-8 flex justify-between items-center flex-shrink-0" id="app-toolbar">
          <div className="flex items-center gap-2.5 text-xs text-slate-450 font-medium">
            <span>Portal</span>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300" />
            <span className="text-slate-800 capitalize font-semibold">{activeTab}</span>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs font-medium text-slate-500 bg-slate-50 px-3 py-1 rounded-full flex items-center gap-1.5 border border-slate-200">
              <UserCheck className="w-3.5 h-3.5 text-indigo-500" />
              <span>Session: <strong className="text-slate-700 font-semibold">{user.displayName || user.email.split('@')[0]}</strong></span>
            </span>
          </div>
        </header>

        {/* Dynamic Main Body Content */}
        <div className="flex-1 p-8 max-w-7xl w-full mx-auto space-y-8">
          {/* Friendly Greetings Segment */}
          <div>
            <span className="text-xs font-semibold text-indigo-650 uppercase tracking-widest font-sans">WORKSPACE DASHBOARD</span>
            <h1 className="text-2xl sm:text-3xl font-semibold text-slate-900 tracking-tight mt-1 font-sans">
              Welcome, {user.displayName || 'Freelancer'}!
            </h1>
            <p className="text-sm text-slate-500 mt-1.5 max-w-2xl leading-relaxed">
              Accept client submissions, distribute design deliverables, and manage assets inside your secure VaultiX terminal.
            </p>
          </div>

          {/* Sandbox Indicator Banner (displays purely as guidance, highly friendly!) */}
          {!isRealFirebase && (
            <motion.div 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-amber-50 border border-amber-200/60 rounded-2xl flex items-start sm:items-center gap-3.5 text-xs text-amber-800 font-sans shadow-xs"
              id="sandbox-indicator-alert"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-400/20 flex items-center justify-center flex-shrink-0">
                <Database className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1">
                <p className="font-semibold block mb-0.5 text-amber-900">VaultiX Sandbox Storage is Active</p>
                <p className="leading-relaxed">
                  Your files are stored securely inside your browser's persistent sandbox. Accepting Firestore permissions will automatically upgrade your portal to a live real-time cloud workspace.
                </p>
              </div>
            </motion.div>
          )}

          {/* Dynamic tabs switcher */}
          <div className="relative">
            <AnimatePresence mode="wait">
              {activeTab === 'workspace' && (
                <motion.div
                  key="workspace"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-8"
                >
                  {/* File Dropper Zone */}
                  <UploadArea onUpload={handleUpload} />

                  {/* Active catalog listing table */}
                  <FileList files={files} onDeleteFile={handleDeleteFile} />
                </motion.div>
              )}

              {activeTab === 'info' && (
                <motion.div
                  key="guidelines"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <PortalGuidelines />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Humanized Literal Footer */}
        <footer className="mt-auto py-6 px-8 border-t border-slate-200/80 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-slate-400 bg-white" id="workspace-footer">
          <span>&copy; {new Date().getFullYear()} VaultiX. Confidential Secure Storage Client Node.</span>
          <div className="flex items-center gap-4">
            <span>Mime Type Filter: Enabled</span>
            <span>Document Integrity Guard: Locked</span>
          </div>
        </footer>
      </main>
    </div>
  );
}
