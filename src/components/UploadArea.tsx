import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { UploadCloud, File, AlertCircle, CheckCircle2 } from 'lucide-react';
import { formatBytes } from './Sidebar';

interface UploadAreaProps {
  onUpload: (file: File) => Promise<void>;
}

export default function UploadArea({ onUpload }: UploadAreaProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const MAX_FILE_SIZE_MB = 2.0;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

  const validateAndProcessFile = async (file: File) => {
    if (isUploading) return;
    setErrorMsg(null);
    setSuccessMsg(null);

    // Strict Size Limit Check
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setErrorMsg(`Failed: "${file.name}" is ${formatBytes(file.size)}. Individual files must be under ${MAX_FILE_SIZE_MB}MB to ensure optimal encrypted upload speeds.`);
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      setSuccessMsg(`File "${file.name}" securely uploaded and cataloged!`);
      // Auto-clear success message
      setTimeout(() => setSuccessMsg(null), 5000);
    } catch (error: any) {
      setErrorMsg(error?.message || "Failed to catalog file. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!isUploading) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (isUploading) return;
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndProcessFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      validateAndProcessFile(e.target.files[0]);
    }
    // Clear value to allow re-upload and prevent state locking
    e.target.value = '';
  };

  const triggerFileSelect = () => {
    if (!isUploading) {
      fileInputRef.current?.click();
    }
  };

  return (
    <div id="file-uploader" className="w-full">
      <motion.div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          if (!isUploading) {
            triggerFileSelect();
          }
        }}
        whileHover={isUploading ? {} : { scale: 1.002 }}
        whileTap={isUploading ? {} : { scale: 1.0 }}
        animate={{
          borderColor: isDragging ? '#6366f1' : '#e2e8f0',
          backgroundColor: isDragging ? '#f5f3ff' : '#ffffff',
        }}
        className={`border-2 border-dashed rounded-3xl p-10 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-200 shadow-sm relative min-h-[220px] group ${
          isUploading ? 'cursor-not-allowed opacity-90' : 'hover:border-indigo-400 hover:bg-slate-50/50'
        } ${
          isDragging ? 'border-indigo-500 bg-indigo-50/50' : 'border-slate-200'
        }`}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          accept=".pdf,.png,.jpg,.jpeg,.txt,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.zip"
          id="file-input-raw"
        />

        <AnimatePresence mode="wait">
          {isUploading ? (
            <motion.div
              key="uploading-state"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center"
            >
              <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center mb-4">
                <div className="w-6 h-6 border-3 border-indigo-600 border-t-transparent rounded-full animate-spin" />
              </div>
              <h3 className="text-sm font-semibold text-slate-800">Encrypting & Uploading Vault File...</h3>
              <p className="text-xs text-slate-400 mt-1">Please keep this browser window active.</p>
            </motion.div>
          ) : (
            <motion.div
              key="idle-state"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex flex-col items-center space-y-4"
            >
              <div className="w-14 h-14 bg-indigo-50 rounded-full flex items-center justify-center text-indigo-500 group-hover:scale-115 transition-transform duration-300 shadow-xs" id="upload-icon-box">
                <UploadCloud className="w-7 h-7" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-medium text-slate-800 tracking-tight">Click or drag files to upload</h3>
                <p className="text-sm text-slate-400 mt-1 leading-relaxed max-w-sm">
                  PDF, ZIP, JPG, or PNG up to <strong>{MAX_FILE_SIZE_MB}MB</strong>
                </p>
              </div>
              <button 
                type="button"
                className="px-6 py-2 bg-indigo-600 hover:bg-indigo-750 active:bg-indigo-700 text-white rounded-xl text-sm font-semibold shadow-md shadow-indigo-500/10 cursor-pointer transition-colors"
                onClick={(e) => {
                  e.stopPropagation();
                  triggerFileSelect();
                }}
              >
                Select Files
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {isDragging && (
          <div className="absolute inset-0 bg-indigo-500/5 rounded-3xl pointer-events-none flex items-center justify-center border border-indigo-500 animate-pulse" />
        )}
      </motion.div>

      {/* Progress banners */}
      <AnimatePresence>
        {errorMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-start gap-3 text-xs text-rose-700 font-sans"
            id="upload-error-banner"
          >
            <AlertCircle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Upload Guard Warning</span>
              <p className="leading-relaxed">{errorMsg}</p>
            </div>
          </motion.div>
        )}

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-4 p-4 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-start gap-3 text-xs text-emerald-800 font-sans"
            id="upload-success-banner"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold block mb-0.5">Secure Transfer Complete</span>
              <p className="leading-relaxed">{successMsg}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
