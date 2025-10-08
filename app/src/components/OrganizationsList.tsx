"use client";

import React, { useState, useEffect } from 'react';

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

interface OrganizationsListProps {
  refreshTrigger?: number; // Optional prop to trigger refresh from parent
}

const OrganizationsList: React.FC<OrganizationsListProps> = ({ refreshTrigger }) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchOrganizations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/organizations');
      const data: ApiResponse = await response.json();
      
      if (data.success && data.data) {
        setOrganizations(data.data);
      } else {
        setOrganizations([]);
      }
    } catch (error) {
      console.error('Error fetching organizations:', error);
      setOrganizations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [refreshTrigger]);

  return (
    <div>
      <h2 className="text-lg font-semibold mb-4">Existing Organizations</h2>
      
      {loading ? (
        <div>Loading organizations...</div>
      ) : organizations.length === 0 ? (
        <div className="text-gray-500">No organizations found.</div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {organizations.map((org, index) => (
            <div key={org.publicKey || index} className="border rounded-lg p-3 shadow-sm">
              <h3 className="font-medium">{org.account?.name || 'Unknown Organization'}</h3>
              <p className="text-sm text-gray-600">Owner: {org.account?.owner || 'Unknown'}</p>
              <p className="text-sm text-gray-600">ID: {org.account?.orgId || 'Unknown'}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrganizationsList;