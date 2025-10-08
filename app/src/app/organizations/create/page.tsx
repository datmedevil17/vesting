"use client";

import React, { useState, useMemo } from 'react';
import { createOrganization, getProvider } from '@/services/blockchain';
import { useWallet } from '@solana/wallet-adapter-react';
import { useRouter } from 'next/navigation';
import OrganizationsList from '@/components/OrganizationsList';

const CreateOrganizationPage = () => {
  const { publicKey, sendTransaction, signTransaction } = useWallet();
  const router = useRouter();
  
  const [orgName, setOrgName] = useState('');
  const [status, setStatus] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const program = useMemo(
    () => getProvider(publicKey, signTransaction, sendTransaction),
    [publicKey, signTransaction, sendTransaction]
  );

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!program || !publicKey) {
      setStatus('Wallet not connected or program unavailable.');
      return;
    }

    if (!orgName.trim()) {
      setStatus('Please enter an organization name.');
      return;
    }

    setStatus('Creating organization...');

    try {
      const tx = await createOrganization(program, publicKey, orgName);
      setStatus(`Organization created! Tx: ${tx}`);
      setOrgName(''); // Clear form
      
      // Trigger refresh of organizations list
      setRefreshTrigger(prev => prev + 1);
        
    } catch (err: any) {
      setStatus(`Error: ${err.message}`);
    }
  };

  if (!publicKey) {
    return (
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-4">Create Organization</h1>
        <div className="text-red-500">Please connect your wallet to create an organization.</div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Create New Organization</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Create Form */}
        <div>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name *
              </label>
              <input
                type="text"
                id="orgName"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="Enter organization name"
                required
              />
            </div>

            <div className="flex gap-4">
              <button
                type="submit"
                disabled={!program || !publicKey}
                className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Create Organization
              </button>
              
              <button
                type="button"
                onClick={() => router.push('/organizations')}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                View All Organizations
              </button>
            </div>
          </form>

          {status && (
            <div className={`mt-4 p-3 rounded-md text-sm ${
              status.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
            }`}>
              {status}
            </div>
          )}
        </div>

        {/* Organizations List */}
        <OrganizationsList refreshTrigger={refreshTrigger} />
      </div>
    </div>
  );
};

export default CreateOrganizationPage;