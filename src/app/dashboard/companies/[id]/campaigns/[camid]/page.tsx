
/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState, useEffect } from "react";
import {
  Phone,
  Users,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  BarChart3,
  Eye,
  Calendar,
  Building,
} from "lucide-react";
import { useParams } from "next/navigation";
import { JSX } from "react/jsx-runtime";

interface Company {
  _id: string;
  name: string;
}

interface Campaign {
  _id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt?: string;
  status: string;
  total_contacts: number;
  company_id: Company;
  csvUrl?: string;
  vapiCampaignId?: string;
  vapiData?: {
    counters?: { [key: string]: number };
    endedReason?: string;
  };
  csv_stats?: {
    totalRows?: number;
    validContacts?: number;
    summary?: {
      totalAmount?: number;
      averageAmount?: number;
    };
  };
}

interface CallAnalytics {
  totalCalls?: number;
  answeredCalls?: number;
  unansweredCalls?: number;
  successfulCalls?: number;
  answerRate?: number;
  successRate?: number;
  completionRate?: number;
  averageCallDuration?: number;
  totalCallDuration?: number;
}

interface OutcomeAnalytics {
  endReasonBreakdown?: { [key: string]: number };
  mostCommonEndReason?: string;
}

interface TimeBasedAnalytics {
  peakCallHour?: string;
  peakCallDay?: string;
}

interface Analytics {
  callAnalytics?: CallAnalytics;
  outcomeAnalytics?: OutcomeAnalytics;
  timeBasedAnalytics?: TimeBasedAnalytics;
  recentCalls?: any[];
  generatedAt?: string;
}

interface CallsData {
  calls?: any[];
  stats?: {
    totalCalls?: number;
    answeredCalls?: number;
    voicemailCalls?: number;
  };
  pagination?: {
    page?: number;
    totalPages?: number;
    total?: number;
  };
}

interface Status {
  localStatus?: string;
  vapiStatus?: string;
  lastUpdated?: string;
  stats?: {
    totalCalls?: number;
  };
}

interface CallData {
  id?: string;
  customer?: {
    name?: string;
    number?: string;
    assistantOverrides?: {
      variableValues?: {
        formattedAmount?: string;
      };
    };
  };
  status?: string;
  endedReason?: string;
}

