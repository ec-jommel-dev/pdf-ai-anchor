/**
 * Dashboard Section
 * Main landing page with quick actions and provider overview
 */

'use client';

import { useState } from 'react';
import { UploadCloud, Zap, FileText, Users, ArrowRight, Crosshair, Radio, Pin, RefreshCw } from 'lucide-react';
import { useProviderStore } from '@/stores/useProviderStore';
import { Button } from '@/components/ui/Button';

export function DashboardSection() {
  const { providers, setActiveTab, viewProfile, isLoading, fetchProviders, showToast } = useProviderStore();
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchProviders();
      showToast('Data refreshed successfully!', 'success');
    } catch {
      showToast('Failed to refresh data', 'error');
    } finally {
      setIsRefreshing(false);
    }
  };
  
  // Calculate stats - count only ACTIVE items for consistency
  const totalProviders = providers.length;
  const activeProviders = providers.filter(p => p.active).length;
  
  // Count only active PDFs
  const activeContracts = providers.reduce((sum, p) => {
    const activePdfs = p.pdfs?.filter(pdf => pdf.isActive) || [];
    return sum + activePdfs.length;
  }, 0);
  
  // Count anchors from active PDFs only
  const totalAnchors = providers.reduce((sum, p) => {
    const activePdfs = p.pdfs?.filter(pdf => pdf.isActive) || [];
    return sum + activePdfs.reduce((pdfSum, pdf) => pdfSum + (pdf.anchorCount || 0), 0);
  }, 0);

  return (
    <section className="max-w-[1000px] mx-auto">
      {/* Welcome Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <Crosshair size={28} className="text-[var(--gh-green)]" />
            <h1 className="text-2xl font-bold text-[var(--text-heading)] m-0">
              PDF Anchor Mapper
            </h1>
          </div>
          <Button 
            onClick={handleRefresh} 
            disabled={isRefreshing || isLoading}
            title="Refresh data"
          >
            <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </Button>
        </div>
        <p className="text-[var(--text-main)] text-sm">
          Map anchor strings to PDF contracts and auto-fill them with ease.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="table-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(9,105,218,0.1)] flex items-center justify-center flex-shrink-0">
              <Radio size={20} className="text-[var(--gh-blue)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--gh-blue)]">{totalProviders}</div>
              <div className="text-xs text-[#8b949e]">Total Providers</div>
            </div>
          </div>
        </div>
        <div className="table-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(26,127,55,0.1)] flex items-center justify-center flex-shrink-0">
              <Radio size={20} className="text-[var(--gh-green)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--gh-green)]">{activeProviders}</div>
              <div className="text-xs text-[#8b949e]">Active Providers</div>
            </div>
          </div>
        </div>
        <div className="table-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(26,127,55,0.1)] flex items-center justify-center flex-shrink-0">
              <FileText size={20} className="text-[var(--gh-green)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--gh-green)]">{activeContracts}</div>
              <div className="text-xs text-[#8b949e]">Active Contracts</div>
            </div>
          </div>
        </div>
        <div className="table-card p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[rgba(219,109,40,0.1)] flex items-center justify-center flex-shrink-0">
              <Pin size={20} className="text-[var(--gh-orange)]" />
            </div>
            <div>
              <div className="text-2xl font-bold text-[var(--gh-orange)]">{totalAnchors}</div>
              <div className="text-xs text-[#8b949e]">Total Anchors</div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <h2 className="text-lg font-semibold text-[var(--text-heading)] mb-4">Quick Actions</h2>
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        {/* Contract Mapper Card */}
        <button
          onClick={() => setActiveTab('upload')}
          className="table-card p-6 text-left hover:border-[var(--gh-blue)] transition-colors group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[rgba(9,105,218,0.1)] flex items-center justify-center flex-shrink-0">
              <UploadCloud size={24} className="text-[var(--gh-blue)]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[var(--text-heading)] m-0 mb-1 flex items-center gap-2">
                Contract Mapper
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gh-blue)]" />
              </h3>
              <p className="text-sm text-[#8b949e] m-0">
                Upload PDF contracts and map anchor strings by clicking on the document. Set coordinates and page locations for each anchor.
              </p>
            </div>
          </div>
        </button>

        {/* Auto Fill Card */}
        <button
          onClick={() => setActiveTab('autofill')}
          className="table-card p-6 text-left hover:border-[var(--gh-green)] transition-colors group cursor-pointer"
        >
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-lg bg-[rgba(26,127,55,0.1)] flex items-center justify-center flex-shrink-0">
              <Zap size={24} className="text-[var(--gh-green)]" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-semibold text-[var(--text-heading)] m-0 mb-1 flex items-center gap-2">
                Auto Fill Anchor
                <ArrowRight size={16} className="opacity-0 group-hover:opacity-100 transition-opacity text-[var(--gh-green)]" />
              </h3>
              <p className="text-sm text-[#8b949e] m-0">
                Apply saved anchor settings to new PDF contracts. Automatically place anchor strings at the configured positions.
              </p>
            </div>
          </div>
        </button>
      </div>

      {/* Provider Overview */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-[var(--text-heading)] m-0">Provider Overview</h2>
        <button
          onClick={() => setActiveTab('list')}
          className="text-sm text-[var(--gh-blue)] hover:underline flex items-center gap-1"
        >
          View All <ArrowRight size={14} />
        </button>
      </div>

      {isLoading ? (
        <div className="table-card p-8 text-center text-[#8b949e]">
          Loading providers...
        </div>
      ) : providers.length === 0 ? (
        <div className="table-card p-8 text-center">
          <Users size={40} className="mx-auto mb-3 text-[#8b949e]" />
          <p className="text-[#8b949e] mb-3">No providers yet.</p>
          <button
            onClick={() => setActiveTab('list')}
            className="text-[var(--gh-blue)] hover:underline text-sm"
          >
            Add your first provider →
          </button>
        </div>
      ) : (
        <div className="table-card overflow-hidden">
          <table>
            <thead>
              <tr>
                <th>Provider</th>
                <th>Status</th>
                <th>Contracts</th>
                <th>Anchors</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {providers.slice(0, 5).map((provider) => (
                <tr key={provider.id}>
                  <td className="font-medium text-[var(--text-heading)]">
                    {provider.name}
                  </td>
                  <td>
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full ${
                      provider.active 
                        ? 'bg-[rgba(26,127,55,0.15)] text-[var(--gh-green)]' 
                        : 'bg-[rgba(207,34,46,0.15)] text-[var(--gh-red)]'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        provider.active ? 'bg-[var(--gh-green)]' : 'bg-[var(--gh-red)]'
                      }`} />
                      {provider.active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <FileText size={14} className="text-[#8b949e]" />
                      <span>{provider.pdfCount || provider.pdfs?.length || 0}</span>
                    </div>
                  </td>
                  <td>
                    <div className="flex items-center gap-1.5">
                      <Crosshair size={14} className="text-[#8b949e]" />
                      <span>{provider.anchors?.length || 0}</span>
                    </div>
                  </td>
                  <td>
                    {provider.active ? (
                      <button
                        onClick={() => viewProfile(provider.id)}
                        className="text-xs text-[var(--gh-blue)] hover:underline"
                      >
                        View →
                      </button>
                    ) : (
                      <span 
                        className="text-xs text-[#8b949e] cursor-not-allowed"
                        title="Activate provider to view"
                      >
                        View →
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {providers.length > 5 && (
            <div className="p-3 border-t border-[var(--border-default)] text-center">
              <button
                onClick={() => setActiveTab('list')}
                className="text-sm text-[var(--gh-blue)] hover:underline"
              >
                View all {providers.length} providers →
              </button>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
