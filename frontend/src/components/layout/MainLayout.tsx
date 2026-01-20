/**
 * PHASE 6.3: Main Layout Component
 * Combines Sidebar, MobileHeader, and main content area
 */

'use client';

import { useState, ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';

interface MainLayoutProps {
  children: ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      {/* Mobile Header - Only visible on mobile */}
      <MobileHeader
        isMenuOpen={isMobileMenuOpen}
        onToggleMenu={toggleMobileMenu}
      />

      {/* Sidebar */}
      <Sidebar isOpen={isMobileMenuOpen} onClose={closeMobileMenu} />

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-[999] md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Main Content */}
      <main className="ml-[260px] max-md:ml-0 p-8 max-md:p-5 flex-1">
        {children}
      </main>
    </>
  );
}
