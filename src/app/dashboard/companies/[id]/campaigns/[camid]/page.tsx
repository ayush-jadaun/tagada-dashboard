"use client"
import React, { useState, useEffect } from 'react';
import { Phone, Users, TrendingUp, Clock, CheckCircle, XCircle, AlertCircle, BarChart3, Eye, Pause, Play, Trash2 } from 'lucide-react';

const CampaignDetailPage = () => {
  const [campaignId] = useState('674b123456789abcdef12345'); // Mock campaign ID
  const [campaign, setCampaign] = useState(null);
  const [status, setStatus] = useState(null);
  const [calls, setCalls] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [callsPage, setCallsPage] = useState(1);
  const [callsPagination, setCallsPagination] = useState(null);

  // Mock data for demonstration
  const mockCampaign = {
    _id: campaignId,
    name: 'Q4 Sales Outreach Campaign',
    description: 'Automated sales calls to warm leads for Q4 product launch',
    status: 'active',
    total_contacts: 1250,
    createdAt: '2024-01-15T10:00:00Z',
    company_id: {
      name: 'TechCorp Solutions',
      _id: '674a123456789abcdef12344'
    },
    vapiCampaignId: 'vapi_674b123456789abcdef12345'
  };

  const mockStatus = {
    localStatus: 'active',
    vapiStatus: 'active',
    stats: {
      totalCalls: 485,
      completedCalls: 342,
      failedCalls: 28,
      inProgressCalls: 115
    },
    lastUpdated: new Date().toISOString()
  };

  const mockCalls = [
    {
      id: 'call_001',
      phoneNumber: '+1 (555) 123-4567',
      status: 'completed',
      duration: 245,
      createdAt: '2024-01-20T14:30:00Z',
      endedReason: 'customer-ended-call'
    },
    {
      id: 'call_002',
      phoneNumber: '+1 (555) 234-5678',
      status: 'failed',
      duration: 0,
      createdAt: '2024-01-20T14:25:00Z',
      endedReason: 'no-answer'
    },
    {
      id: 'call_003',
      phoneNumber: '+1 (555) 345-6789',
      status: 'in-progress',
      duration: 78,
      createdAt: '2024-01-20T14:40:00Z',
      endedReason: null
    },
    {
      id: 'call_004',
      phoneNumber: '+1 (555) 456-7890',
      status: 'completed',
      duration: 189,
      createdAt: '2024-01-20T14:20:00Z',
      endedReason: 'assistant-ended-call'
    },
    {
      id: 'call_005',
      phoneNumber: '+1 (555) 567-8901',
      status: 'completed',
      duration: 312,
      createdAt: '2024-01-20T14:15:00Z',
      endedReason: 'customer-ended-call'
    }
  ];

  const mockAnalytics = {
    campaign: {
      id: campaignId,
      name: 'Q4 Sales Outreach Campaign',
      description: 'Automated sales calls to warm leads for Q4 product launch',
      status: 'active',
      totalContacts: 1250,
      createdAt: '2024-01-15T10:00:00Z'
    },
    vapi: {
      totalCalls: 485,
      completedCalls: 342,
      failedCalls: 28,
      inProgressCalls: 115,
      averageCallDuration: 198.5,
      callsByHour: [12, 18, 25, 31, 28, 45, 52, 48, 38, 29, 22, 15],
      callsByStatus: {
        completed: 342,
        failed: 28,
        inProgress: 115
      }
    },
    summary: {
      totalCalls: 485,
      completedCalls: 342,
      failedCalls: 28,
      inProgressCalls: 115,
      averageCallDuration: 198.5,
      successRate: '70.52'
    }
  };

  useEffect(() => {
    // Simulate API calls
    const fetchData = async () => {
      setLoading(true);
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setCampaign(mockCampaign);
      setStatus(mockStatus);
      setCalls(mockCalls);
      setAnalytics(mockAnalytics);
      setCallsPagination({
        page: 1,
        limit: 10,
        total: 485,
        totalPages: 49
      });
      
      setLoading(false);
    };

    fetchData();
  }, [campaignId]);

  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
      case 'in-progress':
        return <Clock className="w-4 h-4 text-blue-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800`;
      case 'paused':
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case 'completed':
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{campaign?.name}</h1>
                <p className="text-gray-600 mt-1">{campaign?.description}</p>
                <div className="flex items-center space-x-4 mt-3">
                  <span className={getStatusBadge(campaign?.status)}>
                    {campaign?.status?.charAt(0).toUpperCase() + campaign?.status?.slice(1)}
                  </span>
                  <span className="text-sm text-gray-500">
                    Company: {campaign?.company_id?.name}
                  </span>
                  <span className="text-sm text-gray-500">
                    Created: {formatDate(campaign?.createdAt)}
                  </span>
                </div>
              </div>
              <div className="flex space-x-2">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </button>
                <button className="flex items-center px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition-colors">
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </button>
                <button className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors">
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Phone className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">{status?.stats?.totalCalls || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-gray-900">{status?.stats?.completedCalls || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-blue-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">In Progress</p>
                <p className="text-2xl font-bold text-gray-900">{status?.stats?.inProgressCalls || 0}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center">
              <TrendingUp className="w-8 h-8 text-green-600" />
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Success Rate</p>
                <p className="text-2xl font-bold text-gray-900">{analytics?.summary?.successRate}%</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8 px-6">
              {[
                { id: 'overview', name: 'Overview', icon: BarChart3 },
                { id: 'calls', name: 'Call History', icon: Phone },
                { id: 'analytics', name: 'Analytics', icon: TrendingUp }
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{tab.name}</span>
                  </button>
                );
              })}
            </nav>
          </div>

          <div className="p-6">
            {/* Overview Tab */}
            {activeTab === 'overview' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Campaign Information</h3>
                    <dl className="space-y-3">
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Campaign ID</dt>
                        <dd className="text-sm text-gray-900">{campaign?._id}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">VAPI Campaign ID</dt>
                        <dd className="text-sm text-gray-900">{campaign?.vapiCampaignId}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Total Contacts</dt>
                        <dd className="text-sm text-gray-900">{campaign?.total_contacts?.toLocaleString()}</dd>
                      </div>
                      <div>
                        <dt className="text-sm font-medium text-gray-500">Average Call Duration</dt>
                        <dd className="text-sm text-gray-900">{formatDuration(analytics?.summary?.averageCallDuration || 0)}</dd>
                      </div>
                    </dl>
                  </div>
                  
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Status Sync</h3>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">Local Status</span>
                        <span className={getStatusBadge(status?.localStatus)}>
                          {status?.localStatus}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="text-sm font-medium text-gray-600">VAPI Status</span>
                        <span className={getStatusBadge(status?.vapiStatus)}>
                          {status?.vapiStatus}
                        </span>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {formatDate(status?.lastUpdated)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Calls Tab */}
            {activeTab === 'calls' && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-medium text-gray-900">Call History</h3>
                  <div className="text-sm text-gray-500">
                    Showing {calls.length} of {callsPagination?.total} calls
                  </div>
                </div>
                
                <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
                  <table className="min-w-full divide-y divide-gray-300">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Phone Number
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Duration
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Started At
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          End Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {calls.map((call) => (
                        <tr key={call.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                            {call.phoneNumber}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center space-x-2">
                              {getStatusIcon(call.status)}
                              <span className="text-sm text-gray-900 capitalize">
                                {call.status.replace('-', ' ')}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {call.duration > 0 ? formatDuration(call.duration) : '--'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDate(call.createdAt)}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {call.endedReason ? call.endedReason.replace('-', ' ') : '--'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Pagination */}
                <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4">
                  <div className="flex-1 flex justify-between sm:hidden">
                    <button className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Previous
                    </button>
                    <button className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50">
                      Next
                    </button>
                  </div>
                  <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm text-gray-700">
                        Showing page <span className="font-medium">{callsPagination?.page}</span> of{' '}
                        <span className="font-medium">{callsPagination?.totalPages}</span>
                      </p>
                    </div>
                    <div>
                      <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                        <button className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          Previous
                        </button>
                        <button className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50">
                          Next
                        </button>
                      </nav>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                <h3 className="text-lg font-medium text-gray-900">Campaign Analytics</h3>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Call Distribution</h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Completed</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics?.vapi?.completedCalls} ({((analytics?.vapi?.completedCalls / analytics?.vapi?.totalCalls) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">In Progress</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics?.vapi?.inProgressCalls} ({((analytics?.vapi?.inProgressCalls / analytics?.vapi?.totalCalls) * 100).toFixed(1)}%)
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                          <span className="text-sm text-gray-700">Failed</span>
                        </div>
                        <span className="text-sm font-medium text-gray-900">
                          {analytics?.vapi?.failedCalls} ({((analytics?.vapi?.failedCalls / analytics?.vapi?.totalCalls) * 100).toFixed(1)}%)
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Performance Metrics</h4>
                    <dl className="space-y-3">
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Success Rate</dt>
                        <dd className="text-sm font-medium text-gray-900">{analytics?.summary?.successRate}%</dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Avg Call Duration</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {formatDuration(analytics?.summary?.averageCallDuration)}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Total Contacts</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {campaign?.total_contacts?.toLocaleString()}
                        </dd>
                      </div>
                      <div className="flex justify-between">
                        <dt className="text-sm text-gray-600">Coverage</dt>
                        <dd className="text-sm font-medium text-gray-900">
                          {((analytics?.vapi?.totalCalls / campaign?.total_contacts) * 100).toFixed(1)}%
                        </dd>
                      </div>
                    </dl>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;