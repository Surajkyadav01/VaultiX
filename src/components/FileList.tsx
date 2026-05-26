import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FileText, Image, FileVideo, Music, Archive, FileCode, Check,
  File, Search, DownloadCloud, Trash2, Calendar, HardDrive, Inbox, Eye
} from 'lucide-react';
import { FileItem } from '../types';
import { formatBytes } from './Sidebar';

interface FileListProps {
  files: FileItem[];
  onDeleteFile: (fileId: string) => Promise<void>;
}

// Map Mimetyes to visually rich, distinct Icons and colors
function getMimeMeta(mimetype: string) {
  const type = mimetype.toLowerCase();
  if (type.includes('pdf')) {
    return { icon: FileText, color: 'text-rose-500 bg-rose-50 border-rose-100', label: 'PDF Document' };
  }
  if (type.includes('image') || type.includes('png') || type.includes('jpg') || type.includes('jpeg') || type.includes('svg')) {
    return { icon: Image, color: 'text-emerald-500 bg-emerald-50 border-emerald-100', label: 'Image Asset' };
  }
  if (type.includes('video') || type.includes('mp4') || type.includes('mov')) {
    return { icon: FileVideo, color: 'text-indigo-500 bg-indigo-50 border-indigo-100', label: 'Video File' };
  }
  if (type.includes('audio') || type.includes('mp3') || type.includes('wav')) {
    return { icon: Music, color: 'text-purple-500 bg-purple-50 border-purple-100', label: 'Audio Loop' };
  }
  if (type.includes('zip') || type.includes('tar') || type.includes('rar') || type.includes('7z') || type.includes('compress')) {
    return { icon: Archive, color: 'text-amber-500 bg-amber-50 border-amber-100', label: 'Archive Zip' };
  }
  if (type.includes('javascript') || type.includes('typescript') || type.includes('json') || type.includes('html') || type.includes('css')) {
    return { icon: FileCode, color: 'text-sky-500 bg-sky-50 border-sky-100', label: 'Code Node' };
  }
  return { icon: File, color: 'text-slate-500 bg-slate-50 border-slate-100', label: 'Attachment' };
}

