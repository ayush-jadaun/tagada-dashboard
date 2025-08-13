'use client'

import { JSX, useState } from 'react'
import { useRouter } from 'next/navigation'

interface CreateCompanyData {
  name: string
  email: string
  paymentLink: string
}

interface ApiResponse {
  _id: string
  name: string
  email?: string
  paymentLink?: string
  createdAt: string
}

interface ApiError {
  message?: string
  error?: string
}

export default function CreateCompanyPage(): JSX.Element {
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    email: '',
    paymentLink: ''
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const isValidUrl = (string: string): boolean => {
    if (!string) return true // Empty string is valid (optional field)
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const isValidEmail = (email: string): boolean => {
    if (!email) return true // Empty string is valid (optional field)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  const validateForm = (): string | null => {
    if (!formData.name.trim()) {
      return 'Company name is required'
    }
    
    if (formData.email && !isValidEmail(formData.email)) {
      return 'Please enter a valid email address'
    }
    
    if (formData.paymentLink && !isValidUrl(formData.paymentLink)) {
      return 'Please enter a valid payment URL'
    }
    
    return null
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault()
    
    const validationError = validateForm()
    if (validationError) {
      setError(validationError)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name: formData.name.trim(),
          email: formData.email.trim() || undefined,
          paymentLink: formData.paymentLink.trim() || undefined
        })
      })

      if (!response.ok) {
        const errorData: ApiError = await response.json().catch(() => ({}))
        throw new Error(errorData.message || errorData.error || 'Failed to create company')
      }

      const newCompany: ApiResponse = await response.json()
      router.push(`/dashboard/companies/${newCompany._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while creating the company')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = (): void => {
    router.push('/dashboard/')
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4">
            <button
              onClick={handleCancel}
              className="inline-flex items-center text-sm font-medium text-slate-600 hover:text-slate-900 transition-colors"
            >
              <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
              </svg>
              Back to Dashboard
            </button>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mt-4">Create New Company</h1>
          <p className="text-slate-600 mt-2">
            Add a new company to manage AI campaigns with Tagada AI.
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200">
          <form onSubmit={handleSubmit} className="divide-y divide-slate-200">
            {/* Form Fields */}
            <div className="p-8 space-y-6">
              {error && (
                <div className="rounded-xl bg-red-50 border border-red-200 p-4">
                  <div className="flex items-center space-x-3">
                    <svg className="h-5 w-5 text-red-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
                    </svg>
                    <div className="text-sm text-red-700 font-medium">{error}</div>
                  </div>
                </div>
              )}

              {/* Company Name */}
              <div>
                <label htmlFor="name" className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Name
                  <span className="text-red-500 ml-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  id="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="Enter company name"
                />
                <p className="text-xs text-slate-500 mt-1">This will be displayed across all campaigns and reports.</p>
              </div>

              {/* Email */}
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-slate-900 mb-2">
                  Company Email
                </label>
                <input
                  type="email"
                  name="email"
                  id="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full rounded-xl border border-slate-300 bg-white px-4 py-3 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  placeholder="company@example.com"
                />
                <p className="text-xs text-slate-500 mt-1">Optional. Used for notifications and communications.</p>
              </div>

              {/* Payment Link */}
              <div>
                <label htmlFor="paymentLink" className="block text-sm font-semibold text-slate-900 mb-2">
                  Payment Link
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-slate-400" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
                    </svg>
                  </div>
                  <input
                    type="url"
                    name="paymentLink"
                    id="paymentLink"
                    value={formData.paymentLink}
                    onChange={handleInputChange}
                    className="w-full rounded-xl border border-slate-300 bg-white pl-12 pr-4 py-3 text-slate-900 placeholder-slate-500 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                    placeholder="https://..."
                  />
                </div>
                <p className="text-xs text-slate-500 mt-1">Optional. Link to payment processing or billing system.</p>
              </div>
            </div>

            {/* Form Actions */}
            <div className="bg-slate-50 px-8 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-end space-y-3 sm:space-y-0 sm:space-x-3 rounded-b-2xl">
              <button
                type="button"
                onClick={handleCancel}
                className="inline-flex justify-center items-center px-6 py-3 border border-slate-300 rounded-xl text-sm font-semibold text-slate-700 bg-white hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex justify-center items-center px-6 py-3 border border-transparent rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                    </svg>
                    Create Company
                  </>
                )}
              </button>
            </div>
          </form>
        </div>

        {/* Info Cards */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-blue-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036.259a3.375 3.375 0 002.455 2.456z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-blue-900">AI-Powered Campaigns</h3>
                <p className="text-sm text-blue-700 mt-1">Create intelligent campaigns with advanced AI capabilities.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-xl p-6">
            <div className="flex items-center space-x-3">
              <div className="h-8 w-8 bg-green-100 rounded-lg flex items-center justify-center">
                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
                </svg>
              </div>
              <div>
                <h3 className="text-sm font-semibold text-green-900">Analytics & Insights</h3>
                <p className="text-sm text-green-700 mt-1">Track performance with detailed analytics and reporting.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}