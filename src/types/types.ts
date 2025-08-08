// types/index.ts
export interface Company {
  _id: string
  name: string
  email?: string
  createdAt: string
  campaigns: string[] // Array of campaign IDs
  paymentLink?: string
}

export interface Campaign {
  _id: string
  csvUrl?: string
  vapiCampaignId?: string
  createdAt: string
  description?: string
  name?: string
  status?: string
  total_contacts?: number
  company_id: string
}

export interface CreateCompanyData {
  name: string
  email?: string
  paymentLink?: string
}

export interface CreateCampaignData {
  name?: string
  description?: string
  status?: string
  csvUrl?: string
  vapiCampaignId?: string
  total_contacts?: number
}