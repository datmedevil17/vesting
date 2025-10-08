"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

interface Organization {
  orgId: string;
  name: string;
  owner: string;
  totalEmployees: string;
  totalVestingSchedules: string;
  createdAt: string;
  active: boolean;
}

interface ApiResponse {
  success: boolean;
  data?: Organization;
  error?: string;
}

const OrganizationDetailPage = () => {
  const params = useParams();
  const router = useRouter();
  const orgId = params.orgId as string;
  
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrganization = async () => {
      if (!orgId) return;
      
      try {
        setLoading(true);
        setError(null);
        
        console.log("Frontend: Fetching organization for orgId:", orgId);
        const response = await fetch(`/api/organizations/${orgId}`);
        console.log("Frontend: Response status:", response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Frontend: HTTP error:", response.status, errorText);
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data: ApiResponse = await response.json();
        console.log("Frontend: Raw response data:", JSON.stringify(data, null, 2));
        
        if (data.success && data.data) {
          console.log("Frontend: Organization object:", JSON.stringify(data.data, null, 2));
          setOrganization(data.data);
        } else {
          console.error("Frontend: API returned unsuccessful response or no data");
          setError(data.error || 'Organization not found');
        }
      } catch (err) {
        console.error('Frontend: Error fetching organization:', err);
        setError('Failed to fetch organization details');
      } finally {
        setLoading(false);
      }
    };

    fetchOrganization();
  }, [orgId]);

  if (loading) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-center">Loading organization details...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
        <button
          onClick={() => router.push('/organizations')}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Back to Organizations
        </button>
      </div>
    );
  }

  if (!organization) {
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <div className="text-gray-500">Organization not found</div>
        <button
          onClick={() => router.push('/organizations')}
          className="mt-4 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Back to Organizations
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pt-20">
      <div className="mb-6">
        <button
          onClick={() => router.back()}
          className="mb-4 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back
        </button>
        <h1 className="text-3xl font-bold text-gray-900">
          {organization.name}
        </h1>
      </div>

      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900">
            Organization Details
          </h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Complete information about this organization.
          </p>
        </div>
        <div className="border-t border-gray-200">
          <dl>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Organization ID</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {organization.orgId}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Name</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {organization.name}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Owner</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2 font-mono">
                {organization.owner}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Employees</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {organization.totalEmployees}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Total Vesting Schedules</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {organization.totalVestingSchedules}
              </dd>
            </div>
            <div className="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Created At</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                {organization.createdAt}
              </dd>
            </div>
            <div className="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
              <dt className="text-sm font-medium text-gray-500">Status</dt>
              <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  organization.active 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {organization.active ? 'Active' : 'Inactive'}
                </span>
              </dd>
            </div>
          </dl>
        </div>
      </div>

      <div className="mt-6 flex gap-4">
        <button
          onClick={() => router.push(`/organizations/${orgId}/employees`)}
          className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700"
        >
          Manage Employees
        </button>
        <button
          onClick={() => router.push(`/organizations/${orgId}/vesting`)}
          className="bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700"
        >
          Vesting Schedules
        </button>
        <button
          onClick={() => router.push('/organizations')}
          className="bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
        >
          All Organizations
        </button>
      </div>
    </div>
  );
};

export default OrganizationDetailPage;