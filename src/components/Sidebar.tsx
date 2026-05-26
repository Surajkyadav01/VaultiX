import React from 'react';
import { Shield, LogOut, HardDrive, File, Database, Sparkles, User, HelpCircle } from 'lucide-react';
import { UserProfile, FileItem } from '../types';
import { isRealFirebase } from '../firebase';

interface SidebarProps {
  user: UserProfile;
  files: FileItem[];
  onSignOut: () => void;
  activeTab: 'workspace' | 'settings' | 'info';
  setActiveTab: (tab: 'workspace' | 'settings' | 'info') => void;
}

export function formatBytes(bytes: number, decimals = 2) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}

export default function Sidebar({ user, files, onSignOut, activeTab, setActiveTab }: SidebarProps) {
  // Aggregate file spaces (Firestore single doc limit is ~1MB, soft cap 20MB limit in the visual UI indicators)
  const totalBytes = files.reduce((acc, file) => acc + file.size, 0);
  const MAX_CAPACITY_BYTES = 20 * 1024 * 1024; // Visual soft cap of 20MB for Sandbox demo limit
  const percentUsed = Math.min(100, Math.round((totalBytes / MAX_CAPACITY_BYTES) * 100));

  return (
    <aside className="w-72 bg-slate-900 border-r border-slate-850 flex flex-col justify-between text-slate-100 flex-shrink-0" id="app-sidebar">
      {/* Upper Area */}
      <div className="flex flex-col flex-1 overflow-y-auto min-h-0">
        {/* Header Branding */}
        <div className="p-6 border-b border-slate-800/80 flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/10 hover:rotate-6 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-white block">VaultiX</span>
            <span className="text-[10px] text-indigo-400 font-medium uppercase font-mono tracking-wider">Client File Portal</span>
          </div>
        </div>

        {/* Logged in User profile plate */}
        <div className="p-4 mx-4 my-6 bg-slate-800/50 rounded-2xl border border-indigo-500/10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-indigo-500/20 border border-indigo-400/20 flex items-center justify-center font-semibold text-indigo-300">
            {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
          </div>
          <div className="overflow-hidden flex-1">
            <h4 className="text-sm font-semibold truncate text-white">
              {user.displayName || 'Freelancer'}
            </h4>
            <div className="flex items-center gap-1.5 mt-1">
              <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                user.role === 'Admin' 
                  ? 'bg-rose-500/25 text-rose-300 border border-rose-500/30' 
                  : 'bg-indigo-500/25 text-indigo-300 border border-indigo-500/30'
              }`}>
                {user.role || 'User'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 block truncate mt-1">{user.email}</span>
          </div>
        </div>

        {/* Tab Navigation Menu */}
        <nav className="px-3 space-y-1.5 flex-1">
          <button
            onClick={() => setActiveTab('workspace')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
              activeTab === 'workspace'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/15'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HardDrive className={`w-4 h-4 ${activeTab === 'workspace' ? 'text-white' : 'text-slate-400'}`} />
            <span>Files Workspace</span>
          </button>

          <button
            onClick={() => setActiveTab('info')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all text-left cursor-pointer ${
              activeTab === 'info'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-500/15'
                : 'text-slate-300 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <HelpCircle className={`w-4 h-4 ${activeTab === 'info' ? 'text-white' : 'text-slate-400'}`} />
            <span>Portal Guidelines</span>
          </button>
        </nav>

        {/* Space Utilization Gauge */}
        <div className="p-5 border-t border-slate-800/80 mx-2">
          <div className="bg-slate-800/40 border border-slate-800 rounded-2xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-xs text-slate-400 font-medium">Space Used</span>
              <span className="text-xs font-mono font-medium text-indigo-300">
                {formatBytes(totalBytes)}
              </span>
            </div>
            
            {/* Progress Bar Container */}
            <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden mb-3">
              <div 
                className="h-full bg-indigo-500 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${percentUsed}%` }}
              />
            </div>

            {/* Storage details */}
            <div className="flex items-center justify-between text-[11px] text-slate-400">
              <span>{files.length} {files.length === 1 ? 'file' : 'files'} securely uploaded</span>
              <span>Soft cap 20MB</span>
            </div>
          </div>
        </div>
      </div>

      {/* Database/Auth Synced indicator + Sign out */}
      <div className="p-4 border-t border-slate-800/80">
        {/* Service status */}
        <div className="px-3 py-2.5 mb-3 bg-slate-950 rounded-xl flex items-center gap-2.5 border border-slate-800">
          <div className={`w-2 h-2 rounded-full ${isRealFirebase ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
          <span className="text-[11px] text-slate-400 truncate">
            {isRealFirebase ? 'Synced to Live Firebase' : 'Secure Sandboxed Mode'}
          </span>
        </div>

        {/* Sign Out Trigger */}
        <button
          onClick={onSignOut}
          className="w-full flex items-center justify-center gap-2.5 px-4 py-2.5 hover:bg-rose-950/20 hover:text-rose-400 border border-slate-800 hover:border-rose-900/40 rounded-xl text-slate-300 text-sm font-medium transition-all duration-200 cursor-pointer"
          id="btn-sign-out"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </aside>
  );
}
