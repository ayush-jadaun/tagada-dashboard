"use client";
import React, { useState, useEffect, JSX,useCallback } from "react";
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
  ChevronDown,
  ChevronUp,
  FileText,
  PlayCircle,
  User,
  DollarSign,
} from "lucide-react";
import { useParams } from "next/navigation";

// Type definitions
interface Customer {
  name?: string;
  number?: string;
  email?: string;
  assistantOverrides?: {
    variableValues?: {
      formattedAmount?: string;
    };
  };
}

interface CallDetails {
  duration?: number;
  cost?: number;
  startedAt?: string;
  endedAt?: string;
}

interface Analysis {
  successEvaluation?: string;
  structuredData?: Record<string, unknown>;
}

interface CallSummary {
  callDetails?: CallDetails;
  customer?: Customer;
  summary?: string;
  analysis?: Analysis;
  transcript?: string;
  error?: string;
}

interface Call {
  id?: string;
  status?: string;
  endedReason?: string;
  customer?: Customer;
}

interface CallsStats {
  totalCalls?: number;
  answeredCalls?: number;
  voicemailCalls?: number;
}

interface CallsPagination {
  page: number;
  totalPages: number;
  total: number;
}

interface CallsData {
  calls?: string[];
  stats?: CallsStats;
  pagination?: CallsPagination;
}

interface VapiCounters {
  [key: string]: number;
}

interface VapiData {
  counters?: VapiCounters;
  endedReason?: string;
}

interface CompanyId {
  name?: string;
}

interface CsvStatsSummary {
  totalAmount?: number;
  averageAmount?: number;
}

interface CsvStats {
  totalRows?: number;
  validContacts?: number;
  summary?: CsvStatsSummary;
}

interface Campaign {
  _id?: string;
  name?: string;
  description?: string;
  status?: string;
  company_id?: CompanyId;
  createdAt?: string;
  updatedAt?: string;
  vapiCampaignId?: string;
  total_contacts?: number;
  csv_stats?: CsvStats;
  vapiData?: VapiData;
}

interface StatusData {
  localStatus?: string;
  vapiStatus?: string;
  lastUpdated?: string;
  stats?: CallsStats;
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
  endReasonBreakdown?: Record<string, number>;
  mostCommonEndReason?: string;
}

interface TimeBasedAnalytics {
  peakCallHour?: string;
  peakCallDay?: string;
}

interface RecentCall {
  id?: string;
  status?: string;
}

interface Analytics {
  callAnalytics?: CallAnalytics;
  outcomeAnalytics?: OutcomeAnalytics;
  timeBasedAnalytics?: TimeBasedAnalytics;
  recentCalls?: RecentCall[];
  generatedAt?: string;
}

type TabType = "overview" | "calls" | "analytics";

type CampaignStatus = "active" | "paused" | "ended" | "failed" | string;

const CampaignDetailPage: React.FC = () => {
  const params = useParams();
  const campaignId = params.camid as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [status, setStatus] = useState<StatusData | null>(null);
  const [callsData, setCallsData] = useState<CallsData | null>(null);
  const [calls, setCalls] = useState<string[]>([]);
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>("overview");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedCallId, setExpandedCallId] = useState<string | null>(null);
  const [callSummaries, setCallSummaries] = useState<
    Record<string, CallSummary>
  >({});
  const [loadingSummary, setLoadingSummary] = useState<Record<string, boolean>>(
    {}
  );
const fetchCampaign = useCallback(async (): Promise<void> => {
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
}, [campaignId]);

const fetchCalls = useCallback(async (): Promise<void> => {
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
}, [campaignId]);

