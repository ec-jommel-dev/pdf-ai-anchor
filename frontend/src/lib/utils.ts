/**
 * Utility functions for the application
 */

import { type ClassValue, clsx } from 'clsx';

// Simple class name merger (avoiding twMerge dependency)
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

/**
 * Format anchor text by wrapping with curly braces
 * Input: "day" -> Output: "{{day}}"
 */
export function formatAnchorText(key: string): string {
  // Remove any existing braces
  const cleanKey = key.replace(/[{}]/g, '').replace(/[^a-zA-Z0-9_]/g, '');
  return `{{${cleanKey}}}`;
}

/**
 * Extract key from anchor text
 * Input: "{{day}}" -> Output: "day"
 */
export function extractAnchorKey(text: string): string {
  return text.replace(/[{}]/g, '');
}

/**
 * Check if anchor should display on a specific page
 */
export function shouldShowOnPage(
  anchorPage: string,
  currentPage: number,
  totalPages: number
): boolean {
  if (anchorPage === 'global') return true;
  if (anchorPage === 'last') return currentPage === totalPages;
  
  // Check specific pages (comma-separated)
  const pages = anchorPage.split(',').map((n) => parseInt(n.trim(), 10));
  return pages.includes(currentPage);
}

/**
 * Generate a unique ID
 */
export function generateId(): string {
  return String(Math.floor(Math.random() * 9000) + 1000);
}
