/**
 * PHASE 6.2: Mobile Header Component
 * Sticky header with logo and hamburger menu (visible only on mobile)
 */

'use client';

import { Crosshair, Menu, X } from 'lucide-react';

interface MobileHeaderProps {
  isMenuOpen: boolean;
  onToggleMenu: () => void;
}

export function MobileHeader({ isMenuOpen, onToggleMenu }: MobileHeaderProps) {
  return (
    <header className="hidden max-md:flex h-[60px] bg-[var(--bg-sidebar)] border-b border-[var(--border-default)] px-5 items-center justify-between sticky top-0 z-[1001]">
      {/* Logo */}
      <div className="flex items-center gap-2.5 font-semibold text-[var(--text-heading)]">
        <Crosshair size={20} className="text-[var(--gh-green)]" />
        <span>PDF Anchor Mapper</span>
      </div>

      {/* Hamburger Button */}
      <button
        onClick={onToggleMenu}
        className="bg-transparent border-none text-[var(--text-main)] cursor-pointer p-1"
        aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
      >
        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>
    </header>
  );
}
