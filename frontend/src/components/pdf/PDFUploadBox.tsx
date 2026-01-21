/**
 * PHASE 7.2: PDF Upload Box Component
 * Drag & drop zone for PDF file upload
 * Updated: File size limit (10MB)
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { FileUp, Zap } from 'lucide-react';

// Max file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024;

interface PDFUploadBoxProps {
  onFileSelect: (file: File) => void;
  variant?: 'default' | 'autofill';
  onBeforeUpload?: () => boolean; // Return false to prevent upload, true to allow
}

export function PDFUploadBox({ onFileSelect, variant = 'default', onBeforeUpload }: PDFUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if upload should be allowed
  const canUpload = useCallback(() => {
    if (onBeforeUpload) {
      return onBeforeUpload();
    }
    return true;
  }, [onBeforeUpload]);

  // Validate file
  const validateFile = useCallback((file: File): string | null => {
    if (file.type !== 'application/pdf') {
      return 'Please upload a PDF document.';
    }
    if (file.size > MAX_FILE_SIZE) {
      return `File too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`;
    }
    return null;
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setError(null);
    
    // Check validation before processing
    if (!canUpload()) return;
    
    const file = e.dataTransfer.files[0];
    if (!file) return;
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }
    
    onFileSelect(file);
  }, [onFileSelect, canUpload, validateFile]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (!file) return;
    
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      if (inputRef.current) inputRef.current.value = '';
      return;
    }
    
    onFileSelect(file);
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileSelect, validateFile]);

  const handleClick = () => {
    setError(null);
    // Check validation before opening file dialog
    if (!canUpload()) return;
    inputRef.current?.click();
  };

  return (
    <div>
      <div
        className={`upload-box ${isDragging ? 'border-[var(--gh-blue)] bg-[rgba(9,105,218,0.05)]' : ''} ${error ? 'border-[var(--gh-red)]' : ''}`}
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {variant === 'default' ? (
          <FileUp size={40} className="text-[var(--gh-blue)] mx-auto" />
        ) : (
          <Zap size={40} className="text-[var(--gh-green)] mx-auto" />
        )}
        
        <p className="my-2.5 text-[var(--text-heading)]">
          {variant === 'default' ? (
            <>Drag & Drop PDF or <strong>Browse</strong></>
          ) : (
            <>Upload Contract to <strong>Auto Fill</strong></>
          )}
        </p>
        
        <p className="text-xs text-[#8b949e]">
          {variant === 'default' 
            ? 'PDF documents only (max 10MB)'
            : 'This will apply saved anchor coordinates'
          }
        </p>
        
        <input
          ref={inputRef}
          type="file"
          accept="application/pdf"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>
      
      {error && (
        <p className="text-sm text-[var(--gh-red)] mt-2 text-center">{error}</p>
      )}
    </div>
  );
}
