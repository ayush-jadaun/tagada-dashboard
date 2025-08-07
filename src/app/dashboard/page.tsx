'use client';

import { useState, useEffect } from 'react';
import { Upload, Building2, Phone, CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function Dashboard() {
  // State management
  const [companies, setCompanies] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState('');
  const [newCompany, setNewCompany] = useState({ name: '', email: '' });
  const [selectedFile, setSelectedFile] = useState(null);
  const [campaignId, setCampaignId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Fetch companies on component mount
  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    try {
      const response = await fetch('/api/companies');
      if (response.ok) {
        const data = await response.json();
        setCompanies(data);
      }
    } catch (error) {
      showMessage('error', 'Failed to fetch companies');
    }
  };

  const showMessage = (type, text) => {
    setMessage({ type, text });
    setTimeout(() => setMessage({ type: '', text: '' }), 5000);
  };

  const handleCreateCompany = async (e) => {
    e.preventDefault();
    
    if (!newCompany.name.trim() || !newCompany.email.trim()) {
      showMessage('error', 'Please fill in both company name and email');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/company', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newCompany),
      });

      if (response.ok) {
        const data = await response.json();
        setCompanies([...companies, data]);
        setNewCompany({ name: '', email: '' });
        showMessage('success', 'Company created successfully!');
      } else {
        showMessage('error', 'Failed to create company');
      }
    } catch (error) {
      showMessage('error', 'Error creating company');
    }
    setIsLoading(false);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type === 'text/csv') {
      setSelectedFile(file);
      setCampaignId(''); // Reset campaign ID when new file is selected
    } else {
      showMessage('error', 'Please select a valid CSV file');
      e.target.value = '';
    }
  };

  const handleUploadCSV = async () => {
    if (!selectedFile) {
      showMessage('error', 'Please select a CSV file');
      return;
    }

    if (!selectedCompanyId) {
      showMessage('error', 'Please select a company');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);
      formData.append('companyId', selectedCompanyId);

      const response = await fetch('/api/upload-csv', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        setCampaignId(data.campaignId);
        showMessage('success', 'CSV uploaded successfully! Campaign ID generated.');
      } else {
        showMessage('error', 'Failed to upload CSV file');
      }
    } catch (error) {
      showMessage('error', 'Error uploading CSV file');
    }
    setIsLoading(false);
  };

  const handleStartCampaign = async () => {
    if (!campaignId) {
      showMessage('error', 'No campaign ID available');
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch('/api/start-campaign', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ campaignId }),
      });

      if (response.ok) {
        showMessage('success', 'Campaign started successfully!');
        // Reset form after successful campaign start
        setSelectedFile(null);
        setCampaignId('');
        document.getElementById('csv-upload').value = '';
      } else {
        showMessage('error', 'Failed to start campaign');
      }
    } catch (error) {
      showMessage('error', 'Error starting campaign');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Voice Campaign Dashboard</h1>
          <p className="text-gray-600">Manage companies and launch voice campaigns</p>
        </div>

        {/* Status Message */}
        {message.text && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5" />
            ) : (
              <XCircle className="w-5 h-5" />
            )}
            <span className="font-medium">{message.text}</span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Create Company Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="w-6 h-6 text-blue-600" />
              <h2 className="text-xl font-semibold text-gray-900">Create New Company</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={newCompany.name}
                  onChange={(e) => setNewCompany({ ...newCompany, name: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company name"
                />
              </div>

              <div>
                <label htmlFor="company-email" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Email
                </label>
                <input
                  id="company-email"
                  type="email"
                  value={newCompany.email}
                  onChange={(e) => setNewCompany({ ...newCompany, email: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter company email"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleCreateCompany(e);
                    }
                  }}
                />
              </div>

              <button
                onClick={handleCreateCompany}
                disabled={isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Create Company
              </button>
            </div>
          </div>

          {/* Campaign Management Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <div className="flex items-center gap-3 mb-6">
              <Phone className="w-6 h-6 text-green-600" />
              <h2 className="text-xl font-semibold text-gray-900">Campaign Management</h2>
            </div>

            <div className="space-y-4">
              {/* Company Selection */}
              <div>
                <label htmlFor="company-select" className="block text-sm font-medium text-gray-700 mb-2">
                  Select Company
                </label>
                <select
                  id="company-select"
                  value={selectedCompanyId}
                  onChange={(e) => setSelectedCompanyId(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="">Choose a company...</option>
                  {companies.map((company) => (
                    <option key={company.id} value={company.id}>
                      {company.name} ({company.email})
                    </option>
                  ))}
                </select>
              </div>

              {/* File Upload */}
              <div>
                <label htmlFor="csv-upload" className="block text-sm font-medium text-gray-700 mb-2">
                  Upload CSV File
                </label>
                <div className="relative">
                  <input
                    id="csv-upload"
                    type="file"
                    accept=".csv"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-sm file:font-medium file:bg-green-50 file:text-green-700 hover:file:bg-green-100"
                  />
                </div>
                {selectedFile && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedFile.name}
                  </p>
                )}
              </div>

              {/* Upload CSV Button */}
              <button
                onClick={handleUploadCSV}
                disabled={isLoading || !selectedFile || !selectedCompanyId}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <Upload className="w-4 h-4" />
                {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                Upload CSV
              </button>

              {/* Campaign ID Display */}
              {campaignId && (
                <div className="bg-gray-50 rounded-lg p-4 border">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                    <span className="font-medium text-gray-900">Campaign Ready</span>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">
                    Campaign ID: <code className="bg-gray-200 px-2 py-1 rounded text-sm font-mono">{campaignId}</code>
                  </p>

                  <button
                    onClick={handleStartCampaign}
                    disabled={isLoading}
                    className="w-full bg-purple-600 text-white py-2 px-4 rounded-lg hover:bg-purple-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    <Phone className="w-4 h-4" />
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                    Start Campaign
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Companies List */}
        {companies.length > 0 && (
          <div className="mt-8 bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Existing Companies ({companies.length})</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {companies.map((company) => (
                <div key={company.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-start gap-3">
                    <Building2 className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium text-gray-900 truncate">{company.name}</h4>
                      <p className="text-sm text-gray-600 truncate">{company.email}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}