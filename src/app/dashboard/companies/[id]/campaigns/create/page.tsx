// app/dashboard/companies/[id]/campaigns/create/page.tsx
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
  status: string
  csvFile: File | null
  csvUrl: string
  total_contacts: number
  vapiCampaignId: string
}

export default function CreateCampaignPage({ params }: CreateCampaignPageProps) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadingCsv, setUploadingCsv] = useState(false)

  const [formData, setFormData] = useState<CampaignFormData>({
    name: '',
    description: '',
    status: 'draft',
    csvFile: null,
    csvUrl: '',
    total_contacts: 0,
    vapiCampaignId: ''
  })

  const router = useRouter()

  useEffect(() => {
    fetchCompanyDetails()
  }, [params.id])

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/companies/${params.id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch company details')
      }
      const companyData = await response.json()
      setCompany(companyData)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company details')
    } finally {
      setLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.name.endsWith('.csv')) {
      setError('Please select a valid CSV file')
      return
    }

    setFormData(prev => ({ ...prev, csvFile: file }))
    
    // Auto-count contacts from CSV
    try {
      const text = await file.text()
      const lines = text.split('\n').filter(line => line.trim())
      const contactCount = Math.max(0, lines.length - 1) // Subtract header row
      setFormData(prev => ({ ...prev, total_contacts: contactCount }))
    } catch (err) {
      console.error('Error reading CSV file:', err)
    }
  }

  const uploadCsvFile = async (file: File): Promise<string> => {
    const formData = new FormData()
    formData.append('csv', file)
    formData.append('companyId', params.id)

    const response = await fetch('/api/upload-csv', {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to upload CSV file')
    }

    const data = await response.json()
    return data.csvUrl
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      let csvUrl = formData.csvUrl

      // Upload CSV file if one was selected
      if (formData.csvFile) {
        setUploadingCsv(true)
        csvUrl = await uploadCsvFile(formData.csvFile)
        setUploadingCsv(false)
      }

      // Create campaign
      const campaignData = {
        name: formData.name,
        description: formData.description,
        status: formData.status,
        csvUrl,
        total_contacts: formData.total_contacts,
        vapiCampaignId: formData.vapiCampaignId,
        company_id: params.id
      }

      const response = await fetch(`/api/companies/${params.id}/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(campaignData)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to create campaign')
      }

      const newCampaign = await response.json()
      
      // Redirect to campaign detail page
      router.push(`/dashboard/companies/${params.id}/campaigns/${newCampaign._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setSubmitting(false)
      setUploadingCsv(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  if (error && !company) {
    return (
      <div className="px-4 py-6 sm:px-0">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
          <button
            onClick={() => router.push('/dashboard/companies')}
            className="mt-2 text-sm text-red-600 hover:text-red-800"
          >
            ← Back to Companies
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      {/* Breadcrumb */}
      <nav className="flex mb-6" aria-label="Breadcrumb">
        <ol className="inline-flex items-center space-x-1 md:space-x-3">
          <li className="inline-flex items-center">
            <Link href="/dashboard/companies" className="text-gray-700 hover:text-gray-900">
              Companies
            </Link>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <Link href={`/dashboard/companies/${params.id}`} className="ml-1 text-gray-700 hover:text-gray-900 md:ml-2">
                {company?.name}
              </Link>
            </div>
          </li>
          <li>
            <div className="flex items-center">
              <svg className="w-6 h-6 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
              <span className="ml-1 text-gray-500 md:ml-2">Create Campaign</span>
            </div>
          </li>
        </ol>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Create VAPI AI Campaign</h1>
        <p className="text-gray-600 mt-2">
          Create a new VAPI AI campaign for {company?.name}
        </p>
      </div>

      {/* Error Alert */}
      {error && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-md p-4">
          <div className="text-red-700">{error}</div>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Campaign Details</h2>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {/* Campaign Name */}
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Campaign Name *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                required
                value={formData.name}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter campaign name"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter campaign description"
              />
            </div>

            {/* Status */}
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              >
                <option value="draft">Draft</option>
                <option value="active">Active</option>
                <option value="paused">Paused</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* VAPI Campaign ID */}
            <div>
              <label htmlFor="vapiCampaignId" className="block text-sm font-medium text-gray-700">
                VAPI Campaign ID
              </label>
              <input
                type="text"
                id="vapiCampaignId"
                name="vapiCampaignId"
                value={formData.vapiCampaignId}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Enter VAPI campaign ID (optional)"
              />
              <p className="mt-1 text-sm text-gray-500">
                Link this campaign to an existing VAPI campaign
              </p>
            </div>
          </div>
        </div>

        {/* Contacts Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">Contact List</h2>
          </div>
          
          <div className="px-6 py-4 space-y-6">
            {/* CSV File Upload */}
            <div>
              <label htmlFor="csvFile" className="block text-sm font-medium text-gray-700">
                Upload CSV File
              </label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md hover:border-gray-400">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-gray-600">
                    <label htmlFor="csvFile" className="relative cursor-pointer bg-white rounded-md font-medium text-blue-600 hover:text-blue-500">
                      <span>Upload a CSV file</span>
                      <input
                        id="csvFile"
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="sr-only"
                      />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-gray-500">CSV files only</p>
                  {formData.csvFile && (
                    <p className="text-sm text-green-600 mt-2">
                      Selected: {formData.csvFile.name}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* CSV URL (Alternative) */}
            <div>
              <label htmlFor="csvUrl" className="block text-sm font-medium text-gray-700">
                Or provide CSV URL
              </label>
              <input
                type="url"
                id="csvUrl"
                name="csvUrl"
                value={formData.csvUrl}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="https://example.com/contacts.csv"
              />
            </div>

            {/* Total Contacts */}
            <div>
              <label htmlFor="total_contacts" className="block text-sm font-medium text-gray-700">
                Total Contacts
              </label>
              <input
                type="number"
                id="total_contacts"
                name="total_contacts"
                min="0"
                value={formData.total_contacts}
                onChange={handleInputChange}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Number of contacts"
              />
              <p className="mt-1 text-sm text-gray-500">
                This will be auto-calculated when you upload a CSV file
              </p>
            </div>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-between">
          <Link
            href={`/dashboard/companies/${params.id}`}
            className="text-gray-600 hover:text-gray-900"
          >
            ← Back to {company?.name}
          </Link>
          
          <div className="flex space-x-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              Cancel
            </button>
            
            <button
              type="submit"
              disabled={submitting || uploadingCsv}
              className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  {uploadingCsv ? 'Uploading CSV...' : 'Creating Campaign...'}
                  <div className="inline-block ml-2 animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                </>
              ) : (
                'Create Campaign'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}