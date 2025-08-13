'use client'

import { JSX, useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { Company, Campaign } from '@/types/types'

interface LoadingState {
  fetchingCompany: boolean
  navigatingToCampaign: boolean
}

interface ApiError {
  error?: string
  message?: string
}

export default function CompanyDetailPage() {
  const [company, setCompany] = useState<Company | null>(null)
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [error, setError] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    fetchingCompany: true,
    navigatingToCampaign: false,
  })
  const [selectedCampaignId, setSelectedCampaignId] = useState<string | null>(null)

  const router = useRouter()
  const params = useParams()

  useEffect(() => {
    if (params.id) {
      fetchCompanyDetails()
    }
  }, [params.id])

  const fetchCompanyDetails = async (): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, fetchingCompany: true }))
      setError(null)
      
      // Fetch company details
      const companyResponse = await fetch(`/api/companies/${params.id}`)
      if (!companyResponse.ok) {
        const errorData: ApiError = await companyResponse.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to fetch company details')
      }
      
      const companyData: Company = await companyResponse.json()
      setCompany(companyData)
      
      // Set campaigns for this company
      
      const campaignsData:Campaign[] = companyData.campaigns || []
      setCampaigns(campaignsData)
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while fetching company details'
      setError(errorMessage)
    } finally {
      setLoadingState(prev => ({ ...prev, fetchingCompany: false }))
    }
  }

  const handleCampaignClick = async (campaignId: string): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, navigatingToCampaign: true }))
      setSelectedCampaignId(campaignId)
      router.push(`/dashboard/companies/${params.id}/campaigns/${campaignId}`)
    } catch (err) {
      // Handle navigation error if needed
      setLoadingState(prev => ({ ...prev, navigatingToCampaign: false }))
      setSelectedCampaignId(null)
    }
  }

  const formatDate = (dateString: string): string => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (err) {
      return 'Invalid date'
    }
  }

  const getStatusBadge = (status?: string): JSX.Element | null => {
    if (!status) return null
    
    const statusConfig = {
      active: { 
        bgColor: 'bg-green-50', 
        textColor: 'text-green-700', 
        borderColor: 'border-green-200',
        icon: '●'
      },
      paused: { 
        bgColor: 'bg-yellow-50', 
        textColor: 'text-yellow-700', 
        borderColor: 'border-yellow-200',
        icon: '⏸'
      },
      completed: { 
        bgColor: 'bg-blue-50', 
        textColor: 'text-blue-700', 
        borderColor: 'border-blue-200',
        icon: '✓'
      },
      draft: { 
        bgColor: 'bg-gray-50', 
        textColor: 'text-gray-700', 
        borderColor: 'border-gray-200',
        icon: '📝'
      }
    }

    const config = statusConfig[status as keyof typeof statusConfig] || statusConfig.draft

    return (
      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        <span className="mr-1">{config.icon}</span>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  // Loading state for initial company fetch
  if (loadingState.fetchingCompany) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-blue-200 border-t-blue-600"></div>
              <p className="text-gray-600 font-medium">Loading company details...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Error state when company couldn't be loaded
  if (error || !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-800 font-medium">{error || 'Company not found'}</div>
            </div>
            <button
              onClick={() => router.push('/dashboard/')}
              className="mt-4 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to DashBoard
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link 
                href="/dashboard/" 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
DashBoard              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">{company.name}</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Company Header */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 mb-8 overflow-hidden">
          <div className="px-8 py-6">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between space-y-4 lg:space-y-0">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900">{company.name}</h1>
                    {company.email && (
                      <p className="text-gray-600 mt-1 font-medium">{company.email}</p>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                    </svg>
                    <span>Created {formatDate(company.createdAt)}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                    <span>{campaigns.length} campaign{campaigns.length !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
                {company.paymentLink && (
                  <a
                    href={company.paymentLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 transition-colors"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    Payment Link
                  </a>
                )}
                <Link
                  href={`/dashboard/companies/${params.id}/campaigns/create`}
                  className="inline-flex items-center justify-center px-6 py-2 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Campaign
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Campaigns Section */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-8 py-6 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">VAPI AI Campaigns</h2>
                <p className="text-sm text-gray-600 mt-1">
                  Manage and monitor your campaign performance
                </p>
              </div>
              <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                {campaigns.length} total
              </div>
            </div>
          </div>

          {campaigns.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div className="max-w-sm mx-auto">
                <div className="h-16 w-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg className="h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No campaigns yet</h3>
                <p className="text-gray-600 mb-6">
                  Get started by creating your first VAPI AI campaign to reach your customers effectively.
                </p>
                <Link
                  href={`/dashboard/companies/${params.id}/campaigns/create`}
                  className="inline-flex items-center px-6 py-3 border border-transparent rounded-lg text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-sm"
                >
                  <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Your First Campaign
                </Link>
              </div>
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {campaigns.map((campaign) => (
                <div
                  key={campaign._id}
                  className={`px-8 py-6 hover:bg-gray-50 cursor-pointer transition-colors relative ${
                    loadingState.navigatingToCampaign && selectedCampaignId === campaign._id 
                      ? 'bg-blue-50' 
                      : ''
                  }`}
                  onClick={() => handleCampaignClick(campaign._id)}
                >
                  {loadingState.navigatingToCampaign && selectedCampaignId === campaign._id && (
                    <div className="absolute inset-0 bg-blue-50 flex items-center justify-center">
                      <div className="flex items-center space-x-2 text-blue-600">
                        <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-blue-600"></div>
                        <span className="text-sm font-medium">Loading campaign...</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-base font-semibold text-gray-900 truncate">
                          {campaign.name || 'Untitled Campaign'}
                        </h3>
                        {getStatusBadge(campaign.status)}
                      </div>
                      
                      {campaign.description && (
                        <p className="text-gray-600 text-sm mb-3 line-clamp-2">{campaign.description}</p>
                      )}
                      
                      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3a1 1 0 011-1h6a1 1 0 011 1v4h3a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9a2 2 0 012-2h3z" />
                          </svg>
                          <span>Created {formatDate(campaign.createdAt)}</span>
                        </div>
                        
                        {campaign.total_contacts && (
                          <div className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                            <span>{campaign.total_contacts.toLocaleString()} contacts</span>
                          </div>
                        )}
                        
                        {campaign.vapiCampaignId && (
                          <div className="flex items-center space-x-1">
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a.997.997 0 01-1.414 0l-7-7A1.997 1.997 0 013 12V7a4 4 0 014-4z" />
                            </svg>
                            <span>VAPI ID: {campaign.vapiCampaignId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center ml-4">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}