const fetchCallSummary = useCallback(
  async (callId: string): Promise<void> => {
    if (callSummaries[callId] || loadingSummary[callId]) {
      return;
    }

    setLoadingSummary((prev) => ({ ...prev, [callId]: true }));

    try {
      const response = await fetch(
        `/api/campaigns/${campaignId}/calls/${callId}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch call summary");
      }
      const summaryData: CallSummary = await response.json();
      console.log(summaryData);
      setCallSummaries((prev) => ({ ...prev, [callId]: summaryData }));
    } catch (err) {
      console.error("Error fetching call summary:", err);
      setCallSummaries((prev) => ({
        ...prev,
        [callId]: { error: "Failed to load summary" },
      }));
    } finally {
      setLoadingSummary((prev) => ({ ...prev, [callId]: false }));
    }
  },
  [campaignId, callSummaries, loadingSummary]
);

const fetchAnalytics = useCallback(async (): Promise<void> => {
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
}, [campaignId]);

const fetchStatus = useCallback(async (): Promise<void> => {
  try {
    const response = await fetch(`/api/campaigns/${campaignId}/status`);
    if (!response.ok) {
      throw new Error("Failed to fetch status data");
    }
    const statusData: StatusData = await response.json();
    console.log("status details:", statusData);
    setStatus(statusData);
  } catch (err) {
    console.error("Error fetching status:", err);
    throw err;
  }
}, [campaignId]);


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
  }, [campaignId, fetchAnalytics, fetchCalls, fetchCampaign, fetchStatus]);

  const toggleCallExpansion = (callId: string): void => {
    if (expandedCallId === callId) {
      setExpandedCallId(null);
    } else {
      setExpandedCallId(callId);
      fetchCallSummary(callId);
    }
  };

  const formatDuration = (seconds?: number): string => {
    if (!seconds || seconds === 0) return "--";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
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

  const getStatusBadge = (status?: CampaignStatus): string => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium border";
    switch (status) {
      case "active":
        return `${baseClasses} bg-blue-50 text-blue-700 border-blue-200`;
      case "paused":
        return `${baseClasses} bg-yellow-50 text-yellow-700 border-yellow-200`;
      case "ended":
        return `${baseClasses} bg-green-50 text-green-700 border-green-200`;
      case "failed":
        return `${baseClasses} bg-red-50 text-red-700 border-red-200`;
      default:
        return `${baseClasses} bg-gray-50 text-gray-700 border-gray-200`;
    }
  };

  const parseCallData = (callString: string): Call => {
    try {
      if (typeof callString === "string") {
        return JSON.parse(callString) as Call;
      }
      return callString as Call;
    } catch {
      return callString as Call;
    }
  };

  const renderCallSummary = (callId: string): JSX.Element => {
    const summary = callSummaries[callId];
    const isLoading = loadingSummary[callId];

    if (isLoading) {
      return (
        <div className="bg-blue-50 rounded-lg p-4 border-l-4 border-blue-400">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-500 mr-3"></div>
            <p className="text-blue-700">Loading call summary...</p>
          </div>
        </div>
      );
    }

    if (summary?.error) {
      return (
        <div className="bg-red-50 rounded-lg p-4 border-l-4 border-red-400">
          <div className="flex items-center">
            <XCircle className="w-5 h-5 text-red-500 mr-3" />
            <p className="text-red-700">{summary.error}</p>
          </div>
        </div>
      );
    }

    if (!summary) {
      return (
        <div className="bg-gray-50 rounded-lg p-4 border-l-4 border-gray-400">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-gray-500 mr-3" />
            <p className="text-gray-700">No summary available</p>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4">
        {/* Call Details */}
        <div className="bg-gray-50 rounded-lg p-4">
          <h5 className="font-medium text-gray-900 mb-3 flex items-center">
            <Phone className="w-4 h-4 mr-2" />
            Call Details
          </h5>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Duration:</span>
              <p className="font-medium">
                {formatDuration(summary.callDetails?.duration)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Cost:</span>
              <p className="font-medium">
                ${summary.callDetails?.cost?.toFixed(4) || "0.00"}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Started:</span>
              <p className="font-medium">
                {formatDate(summary.callDetails?.startedAt)}
              </p>
            </div>
            <div>
              <span className="text-gray-600">Ended:</span>
              <p className="font-medium">
                {formatDate(summary.callDetails?.endedAt)}
              </p>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        {summary.customer && (
          <div className="bg-blue-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              <User className="w-4 h-4 mr-2" />
              Customer Information
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              {summary.customer.name && (
                <div>
                  <span className="text-gray-600">Name:</span>
                  <p className="font-medium">{summary.customer.name}</p>
                </div>
              )}
              {summary.customer.number && (
                <div>
                  <span className="text-gray-600">Phone:</span>
                  <p className="font-medium">{summary.customer.number}</p>
                </div>
              )}
              {summary.customer.email && (
                <div>
                  <span className="text-gray-600">Email:</span>
                  <p className="font-medium">{summary.customer.email}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Summary */}
        {summary.summary && (
          <div className="bg-green-50 rounded-lg p-4 border-l-4 border-green-400">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              <FileText className="w-4 h-4 mr-2" />
              Call Summary
            </h5>
            <p className="text-gray-700 leading-relaxed">{summary.summary}</p>
          </div>
        )}

        {/* Analysis */}
        {summary.analysis && (
          <div className="bg-purple-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              <BarChart3 className="w-4 h-4 mr-2" />
              Call Analysis
            </h5>
            <div className="space-y-3">
              {summary.analysis.successEvaluation && (
                <div>
                  <span className="text-gray-600 text-sm">
                    Success Evaluation:
                  </span>
                  <p className="font-medium text-gray-900">
                    {summary.analysis.successEvaluation}
                  </p>
                </div>
              )}
              {summary.analysis.structuredData && (
                <div>
                  <span className="text-gray-600 text-sm">
                    Structured Data:
                  </span>
                  <pre className="bg-white p-3 rounded border text-xs overflow-x-auto mt-1">
                    {JSON.stringify(summary.analysis.structuredData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Transcript */}
        {summary.transcript && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3 flex items-center">
              <PlayCircle className="w-4 h-4 mr-2" />
              Transcript
            </h5>
            <div className="bg-white p-4 rounded border max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                {summary.transcript}
              </pre>
            </div>
          </div>
        )}
      </div>
    );
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
                    {campaign?.status
                      ? campaign.status.charAt(0).toUpperCase() +
                        campaign.status.slice(1)
                      : "Unknown"}
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
                { id: "overview" as const, name: "Overview", icon: BarChart3 },
                { id: "calls" as const, name: "Call History", icon: Phone },
                {
                  id: "analytics" as const,
                  name: "Analytics",
                  icon: TrendingUp,
                },
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

            {/* Calls Tab with Accordion */}
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
                  <div className="space-y-4">
                    {calls.map((callString, index) => {
                      const call = parseCallData(callString);
                      const callId = call.id || `call-${index}`;
                      const isExpanded = expandedCallId === callId;

                      return (
                        <div
                          key={callId}
                          className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
                        >
                          {/* Call Header - Clickable */}
                          <div
                            className="px-6 py-4 cursor-pointer hover:bg-gray-50 transition-colors"
                            onClick={() => toggleCallExpansion(callId)}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-4 flex-1">
                                <div className="flex items-center space-x-2">
                                  {getStatusIcon(call.status)}
                                  <span className="font-medium text-gray-900">
                                    {call.customer?.name || "Unknown Caller"}
                                  </span>
                                </div>
                                <div className="text-sm text-gray-600">
                                  {call.customer?.number || "--"}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {call.customer?.assistantOverrides
                                    ?.variableValues?.formattedAmount && (
                                    <span className="flex items-center">
                                      <DollarSign className="w-3 h-3 mr-1" />
                                      {
                                        call.customer.assistantOverrides
                                          .variableValues.formattedAmount
                                      }
                                    </span>
                                  )}
                                </div>
                              </div>
                              <div className="flex items-center space-x-4">
                                <span className={getStatusBadge(call.status)}>
                                  {call.status?.replace("-", " ") || "Unknown"}
                                </span>
                                <div className="text-sm text-gray-500">
                                  {call.endedReason?.replace("-", " ") || "--"}
                                </div>
                                {isExpanded ? (
                                  <ChevronUp className="w-5 h-5 text-gray-400" />
                                ) : (
                                  <ChevronDown className="w-5 h-5 text-gray-400" />
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Call Details - Expandable */}
                          {isExpanded && (
                            <div className="border-t border-gray-200 px-6 py-4 bg-gray-50">
                              {renderCallSummary(callId)}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {callsData?.pagination &&
                  callsData.pagination.totalPages > 1 && (
                    <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-6">
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
