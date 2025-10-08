"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { joinOrganization, getProvider } from '@/services';
import { useWallet } from '@solana/wallet-adapter-react';
import { BN } from "@coral-xyz/anchor";


interface Organization {
  publicKey: string;
  account: {
    orgId: string;
    name: string;
    owner: string;
    totalEmployees: string;
    totalVestingSchedules: string;
  };
}

interface ApiResponse {
  success: boolean;
  data?: Organization[];
  error?: string;
}

const OrganizationsPage = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [joinLoading, setJoinLoading] = useState<string | null>(null);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [employeeDetails, setEmployeeDetails] = useState({
    name: '',
    position: ''
  });
  const router = useRouter();
  const { connected, publicKey, signTransaction, sendTransaction } = useWallet();

  const provider = useMemo(() => {
    if (!publicKey || !signTransaction || !sendTransaction) return null;
    return getProvider(publicKey, signTransaction, sendTransaction);
  }, [publicKey, signTransaction, sendTransaction]);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/organizations');
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        console.log('Full API response:', data);
        
        if (data.success && data.data) {
          console.log('Organizations data:', data.data);
          setOrganizations(data.data);
        } else {
          setError(data.error || 'Failed to fetch organizations');
        }
      } catch (err) {
        console.error('Error fetching organizations:', err);
        setError('Failed to fetch organizations');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, []);

  const handleOrgClick = (orgId: string) => {
    console.log('Navigating to organization:', orgId);
    router.push(`/organizations/${orgId}`);
  };

  const handleJoinClick = (org: Organization, event: React.MouseEvent) => {
    event.stopPropagation();
    
    if (!connected || !publicKey) {
      alert('Please connect your wallet first');
      return;
    }

    setSelectedOrg(org);
    setShowJoinModal(true);
    setEmployeeDetails({ name: '', position: '' });
  };

  const handleJoinSubmit = async () => {
    if (!selectedOrg || !provider || !publicKey) return;

    if (!employeeDetails.name.trim() || !employeeDetails.position.trim()) {
      alert('Please fill in all fields');
      return;
    }

    try {
      setJoinLoading(selectedOrg.account.orgId);
      
      const orgIdBN = new BN(selectedOrg.account.orgId);
      console.log('Joining organization:', selectedOrg.account.name);
      console.log('Employee details:', employeeDetails);
      
      const result = await joinOrganization(
        provider,
        publicKey,
        orgIdBN,
        employeeDetails.name.trim(),
        employeeDetails.position.trim()
      );
      
      if (result) {
        alert(`Successfully joined ${selectedOrg.account.name} as ${employeeDetails.position}!`);
        setShowJoinModal(false);
        setSelectedOrg(null);
        setEmployeeDetails({ name: '', position: '' });
        // Refresh the organizations list
        window.location.reload();
      } else {
        alert('Failed to join organization');
      }
    } catch (error) {
      console.error('Error joining organization:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      alert(`Error joining organization: ${errorMessage}`);
    } finally {
      setJoinLoading(null);
    }
  };

  const handleModalClose = () => {
    setShowJoinModal(false);
    setSelectedOrg(null);
    setEmployeeDetails({ name: '', position: '' });
    setJoinLoading(null);
  };

  const isUserOwner = (org: Organization) => {
    return connected && publicKey && org.account.owner === publicKey.toBase58();
  };

  if (loading) {
    return (
      <div className="p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Organizations</h1>
          <div className="flex justify-center items-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading organizations...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 pt-20">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Organizations</h1>
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <div className="flex">
              <div className="text-red-600">
                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-red-800 font-medium">Error loading organizations</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pt-20">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Organizations</h1>
          <button
            onClick={() => router.push('/organizations/create')}
            className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
          >
            Create Organization
          </button>
        </div>
        
        {organizations.length === 0 ? (
          <div className="text-center py-16">
            <div className="mx-auto w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-xl font-medium text-gray-900 mb-2">No organizations found</h3>
            <p className="text-gray-600 mb-8">Get started by creating your first organization.</p>
            <button
              onClick={() => router.push('/organizations/create')}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Create Your First Organization
            </button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <div
                key={org.publicKey}
                className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer hover:border-gray-300"
                onClick={() => handleOrgClick(org.account?.orgId)}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-semibold text-gray-900 truncate">
                    {org.account?.name || 'Unknown Organization'}
                  </h3>
                  {isUserOwner(org) && (
                    <span className="bg-green-100 text-green-800 text-xs font-medium px-2.5 py-1 rounded-full ml-2">
                      Owner
                    </span>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Org ID:</span>
                    <span className="text-sm font-medium text-gray-900">
                      {org.account?.orgId || 'Unknown'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Owner:</span>
                    <span className="text-sm font-mono text-gray-900">
                      {org.account?.owner ? `${org.account.owner.slice(0, 8)}...` : 'Unknown'}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {org.account?.totalEmployees || '0'}
                    </div>
                    <div className="text-xs text-gray-600">Employees</div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-gray-900">
                      {org.account?.totalVestingSchedules || '0'}
                    </div>
                    <div className="text-xs text-gray-600">Vesting</div>
                  </div>
                </div>
                
                {!isUserOwner(org) && (
                  <button
                    onClick={(e) => handleJoinClick(org, e)}
                    disabled={!connected || joinLoading === org.account.orgId}
                    className={`w-full py-2.5 px-4 rounded-lg text-sm font-medium transition-colors ${
                      !connected 
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : joinLoading === org.account.orgId
                        ? 'bg-green-400 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    {joinLoading === org.account.orgId ? 'Joining...' : 'Join Organization'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Join Organization Modal */}
      {showJoinModal && selectedOrg && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold mb-4">
              Join {selectedOrg.account.name}
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Your Name
                </label>
                <input
                  type="text"
                  value={employeeDetails.name}
                  onChange={(e) => setEmployeeDetails(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter your full name"
                  disabled={joinLoading === selectedOrg.account.orgId}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Position
                </label>
                <input
                  type="text"
                  value={employeeDetails.position}
                  onChange={(e) => setEmployeeDetails(prev => ({ ...prev, position: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g., Software Engineer, Designer"
                  disabled={joinLoading === selectedOrg.account.orgId}
                />
              </div>
            </div>
            
            <div className="flex gap-3 mt-6">
              <button
                onClick={handleModalClose}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                disabled={joinLoading === selectedOrg.account.orgId}
              >
                Cancel
              </button>
              <button
                onClick={handleJoinSubmit}
                disabled={joinLoading === selectedOrg.account.orgId || !employeeDetails.name.trim() || !employeeDetails.position.trim()}
                className={`flex-1 py-2 px-4 rounded-md text-white ${
                  joinLoading === selectedOrg.account.orgId
                    ? 'bg-green-400 cursor-not-allowed'
                    : 'bg-green-600 hover:bg-green-700'
                }`}
              >
                {joinLoading === selectedOrg.account.orgId ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Joining...
                  </div>
                ) : (
                  'Join Organization'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrganizationsPage;
