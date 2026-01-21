/**
 * Word to PDF Converter Section
 * Client-side conversion using mammoth.js and html2pdf.js
 * No API or database required
 */

'use client';

import { useState, useCallback, useRef } from 'react';
import { FileText, Upload, Download, X, Loader2, FileOutput, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Format file size for display
const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return bytes + ' B';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
  return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
};

export function ConverterSection() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle file selection - Only .docx supported (mammoth.js limitation)
  const handleFileSelect = useCallback((file: File) => {
    // Only .docx is reliably supported by mammoth.js
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      || file.name.toLowerCase().endsWith('.docx');
    
    if (!isDocx) {
      setError('Only .docx files are supported. Please convert .doc files to .docx first using Microsoft Word or Google Docs.');
      return;
    }
    
    // Check file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError(`File too large. Maximum size is 10MB. Your file is ${(file.size / (1024 * 1024)).toFixed(1)}MB.`);
      return;
    }
    
    setSelectedFile(file);
    setError(null);
    setHtmlContent(null);
  }, []);

  // Handle drag events
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
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Handle file input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  }, [handleFileSelect]);

  // Cancel selected file
  const handleCancel = useCallback(() => {
    setSelectedFile(null);
    setError(null);
    setHtmlContent(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  // Convert Word to PDF
  const handleConvert = useCallback(async () => {
    if (!selectedFile) return;

    setIsConverting(true);
    setError(null);

    try {
      // Dynamic imports for client-side only
      const mammoth = await import('mammoth');
      const html2pdf = (await import('html2pdf.js')).default;

      // Read file as ArrayBuffer
      const arrayBuffer = await selectedFile.arrayBuffer();

      // Convert to HTML using mammoth
      const result = await mammoth.convertToHtml({ arrayBuffer });
      
      if (result.messages.length > 0) {
        console.log('Mammoth messages:', result.messages);
      }

      const html = result.value;
      setHtmlContent(html);

      // Create styled HTML wrapper
      const styledHtml = `
        <div style="
          font-family: 'Times New Roman', Times, serif;
          font-size: 12pt;
          line-height: 1.5;
          padding: 20px;
          max-width: 100%;
          word-wrap: break-word;
        ">
          ${html}
        </div>
      `;

      // Convert HTML to PDF
      const element = document.createElement('div');
      element.innerHTML = styledHtml;
      document.body.appendChild(element);

      const options = {
        margin: [10, 10, 10, 10],
        filename: selectedFile.name.replace(/\.(docx?|doc)$/i, '.pdf'),
        image: { type: 'jpeg', quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };

      await html2pdf().set(options).from(element).save();
      
      document.body.removeChild(element);

      // Reset after successful conversion
      setSelectedFile(null);
      setHtmlContent(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

    } catch (err) {
      console.error('Conversion error:', err);
      setError(err instanceof Error ? err.message : 'Failed to convert document. Please try again.');
    } finally {
      setIsConverting(false);
    }
  }, [selectedFile]);

  return (
    <section className="max-w-[900px] mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)] m-0">
          Word to PDF Converter
        </h2>
      </div>

      <div className="table-card p-6">
        {/* Info Banner */}
        <div className="mb-6 p-3 bg-[rgba(9,105,218,0.1)] border border-[var(--gh-blue)] rounded-md">
          <p className="text-sm text-[var(--text-main)] m-0 flex items-center gap-2">
            <FileOutput size={16} className="text-[var(--gh-blue)]" />
            <span>
              <strong>Client-side conversion</strong> - Your files never leave your browser. No upload to server required.
            </span>
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 p-3 mb-4 bg-[rgba(207,34,46,0.1)] border border-[var(--gh-red)] rounded-md text-[var(--gh-red)] text-sm">
            <AlertCircle size={16} />
            {error}
          </div>
        )}

        {/* Converting State */}
        {isConverting ? (
          <div className="border-2 border-dashed border-[var(--border-default)] rounded-lg p-10 text-center">
            <Loader2 size={40} className="animate-spin text-[var(--gh-blue)] mx-auto mb-4" />
            <p className="text-[var(--text-heading)] font-medium">Converting to PDF...</p>
            <p className="text-sm text-[#8b949e] mt-2">
              This may take a moment for large documents
            </p>
          </div>
        ) : selectedFile ? (
          /* File Selected - Confirmation View */
          <div className="border-2 border-solid border-[var(--gh-blue)] bg-[rgba(9,105,218,0.05)] rounded-lg p-6">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-12 h-12 bg-[var(--gh-blue)] rounded-lg flex items-center justify-center">
                <FileText size={24} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[var(--text-heading)] font-medium truncate">
                  {selectedFile.name}
                </p>
                <p className="text-sm text-[#8b949e]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button 
                onClick={handleCancel}
                className="p-2 rounded-full hover:bg-[rgba(255,255,255,0.1)] transition-colors"
                title="Remove file"
              >
                <X size={20} className="text-[#8b949e]" />
              </button>
            </div>
            
            <p className="text-sm text-[#8b949e] mb-4">
              Ready to convert to PDF
            </p>
            
            <div className="flex gap-3">
              <Button onClick={handleCancel}>
                Cancel
              </Button>
              <Button variant="primary" onClick={handleConvert}>
                <Download size={16} /> Convert & Download PDF
              </Button>
            </div>
          </div>
        ) : (
          /* Upload Box */
          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-lg p-10 text-center cursor-pointer transition-colors
              ${isDragging 
                ? 'border-[var(--gh-blue)] bg-[rgba(9,105,218,0.05)]' 
                : 'border-[var(--border-default)] hover:border-[var(--gh-blue)] hover:bg-[rgba(9,105,218,0.02)]'
              }
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              onChange={handleInputChange}
              className="hidden"
            />
            
            <Upload size={40} className="mx-auto mb-4 text-[#8b949e]" />
            <p className="text-[var(--text-heading)] font-medium mb-2">
              Drop your Word document here
            </p>
            <p className="text-sm text-[#8b949e] mb-4">
              or click to browse
            </p>
            <p className="text-xs text-[#8b949e]">
              Supports .docx files only (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="mt-6 p-4 bg-[var(--bg-sidebar)] border border-[var(--border-default)] rounded-md">
        <h4 className="text-sm font-semibold text-[var(--text-heading)] mb-2">How it works:</h4>
        <ol className="text-sm text-[var(--text-main)] space-y-1 list-decimal list-inside">
          <li>Select or drag & drop a Word document (.docx only)</li>
          <li>Click "Convert & Download PDF" to start conversion</li>
          <li>Your PDF will automatically download when ready</li>
        </ol>
        <p className="text-xs text-[#8b949e] mt-3">
          💡 <strong>Note:</strong> Complex formatting, images, and tables may have slight differences in the PDF output.
        </p>
      </div>
    </section>
  );
}
