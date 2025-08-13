'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Company } from '@/types/types'

interface LoadingState {
  fetchingCompanies: boolean
  navigatingToCompany: boolean
}

interface ApiError {
  message?: string
  error?: string
}

export default function ManageCompaniesPage() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    fetchingCompanies: true,
    navigatingToCompany: false,
  })
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null)
  
  const router = useRouter()

  useEffect(() => {
    fetchCompanies()
  }, [])

  const fetchCompanies = async (): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, fetchingCompanies: true }))
      setError(null)
      
      const response = await fetch('/api/companies')
      
      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || `Failed to fetch companies: ${response.statusText}`)
      }
      
      const data: Company[] = await response.json()
      setCompanies(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching companies'
      setError(errorMessage)
    } finally {
      setLoadingState(prev => ({ ...prev, fetchingCompanies: false }))
    }
  }

  const handleCompanyClick = async (companyId: string): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, navigatingToCompany: true }))
      setSelectedCompanyId(companyId)
      router.push(`/dashboard/companies/${companyId}`)
    } catch (err) {
      // Handle navigation error if needed
      setLoadingState(prev => ({ ...prev, navigatingToCompany: false }))
      setSelectedCompanyId(null)
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      })
    } catch (err) {
      return 'Invalid date'
    }
  }

  const getTotalCampaigns = (company: Company): number => {
    return company.campaigns?.length || 0
  }

  const handleRetryClick = (): void => {
    fetchCompanies()
  }

  // Loading state for initial fetch
  if (loadingState.fetchingCompanies) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-600 font-medium">Loading companies...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3 mb-4">
              <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <h3 className="text-lg font-semibold text-red-800">Error Loading Companies</h3>
                <p className="text-red-700 mt-1">{error}</p>
              </div>
            </div>
            <button
              onClick={handleRetryClick}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-red-600 hover:bg-red-700 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Try Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Companies</h1>
              <p className="text-gray-600 mt-2">
                Manage your companies and their VAPI AI campaigns.
              </p>
            </div>
            <Link
              href="/dashboard/create"
              className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Company
            </Link>
          </div>
        </div>

        {/* Companies Content */}
        {companies.length === 0 ? (
          // Empty State
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
            <div className="text-center max-w-md mx-auto">
              <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No companies yet</h3>
              <p className="text-gray-600 mb-8">
                Get started by creating your first company to manage VAPI AI campaigns effectively.
              </p>
              <Link
                href="/dashboard/companies/create"
                className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create Your First Company
              </Link>
            </div>
          </div>
        ) : (
          // Companies Grid
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map((company) => (
              <div
                key={company._id}
                className={`bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-md transition-all cursor-pointer overflow-hidden ${
                  loadingState.navigatingToCompany && selectedCompanyId === company._id 
                    ? 'ring-2 ring-blue-500 bg-blue-50' 
                    : 'hover:border-gray-300'
                }`}
                onClick={() => handleCompanyClick(company._id)}
              >
                {loadingState.navigatingToCompany && selectedCompanyId === company._id && (
                  <div className="bg-blue-100 px-6 py-3 border-b border-blue-200">
                    <div className="flex items-center space-x-2 text-blue-700">
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-300 border-t-blue-700"></div>
                      <span className="text-sm font-medium">Loading company...</span>
                    </div>
                  </div>
                )}
                
                <div className="p-6">
                  <div className="flex items-start space-x-3">
                    <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-gray-900 truncate mb-1">
                        {company.name}
                      </h3>
                      {company.email && (
                        <p className="text-sm text-gray-600 truncate mb-2">{company.email}</p>
                      )}
                      {company.paymentLink && (
                        <div className="flex items-center space-x-1 mb-3">
                          <svg className="h-4 w-4 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-sm text-green-700 font-medium">Payment link available</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                          </svg>
                          <span>{getTotalCampaigns(company)} campaigns</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                          </svg>
                          <span>{formatDate(company.createdAt)}</span>
                        </div>
                      </div>
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {companies.length > 0 && (
          <div className="mt-8 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0">
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">{companies.length}</span> 
                {' '}company{companies.length !== 1 ? 'ies' : ''} total
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium text-gray-900">
                  {companies.reduce((acc, company) => acc + getTotalCampaigns(company), 0)}
                </span>
                {' '}total campaigns across all companies
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}