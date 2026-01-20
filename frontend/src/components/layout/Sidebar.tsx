/**
 * PHASE 6.1: Sidebar Component
 * Main navigation sidebar with logo, nav buttons, and theme toggle
 */

'use client';

import { 
  Shield, 
  UploadCloud, 
  Zap, 
  Users, 
  Moon, 
  Sun 
} from 'lucide-react';
import { useProviderStore } from '@/stores/useProviderStore';
import { useTheme } from '@/hooks/useTheme';
import { TabType } from '@/types';
import { cn } from '@/lib/utils';

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems: { id: TabType; label: string; icon: React.ReactNode }[] = [
  { id: 'upload', label: 'Contract Mapper', icon: <UploadCloud size={18} /> },
  { id: 'autofill', label: 'Auto Fill Anchor', icon: <Zap size={18} /> },
  { id: 'list', label: 'Provider List', icon: <Users size={18} /> },
];

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const { activeTab, setActiveTab } = useProviderStore();
  const { theme, toggleTheme, isDark, mounted } = useTheme();

  const handleNavClick = (tab: TabType) => {
    setActiveTab(tab);
    onClose?.();
  };

  return (
    <aside
      className={cn(
        // Base styles
        'w-[260px] bg-[var(--bg-sidebar)] border-r border-[var(--border-default)]',
        'p-6 flex flex-col h-screen fixed left-0 top-0 z-[1000] transition-[left] duration-300',
        // Mobile styles
        'max-md:top-[60px] max-md:h-[calc(100vh-60px)] max-md:-left-full',
        isOpen && 'max-md:left-0'
      )}
    >
      {/* Logo - Desktop Only */}
      <div className="flex items-center gap-2.5 font-semibold text-[var(--text-heading)] mb-6 desktop-only">
        <Shield size={20} />
        <span>ProviderHub</span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1">
        {navItems.map((item) => (
          <button
            key={item.id}
            onClick={() => handleNavClick(item.id)}
            className={cn(
              'w-full flex items-center gap-2.5 px-2.5 py-2.5 border-none bg-transparent',
              'cursor-pointer rounded-md text-sm text-[var(--text-main)] mb-1 transition-colors',
              activeTab === item.id && 'bg-[var(--btn-hover)] border border-[var(--border-default)] text-[var(--gh-blue)] font-semibold',
              activeTab !== item.id && 'hover:bg-[var(--btn-hover)]'
            )}
          >
            {item.icon}
            {item.label}
          </button>
        ))}
      </nav>

      {/* Theme Toggle - Bottom */}
      <div className="mt-auto border-t border-[var(--border-default)] pt-5">
        <button
          onClick={toggleTheme}
          className={cn(
            'w-full flex items-center gap-2.5 px-2.5 py-2.5 border-none bg-transparent',
            'cursor-pointer rounded-md text-sm text-[var(--text-main)] transition-colors',
            'hover:bg-[var(--btn-hover)]'
          )}
        >
          {mounted && (isDark ? <Sun size={18} /> : <Moon size={18} />)}
          {mounted && (isDark ? 'Light Mode' : 'Dark Mode')}
        </button>
      </div>
    </aside>
  );
}
