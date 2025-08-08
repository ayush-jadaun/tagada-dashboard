// app/dashboard/companies/create/page.tsx
'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { CreateCompanyData } from '@/types'

export default function CreateCompanyPage() {
  const [formData, setFormData] = useState<CreateCompanyData>({
    name: '',
    email: '',
    paymentLink: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.name.trim()) {
      setError('Company name is required')
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
        const errorData = await response.json()
        throw new Error(errorData.message || 'Failed to create company')
      }

      const newCompany = await response.json()
      router.push(`/dashboard/companies/${newCompany._id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    router.push('/dashboard/companies')
  }

  return (
    <div className="px-4 py-6 sm:px-0">
      <div className="md:grid md:grid-cols-3 md:gap-6">
        <div className="md:col-span-1">
          <div className="px-4 sm:px-0">
            <h3 className="text-lg font-medium leading-6 text-gray-900">Create Company</h3>
            <p className="mt-1 text-sm text-gray-600">
              Add a new company to manage VAPI AI campaigns.
            </p>
          </div>
        </div>
        
        <div className="mt-5 md:col-span-2 md:mt-0">
          <form onSubmit={handleSubmit}>
            <div className="shadow sm:overflow-hidden sm:rounded-md">
              <div className="space-y-6 bg-white px-4 py-5 sm:p-6">
                {error && (
                  <div className="rounded-md bg-red-50 p-4">
                    <div className="text-sm text-red-700">{error}</div>
                  </div>
                )}

                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                    Company Name *
                  </label>
                  <input
                    type="text"
                    name="name"
                    id="name"
                    required
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="Enter company name"
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    id="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="company@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="paymentLink" className="block text-sm font-medium text-gray-700">
                    Payment Link
                  </label>
                  <input
                    type="url"
                    name="paymentLink"
                    id="paymentLink"
                    value={formData.paymentLink}
                    onChange={handleInputChange}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm px-3 py-2 border"
                    placeholder="https://..."
                  />
                  <p className="mt-2 text-sm text-gray-500">
                    Optional payment link for this company
                  </p>
                </div>
              </div>

              <div className="bg-gray-50 px-4 py-3 text-right sm:px-6 space-x-3">
                <button
                  type="button"
                  onClick={handleCancel}
                  className="inline-flex justify-center rounded-md border border-gray-300 bg-white py-2 px-4 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 py-2 px-4 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Company'}
                </button>
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}