/**
 * PHASE 11.2: Main Page
 * Root page component that renders the active section based on navigation state
 * Navigation state persisted in localStorage (hydrated after mount to avoid SSR mismatch)
 */

'use client';

import { useEffect } from 'react';
import { MainLayout } from '@/components/layout/MainLayout';
import { DashboardSection } from '@/components/sections/DashboardSection';
import { ContractMapperSection } from '@/components/sections/ContractMapperSection';
import { AutoFillSection } from '@/components/sections/AutoFillSection';
import { ProviderListSection } from '@/components/sections/ProviderListSection';
import { ProviderProfileSection } from '@/components/sections/ProviderProfileSection';
import { ConverterSection } from '@/components/sections/ConverterSection';
import { Toast } from '@/components/ui/Toast';
import { useProviderStore } from '@/stores/useProviderStore';

export default function Home() {
  const { 
    activeTab, 
    toast, 
    hideToast, 
    getCurrentProvider, 
    setActiveTab,
    hydrateFromStorage,
    isHydrated
  } = useProviderStore();

  // Hydrate navigation state from localStorage after mount (avoids SSR mismatch)
  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  // Safety check: if on profile page but no provider exists, redirect to list
  useEffect(() => {
    if (isHydrated && activeTab === 'profile' && !getCurrentProvider()) {
      setActiveTab('list');
    }
  }, [activeTab, getCurrentProvider, setActiveTab, isHydrated]);

  return (
    <MainLayout>
      {/* Global Toast Notification */}
      <Toast
        message={toast.message}
        type={toast.type}
        isVisible={toast.isVisible}
        onClose={hideToast}
      />

      {/* Render active section based on navigation state */}
      {activeTab === 'dashboard' && <DashboardSection />}
      {activeTab === 'upload' && <ContractMapperSection />}
      {activeTab === 'autofill' && <AutoFillSection />}
      {activeTab === 'list' && <ProviderListSection />}
      {activeTab === 'converter' && <ConverterSection />}
      {activeTab === 'profile' && <ProviderProfileSection />}
    </MainLayout>
  );
}