export default function FileList({ files, onDeleteFile }: FileListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter files based on search
  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    getMimeMeta(file.type).label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatUploadDate = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return dateStr;
    }
  };

  const handleView = (fileItem: FileItem) => {
    try {
      const parts = fileItem.data.split(',');
      if (parts.length < 2) throw new Error("Invalid base64 document format.");
      const mime = parts[0].match(/:(.*?);/)?.[1] || 'application/octet-stream';
      const bstr = atob(parts[1]);
      let n = bstr.length;
      const u8arr = new Uint8Array(n);
      while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
      }
      const blob = new Blob([u8arr], { type: mime });
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, '_blank');
    } catch (e) {
      console.error("Failed to compile client preview trigger:", e);
      // Fallback base64 display
      const w = window.open();
      if (w) {
        w.document.write(`<iframe src="${fileItem.data}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
        w.document.close();
      }
    }
  };

  const handleDownload = (fileItem: FileItem) => {
    try {
      const downloadLink = document.createElement('a');
      downloadLink.href = fileItem.data;
      downloadLink.download = fileItem.name;
      document.body.appendChild(downloadLink);
      downloadLink.click();
      document.body.removeChild(downloadLink);
    } catch (e) {
      console.error("Failed to compile client download trigger", e);
    }
  };

  const handleDeleteTrigger = async (fileId: string) => {
    setDeletingId(fileId);
    try {
      await onDeleteFile(fileId);
    } catch (error) {
      console.error("Deletion error:", error);
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden flex flex-col shadow-xs" id="files-list-container">
      {/* Search and Header Section */}
      <div className="px-6 py-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-50/20">
        <div>
          <h2 className="text-base font-semibold text-slate-800 tracking-tight">Recent Files</h2>
          <p className="text-xs text-slate-400 mt-0.5">Secure client uploads accessible strictly by authorized creators.</p>
        </div>

        {/* Search Searchbar */}
        <div className="relative max-w-xs w-full sm:w-64">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            placeholder="Search vault catalog..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 text-slate-700 placeholder-slate-400 text-xs rounded-xl py-1.5 pl-9 pr-4 focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all font-sans"
            id="input-search-files"
          />
        </div>
      </div>

      {/* Workspace Listing Table */}
      <div className="overflow-x-auto">
        <AnimatePresence mode="wait">
          {filteredFiles.length === 0 ? (
            <div className="p-12" id="empty-state-parent">
              <motion.div
                key="empty-state"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="py-12 flex flex-col items-center justify-center text-center text-slate-400 border border-dashed border-slate-200 rounded-2xl bg-slate-50/30"
                id="files-empty-panel"
              >
                <Inbox className="w-10 h-10 text-slate-300 mb-3" />
                <h3 className="text-sm font-semibold text-slate-700">No client files found</h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xs leading-relaxed">
                  {searchQuery ? "No catalog matches your filters. Refined query parameters." : "Initiate an encrypted upload or drop client sheets to populate the stream."}
                </p>
              </motion.div>
            </div>
          ) : (
            <motion.table 
              key="table-active"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="w-full text-left border-collapse"
            >
              <thead>
                <tr className="border-b border-slate-100 text-[11px] font-bold uppercase text-slate-400 bg-slate-50/60">
                  <th className="py-3 px-6">File Name</th>
                  <th className="py-3 px-6">Size</th>
                  <th className="py-3 px-6">Date Uploaded</th>
                  <th className="py-3 px-6 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filteredFiles.map((file) => {
                  const meta = getMimeMeta(file.type);
                  const IconComponent = meta.icon;
                  return (
                    <motion.tr
                      key={file.id}
                      layoutId={`file-row-${file.id}`}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="hover:bg-slate-50 transition-colors group"
                    >
                      {/* Name / Type Icon */}
                      <td className="py-3.5 px-6 flex items-center gap-3">
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center border ${meta.color} transition-all duration-300 flex-shrink-0`}>
                          <IconComponent className="w-4 h-4" />
                        </div>
                        <div className="max-w-[200px] sm:max-w-[320px] overflow-hidden">
                          <button 
                            onClick={() => handleView(file)}
                            className="text-sm font-medium text-slate-700 break-all line-clamp-1 block hover:text-indigo-650 font-sans text-left cursor-pointer focus:outline-none hover:underline decoration-indigo-400/40"
                            title={`Open / View ${file.name}`}
                          >
                            {file.name}
                          </button>
                          <span className="text-[10px] text-slate-400 font-medium tracking-wide uppercase font-mono block mt-0.5">
                            {meta.label}
                          </span>
                        </div>
                      </td>

                      {/* Size */}
                      <td className="py-3.5 px-6 text-xs font-mono text-slate-500 font-medium">
                        {formatBytes(file.size)}
                      </td>

                      {/* Date */}
                      <td className="py-3.5 px-6">
                        <div className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatUploadDate(file.uploadedAt)}</span>
                        </div>
                      </td>

                      {/* Action buttons */}
                      <td className="py-3.5 px-6 text-right">
                        <div className="inline-flex items-center gap-2">
                          {/* Open/View Button */}
                          <button
                            onClick={() => handleView(file)}
                            className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="Open / View "
                            id={`btn-view-${file.id}`}
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Download Button */}
                          <button
                            onClick={() => handleDownload(file)}
                            className="p-1.5 text-slate-400 hover:text-indigo-650 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 rounded-lg transition-colors cursor-pointer"
                            title="Download secure copy"
                            id={`btn-download-${file.id}`}
                          >
                            <DownloadCloud className="w-4 h-4" />
                          </button>

                          {/* Delete Button */}
                          <button
                            onClick={() => handleDeleteTrigger(file.id)}
                            disabled={deletingId === file.id}
                            className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50/50 border border-transparent hover:border-red-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            title="Purge from vault"
                            id={`btn-delete-${file.id}`}
                          >
                            {deletingId === file.id ? (
                              <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <Trash2 className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </motion.table>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
