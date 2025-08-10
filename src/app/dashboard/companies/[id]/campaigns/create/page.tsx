'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Company } from '@/types/types'

interface CreateCampaignPageProps {
  params: {
    id: string
  }
}

interface CampaignFormData {
  name: string
  description: string
  csvFile: File | null
  csvUrl: string
}

interface LoadingState {
  fetchingCompany: boolean
  uploadingCsv: boolean
  creatingCampaign: boolean
}

interface ApiError {
  error?: string
  message?: string
}

export default function CreateCampaignPage({ params }: CreateCampaignPageProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loadingState, setLoadingState] = useState<LoadingState>({
    fetchingCompany: true,
    uploadingCsv: false,
    creatingCampaign: false,
  })

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    csvFile: null,
    csvUrl: '',
  })

  const router = useRouter()

  const isSubmitting = loadingState.uploadingCsv || loadingState.creatingCampaign

  useEffect(() => {
    fetchCompanyDetails()
  }, [params.id])

  const fetchCompanyDetails = async (): Promise<void> => {
    try {
      setLoadingState(prev => ({ ...prev, fetchingCompany: true }))
      const response = await fetch(`/api/companies/${params.id}`)
      
      if (!response.ok) {
        throw new Error('Failed to fetch company details')
      }
      
      const companyData: Company = await response.json()
      setCompany(companyData)
      setError(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch company details'
      setError(errorMessage)
    } finally {
      setLoadingState(prev => ({ ...prev, fetchingCompany: false }))
    }
  }

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ): void => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file')
      return
    }

    setError(null)
    setFormData(prev => ({ ...prev, csvFile: file, csvUrl: '' }))   
  }

  const uploadCsvFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('csv', file)
    formData.append('companyId', params.id)

    const response = await fetch('/api/campaigns/upload-csv', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      const errorData: ApiError = await response.json().catch(() => ({}))
      throw new Error(errorData.error || 'Failed to upload CSV file')
    }

    const data: { url: string } = await response.json()
    return data.url
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    setError(null)

    // Validation
    if (!formData.name.trim()) {
      setError('Campaign name is required')
      return
    }

    if (!formData.csvFile && !formData.csvUrl.trim()) {
      setError('Please provide either a CSV file or CSV URL')
      return
    }

    try {
      let csvUrl = formData.csvUrl

      // Upload CSV file if one was selected
      if (formData.csvFile) {
        setLoadingState(prev => ({ ...prev, uploadingCsv: true }))
        csvUrl = await uploadCsvFile(formData.csvFile)
        setLoadingState(prev => ({ ...prev, uploadingCsv: false }))
      }

      // Create campaign
      setLoadingState(prev => ({ ...prev, creatingCampaign: true }))
      
      const campaignData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        csvUrl,
        company_id: params.id
      }

      const response = await fetch('/api/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({}))
        throw new Error(errorData.error || 'Failed to create campaign')
      }

      const newCampaign: { campaign: { _id: string } } = await response.json()
      
      // Redirect to campaign detail page
      router.push(`/dashboard/companies/${params.id}/campaigns/${newCampaign.campaign._id}`)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred while creating the campaign'
      setError(errorMessage)
    } finally {
      setLoadingState(prev => ({ 
        ...prev, 
        uploadingCsv: false, 
        creatingCampaign: false 
      }))
    }
  }

  const removeSelectedFile = (): void => {
    setFormData(prev => ({ ...prev, csvFile: null }))
  }

  // Loading state for initial company fetch
  if (loadingState.fetchingCompany) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
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
  if (error && !company) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
          <div className="bg-red-50 border border-red-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-800 font-medium">{error}</div>
            </div>
            <button
              onClick={() => router.push('/dashboard/companies')}
              className="mt-4 inline-flex items-center text-sm font-medium text-red-600 hover:text-red-800 transition-colors"
            >
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Companies
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="flex mb-8" aria-label="Breadcrumb">
          <ol className="inline-flex items-center space-x-1 md:space-x-2">
            <li className="inline-flex items-center">
              <Link 
                href="/dashboard/companies" 
                className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
              >
                Companies
              </Link>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <Link 
                  href={`/dashboard/companies/${params.id}`} 
                  className="text-gray-500 hover:text-gray-700 text-sm font-medium transition-colors"
                >
                  {company?.name}
                </Link>
              </div>
            </li>
            <li>
              <div className="flex items-center">
                <svg className="w-4 h-4 text-gray-400 mx-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
                <span className="text-gray-700 text-sm font-medium">Create Campaign</span>
              </div>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Create VAPI AI Campaign</h1>
          <p className="text-gray-600 text-lg">
            Create a new VAPI AI campaign for <span className="font-semibold text-gray-900">{company?.name}</span>
          </p>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center space-x-3">
              <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="text-red-700 font-medium">{error}</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Campaign Details Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Campaign Details</h2>
              <p className="text-sm text-gray-600 mt-1">Basic information about your campaign</p>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              {/* Campaign Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-2">
                  Campaign Name *
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="Enter campaign name"
                  disabled={isSubmitting}
                />
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={formData.description}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="Describe your campaign goals and target audience"
                  disabled={isSubmitting}
                />
              </div>       
            </div>
          </div>

          {/* Contact List Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900">Contact List</h2>
              <p className="text-sm text-gray-600 mt-1">Upload your contact data as a CSV file or provide a URL</p>
            </div>
            
            <div className="px-6 py-6 space-y-6">
              {/* CSV File Upload */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Upload CSV File
                </label>
                
                {!formData.csvFile ? (
                  <div className="border-2 border-dashed border-gray-300 rounded-lg hover:border-gray-400 transition-colors">
                    <div className="px-6 py-8 text-center">
                      <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                        <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <div className="text-gray-600">
                        <label htmlFor="csvFile" className="cursor-pointer">
                          <span className="font-semibold text-blue-600 hover:text-blue-700">Choose a CSV file</span>
                          <span className="text-gray-500"> or drag and drop</span>
                          <input
                            id="csvFile"
                            type="file"
                            accept=".csv"
                            onChange={handleFileChange}
                            className="sr-only"
                            disabled={isSubmitting}
                          />
                        </label>
                      </div>
                      <p className="text-xs text-gray-400 mt-2">CSV files up to 10MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <svg className="h-8 w-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        <div>
                          <p className="font-medium text-green-800">{formData.csvFile.name}</p>
                          <p className="text-sm text-green-600">
                            {(formData.csvFile.size / 1024).toFixed(1)} KB
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={removeSelectedFile}
                        disabled={isSubmitting}
                        className="text-green-600 hover:text-green-800 disabled:opacity-50"
                      >
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* OR Divider */}
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-4 bg-white text-gray-500 font-medium">OR</span>
                </div>
              </div>

              {/* CSV URL */}
              <div>
                <label htmlFor="csvUrl" className="block text-sm font-semibold text-gray-700 mb-2">
                  Provide CSV URL
                </label>
                <input
                  type="url"
                  id="csvUrl"
                  name="csvUrl"
                  value={formData.csvUrl}
                  onChange={handleInputChange}
                  className="block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 text-gray-900 placeholder-gray-400 transition-colors"
                  placeholder="https://example.com/contacts.csv"
                  disabled={isSubmitting || !!formData.csvFile}
                />
                {formData.csvFile && (
                  <p className="mt-2 text-sm text-gray-500">URL input is disabled when a file is selected</p>
                )}
              </div>            
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex items-center justify-between pt-6">
            <Link
              href={`/dashboard/companies/${params.id}`}
              className="inline-flex items-center text-gray-600 hover:text-gray-900 font-medium transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to {company?.name}
            </Link>
            
            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => router.back()}
                disabled={isSubmitting}
                className="px-6 py-2 border border-gray-300 rounded-lg text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Cancel
              </button>
              
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors inline-flex items-center"
              >
                {loadingState.uploadingCsv ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-white mr-2"></div>
                    Uploading CSV...
                  </>
                ) : loadingState.creatingCampaign ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-200 border-t-white mr-2"></div>
                    Creating Campaign...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create Campaign
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}