/**
 * PHASE 8.3: Provider List Section
 * Table of providers with CRUD operations
 * Updated: Search/filter functionality
 */

'use client';

import { useState, useMemo } from 'react';
import { Plus, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { ProviderModal } from '@/components/modals/ProviderModal';
import { useProviderStore } from '@/stores/useProviderStore';

export function ProviderListSection() {
  const [showModal, setShowModal] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  const { providers, viewProfile, isLoading } = useProviderStore();

  // Filter providers based on search and status
  const filteredProviders = useMemo(() => {
    return providers.filter(provider => {
      const matchesSearch = provider.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' 
        || (statusFilter === 'active' && provider.active)
        || (statusFilter === 'inactive' && !provider.active);
      return matchesSearch && matchesStatus;
    });
  }, [providers, searchQuery, statusFilter]);

  const handleAddNew = () => {
    setEditId(null);
    setShowModal(true);
  };

  const handleEdit = (id: string) => {
    setEditId(id);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditId(null);
  };

  const clearSearch = () => {
    setSearchQuery('');
  };

  return (
    <section className="max-w-[900px] mx-auto">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-[var(--text-heading)] m-0">
          Providers
        </h2>
        <Button variant="primary" onClick={handleAddNew}>
          <Plus size={14} /> Add New
        </Button>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-3 mb-4">
        {/* Search Input */}
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#8b949e]" />
          <input
            type="text"
            placeholder="Search providers..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="form-input pl-9 pr-8 w-full"
          />
          {searchQuery && (
            <button
              onClick={clearSearch}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-[var(--btn-hover)] transition-colors"
            >
              <X size={14} className="text-[#8b949e]" />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
          className="form-input w-auto cursor-pointer"
        >
          <option value="all">All Status</option>
          <option value="active">Active Only</option>
          <option value="inactive">Inactive Only</option>
        </select>
      </div>

      {/* Results Count */}
      {(searchQuery || statusFilter !== 'all') && (
        <p className="text-sm text-[#8b949e] mb-3">
          Showing {filteredProviders.length} of {providers.length} providers
          {searchQuery && <span> matching "{searchQuery}"</span>}
        </p>
      )}

      {/* Table */}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>Provider Name</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProviders.map((provider) => (
              <tr 
                key={provider.id}
                className={provider.active ? '' : 'is-archived'}
              >
                <td data-label="Name">
                  <strong className="text-[var(--text-heading)]">{provider.name}</strong>
                </td>
                <td data-label="Status">
                  <Badge variant={provider.active ? 'active' : 'inactive'}>
                    {provider.active ? 'Active' : 'Inactive'}
                  </Badge>
                </td>
                <td className="action-cell" data-label="Actions">
                  <div className="flex gap-[5px]">
                    <Button 
                      onClick={() => viewProfile(provider.id)}
                      disabled={!provider.active}
                      title={!provider.active ? 'Activate provider to view profile' : 'View provider profile'}
                    >
                      View
                    </Button>
                    <Button onClick={() => handleEdit(provider.id)}>
                      Edit
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {isLoading && (
              <tr>
                <td colSpan={3} className="text-center text-[#8b949e] py-8">
                  Loading providers...
                </td>
              </tr>
            )}
            {!isLoading && providers.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-[#8b949e] py-8">
                  No providers yet. Click "Add New" to create one.
                </td>
              </tr>
            )}
            {!isLoading && providers.length > 0 && filteredProviders.length === 0 && (
              <tr>
                <td colSpan={3} className="text-center text-[#8b949e] py-8">
                  No providers match your search.
                  <button 
                    onClick={() => { setSearchQuery(''); setStatusFilter('all'); }}
                    className="text-[var(--gh-blue)] hover:underline ml-1"
                  >
                    Clear filters
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Provider Modal */}
      <ProviderModal
        isOpen={showModal}
        onClose={handleCloseModal}
        editId={editId}
      />
    </section>
  );
}