const CampaignDetailPage: React.FC = () => {
  const params = useParams();
  const campaignId = params.camid as string;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [calls, setCalls] = useState<any[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCampaign = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}`);
      if (!response.ok) {
        throw new Error("Failed to fetch campaign details");
      }
      const campaignData: Campaign = await response.json();
      setCampaign(campaignData);
      console.log("campaign details:", campaignData);
    } catch (err) {
      console.error("Error fetching campaign:", err);
      throw err;
    }
  };

  const fetchCalls = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/calls`);
      if (!response.ok) {
        throw new Error("Failed to fetch calls data");
      }
      const callData: CallsData = await response.json();
      setCallsData(callData);
      setCalls(callData.calls || []);
      console.log("calls data:", callData);
    } catch (err) {
      console.error("Error fetching calls:", err);
      throw err;
    }
  };

  const fetchAnalytics = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/analytics`);
      if (!response.ok) {
        throw new Error("Failed to fetch analytics data");
      }
      const analyticsData: Analytics = await response.json();
      console.log("analytics details:", analyticsData);
      setAnalytics(analyticsData);
    } catch (err) {
      console.error("Error fetching analytics:", err);
      throw err;
    }
  };

  const fetchStatus = async (): Promise<void> => {
    try {
      const response = await fetch(`/api/campaigns/${campaignId}/status`);
      if (!response.ok) {
        throw new Error("Failed to fetch status data");
      }
      const statusData: Status = await response.json();
      console.log("status details:", statusData);
      setStatus(statusData);
    } catch (err) {
      console.error("Error fetching status:", err);
      throw err;
    }
  };

  useEffect(() => {
    const loadData = async (): Promise<void> => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all data concurrently
        await Promise.all([
          fetchCampaign(),
          fetchCalls(),
          fetchAnalytics(),
          fetchStatus(),
        ]);
      } catch (err) {
        console.error("Error loading data:", err);
        setError(
          err instanceof Error ? err.message : "An unexpected error occurred"
        );
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      loadData();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId]);

  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds === 0) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return` ${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return "--";
    return new Date(dateString).toLocaleString("en-IN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getStatusIcon = (status?: string): JSX.Element => {
    switch (status) {
      case "ended":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "in-progress":
      case "active":
        return <Clock className="w-4 h-4 text-blue-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status?: string): string => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium border";
    switch (status) {
      case "active":
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case "paused":
        return `${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`;
      case "ended":
        return` ${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case "failed":
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      default:
        return` ${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const parseCallData = (callString: any): CallData => {
    try {
      if (typeof callString === "string") {
        return JSON.parse(callString) as CallData;
      }
      return callString as CallData;
    } catch {
      return callString as CallData;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          <p className="text-gray-600">Loading campaign details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Error Loading Campaign
          </h3>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center space-y-4">
          <p className="text-gray-600 text-5xl">No campaign ...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  {campaign?.name || "Loading..."}
                </h1>
                <p className="text-gray-600 mt-2 text-lg">
                  {campaign?.description || "Loading description..."}
                </p>
                <div className="flex items-center flex-wrap gap-4 mt-4">
                  <span className={getStatusBadge(campaign?.status)}>
                    {campaign?.status?.charAt(0).toUpperCase() +
                      campaign?.status?.slice(1) || "Unknown"}
                  </span>
                  <div className="flex items-center text-sm text-gray-600">
                    <Building className="w-4 h-4 mr-1" />
                    {campaign?.company_id?.name || "N/A"}
                  </div>
                  <div className="flex items-center text-sm text-gray-600">
                    <Calendar className="w-4 h-4 mr-1" />
                    Created {formatDate(campaign?.createdAt)}
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm">
                  <Eye className="w-4 h-4 mr-2" />
                  View Details
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-blue-50 rounded-lg">
                <Phone className="w-6 h-6 text-blue-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Total Calls</p>
                <p className="text-2xl font-bold text-gray-900">
                  {callsData?.stats?.totalCalls ||
                    status?.stats?.totalCalls ||
                    0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Answered</p>
                <p className="text-2xl font-bold text-gray-900">
                  {callsData?.stats?.answeredCalls ||
                    analytics?.callAnalytics?.answeredCalls ||
                    0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-yellow-50 rounded-lg">
                <Users className="w-6 h-6 text-yellow-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Voicemails</p>
                <p className="text-2xl font-bold text-gray-900">
                  {callsData?.stats?.voicemailCalls ||
                    campaign?.vapiData?.counters?.endedVoicemail ||
                    0}
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="p-3 bg-purple-50 rounded-lg">
                <TrendingUp className="w-6 h-6 text-purple-600" />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-600">Answer Rate</p>
                <p className="text-2xl font-bold text-gray-900">
                  {analytics?.callAnalytics?.answerRate || 0}%
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              {[
                { id: "overview", name: "Overview", icon: BarChart3 },
                { id: "calls", name: "Call History", icon: Phone },
                { id: "analytics", name: "Analytics", icon: TrendingUp },
              ].map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`${
                      activeTab === tab.id
                        ? "border-blue-500 text-blue-600"
                        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                    } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors`}
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
            {activeTab === "overview" && (
              <div className="space-y-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Campaign Information
                    </h3>
                    <div className="bg-gray-50 rounded-lg p-6 space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            Campaign ID
                          </dt>
                          <dd className="text-sm text-gray-900 font-mono mt-1">
                            {campaign?._id || "N/A"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            VAPI Campaign ID
                          </dt>
                          <dd className="text-sm text-gray-900 font-mono mt-1">
                            {campaign?.vapiCampaignId || "N/A"}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            Total Contacts
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {campaign?.total_contacts?.toLocaleString() || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            Valid Contacts
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {campaign?.csv_stats?.validContacts || 0}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            Created At
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {formatDate(campaign?.createdAt)}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-sm font-medium text-gray-600">
                            Updated At
                          </dt>
                          <dd className="text-sm text-gray-900 mt-1">
                            {formatDate(campaign?.updatedAt)}
                          </dd>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Status & Sync
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            Local Status
                          </span>
                          <span className={getStatusBadge(status?.localStatus)}>
                            {status?.localStatus || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            VAPI Status
                          </span>
                          <span className={getStatusBadge(status?.vapiStatus)}>
                            {status?.vapiStatus || "Unknown"}
                          </span>
                        </div>
                      </div>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium text-gray-600">
                            End Reason
                          </span>
                          <span className="text-sm text-gray-900">
                            {campaign?.vapiData?.endedReason?.replace(
                              /\./g,
                              " "
                            ) || "--"}
                          </span>
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        Last updated: {formatDate(status?.lastUpdated)}
                      </div>
                    </div>
                  </div>
                </div>

                {/* VAPI Counters */}
                {campaign?.vapiData?.counters && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900">
                      Call Distribution
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                      {Object.entries(campaign.vapiData.counters).map(
                        ([key, value]) => (
                          <div
                            key={key}
                            className="bg-gray-50 rounded-lg p-4 text-center"
                          >
                            <div className="text-2xl font-bold text-gray-900">
                              {value}
                            </div>
                            <div className="text-sm text-gray-600 capitalize">
                              {key}
                            </div>
                          </div>
                        )
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Calls Tab */}
            {activeTab === "calls" && (
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Call History
                  </h3>
                  <div className="text-sm text-gray-600">
                    Showing {calls.length} of{" "}
                    {callsData?.pagination?.total || 0} calls
                  </div>
                </div>

                {!calls || calls.length === 0 ? (
                  <div className="text-center py-12">
                    <Phone className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No calls found
                    </h3>
                    <p className="text-gray-600">
                      This campaign hasn&apos;t made any calls yet.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 rounded-lg">
                    <table className="min-w-full divide-y divide-gray-300">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Phone Number
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Status
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            End Reason
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Amount
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {calls.map((callString, index) => {
                          const call = parseCallData(callString);
                          return (
                            <tr
                              key={call.id || index}
                              className="hover:bg-gray-50"
                            >
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="font-medium text-gray-900">
                                  {call.customer?.name || "--"}
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.customer?.number || "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(call.status)}
                                  <span className="text-sm text-gray-900 capitalize">
                                    {call.status?.replace("-", " ") ||
                                      "Unknown"}
                                  </span>
                                </div>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                {call.endedReason
                                  ? call.endedReason.replace("-", " ")
                                  : "--"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {call.customer?.assistantOverrides
                                  ?.variableValues?.formattedAmount || "--"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {callsData?.pagination &&
                  callsData.pagination.totalPages! > 1 && (
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
                            Showing page{" "}
                            <span className="font-medium">
                              {callsData.pagination.page}
                            </span>{" "}
                            of{" "}
                            <span className="font-medium">
                              {callsData.pagination.totalPages}
                            </span>
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === "analytics" && (
              <div className="space-y-8">
                <h3 className="text-lg font-semibold text-gray-900">
                  Campaign Analytics
                </h3>

                {!analytics ? (
                  <div className="text-center py-12">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                      No analytics available
                    </h3>
                    <p className="text-gray-600">
                      Analytics data is not yet available for this campaign.
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-6">
                          Call Analytics
                        </h4>
                        <div className="space-y-4">
                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                Total Calls
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.totalCalls || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                Answered
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.answeredCalls || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                Unanswered
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.unansweredCalls || 0}
                            </span>
                          </div>
                          <div className="flex items-center justify-between py-2">
                            <div className="flex items-center space-x-3">
                              <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                              <span className="text-sm text-gray-700">
                                Successful
                              </span>
                            </div>
                            <span className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.successfulCalls || 0}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-6">
                          Performance Metrics
                        </h4>
                        <dl className="space-y-4">
                          <div className="flex justify-between py-2">
                            <dt className="text-sm text-gray-600">
                              Answer Rate
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.answerRate || 0}%
                            </dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-sm text-gray-600">
                              Success Rate
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.successRate || 0}%
                            </dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-sm text-gray-600">
                              Completion Rate
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {analytics?.callAnalytics?.completionRate || 0}%
                            </dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-sm text-gray-600">
                              Avg Call Duration
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {formatDuration(
                                analytics?.callAnalytics?.averageCallDuration
                              )}
                            </dd>
                          </div>
                          <div className="flex justify-between py-2">
                            <dt className="text-sm text-gray-600">
                              Total Duration
                            </dt>
                            <dd className="text-sm font-medium text-gray-900">
                              {formatDuration(
                                analytics?.callAnalytics?.totalCallDuration
                              )}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    </div>

                    {/* End Reason Breakdown */}
                    {analytics?.outcomeAnalytics?.endReasonBreakdown && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-6">
                          End Reason Breakdown
                        </h4>
                        <div className="space-y-3">
                          {Object.entries(
                            analytics.outcomeAnalytics.endReasonBreakdown
                          ).map(([reason, count]) => (
                            <div
                              key={reason}
                              className="flex items-center justify-between py-2"
                            >
                              <span className="text-sm text-gray-700 capitalize">
                                {reason
                                  .replace("-", " ")
                                  .replace("customer", "Customer")
                                  .replace("assistant", "Assistant")}
                              </span>
                              <span className="text-sm font-medium text-gray-900">
                                {count}
                              </span>
                            </div>
                          ))}
                          {analytics?.outcomeAnalytics?.mostCommonEndReason && (
                            <div className="mt-4 pt-4 border-t border-gray-300">
                              <div className="flex justify-between">
                                <span className="text-sm font-medium text-gray-600">
                                  Most Common End Reason
                                </span>
                                <span className="text-sm font-medium text-gray-900 capitalize">
                                  {analytics.outcomeAnalytics.mostCommonEndReason.replace(
                                    "-",
                                    " "
                                  )}
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* Time-based Analytics */}
                    {(analytics?.timeBasedAnalytics?.peakCallHour !==
                      "Unknown" ||
                      analytics?.timeBasedAnalytics?.peakCallDay !==
                        "Unknown") && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-md font-medium text-gray-900 mb-4">
                            Peak Hours
                          </h4>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {analytics?.timeBasedAnalytics?.peakCallHour ||
                                "--"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Peak Call Hour
                            </div>
                          </div>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-md font-medium text-gray-900 mb-4">
                            Peak Day
                          </h4>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {analytics?.timeBasedAnalytics?.peakCallDay ||
                                "--"}
                            </div>
                            <div className="text-sm text-gray-600">
                              Peak Call Day
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Recent Calls Summary */}
                    {analytics?.recentCalls &&
                      analytics.recentCalls.length > 0 && (
                        <div className="bg-gray-50 rounded-lg p-6">
                          <h4 className="text-md font-medium text-gray-900 mb-4">
                            Recent Call Summary
                          </h4>
                          <div className="text-sm text-gray-600">
                            <p>
                              Generated at: {formatDate(analytics?.generatedAt)}
                            </p>
                            <p className="mt-2">
                              Latest activity shows{" "}
                              {analytics.recentCalls.length} recent call(s) with
                              the most common outcome being &quot;
                              {analytics?.outcomeAnalytics?.mostCommonEndReason?.replace(
                                "-",
                                " "
                              )}
                              &quot;
                            </p>
                          </div>
                        </div>
                      )}

                    {/* CSV Stats */}
                    {campaign?.csv_stats && (
                      <div className="bg-gray-50 rounded-lg p-6">
                        <h4 className="text-md font-medium text-gray-900 mb-6">
                          CSV Statistics
                        </h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {campaign.csv_stats.totalRows || 0}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Rows
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {campaign.csv_stats.validContacts || 0}
                            </div>
                            <div className="text-sm text-gray-600">
                              Valid Contacts
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {campaign.csv_stats.summary?.totalAmount?.toLocaleString(
                                "en-IN"
                              ) || 0}
                            </div>
                            <div className="text-sm text-gray-600">
                              Total Amount
                            </div>
                          </div>
                          <div className="text-center">
                            <div className="text-2xl font-bold text-gray-900">
                              {campaign.csv_stats.summary?.averageAmount?.toLocaleString(
                                "en-IN"
                              ) || 0}
                            </div>
                            <div className="text-sm text-gray-600">
                              Average Amount
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CampaignDetailPage;