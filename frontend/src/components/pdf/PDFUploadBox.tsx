/**
 * PHASE 7.2: PDF Upload Box Component
 * Drag & drop zone for PDF file upload
 */

'use client';

import { useCallback, useRef, useState } from 'react';
import { FileUp, Zap } from 'lucide-react';

interface PDFUploadBoxProps {
  onFileSelect: (file: File) => void;
  variant?: 'default' | 'autofill';
  onBeforeUpload?: () => boolean; // Return false to prevent upload, true to allow
}

export function PDFUploadBox({ onFileSelect, variant = 'default', onBeforeUpload }: PDFUploadBoxProps) {
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  // Check if upload should be allowed
  const canUpload = useCallback(() => {
    if (onBeforeUpload) {
      return onBeforeUpload();
    }
    return true;
  }, [onBeforeUpload]);

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
    
    // Check validation before processing
    if (!canUpload()) return;
    
    const file = e.dataTransfer.files[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else {
      alert('Please upload a PDF document.');
    }
  }, [onFileSelect, canUpload]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      onFileSelect(file);
    } else if (file) {
      alert('Please upload a PDF document.');
    }
    // Reset input so same file can be selected again
    if (inputRef.current) inputRef.current.value = '';
  }, [onFileSelect]);

  const handleClick = () => {
    // Check validation before opening file dialog
    if (!canUpload()) return;
    inputRef.current?.click();
  };

  return (
    <div
      className={`upload-box ${isDragging ? 'border-[var(--gh-blue)] bg-[rgba(9,105,218,0.05)]' : ''}`}
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
          ? 'PDF documents only'
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
  );
}
