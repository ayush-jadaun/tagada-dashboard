import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Define interfaces for type safety
interface Customer {
  number: string;
}

interface Analysis {
  summary: string;
  successEvaluation: string;
}

interface VapiCall {
  id: string;
  status: "queued" | "ringing" | "in-progress" | "ended" | "failed";
  customer: Customer;
  startedAt: string | null;
  endedAt: string | null;
  analysis: Analysis | null;
  endedReason: string;
  duration?: number;
}

interface CallAnalytics {
  totalCalls: number;
  completedCalls: number;
  answeredCalls: number;
  unansweredCalls: number;
  customerEndedCalls: number;
  successfulCalls: number;
  failedCalls: number;
  averageCallDuration: number;
  totalCallDuration: number;
  answerRate: number;
  successRate: number;
  completionRate: number;
}

interface TimeBasedAnalytics {
  hourlyDistribution: Record<string, number>;
  dailyDistribution: Record<string, number>;
  peakCallHour: string;
  peakCallDay: string;
}

interface OutcomeAnalytics {
  endReasonBreakdown: Record<string, number>;
  mostCommonEndReason: string;
  successfulCallsDetails: {
    count: number;
    percentage: number;
    averageDuration: number;
  };
}

interface AnalyticsResponse {
  campaignId: string;
  vapiCampaignId: string;
  generatedAt: string;
  callAnalytics: CallAnalytics;
  timeBasedAnalytics: TimeBasedAnalytics;
  outcomeAnalytics: OutcomeAnalytics;
  recentCalls: VapiCall[];
}

// Helper function to parse call duration from timestamps
function calculateCallDuration(
  startedAt: string | null,
  endedAt: string | null
): number {
  if (!startedAt || !endedAt) return 0;

  const start = new Date(startedAt).getTime();
  const end = new Date(endedAt).getTime();
  return Math.max(0, (end - start) / 1000); // Duration in seconds
}

// Helper function to get hour from timestamp
function getHourFromTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Unknown";
  return new Date(timestamp).getHours().toString().padStart(2, "0");
}

// Helper function to get day from timestamp
function getDayFromTimestamp(timestamp: string | null): string {
  if (!timestamp) return "Unknown";
  const days = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  return days[new Date(timestamp).getDay()];
}

// GET - Get analytics for a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    await connectDB();

    const campaign = await campaigns.findById(id);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    if (!campaign.vapiCampaignId) {
      return NextResponse.json(
        { error: "No VAPI campaign ID found" },
        { status: 400 }
      );
    }

    // Fetch all calls for the campaign
    let callsArray: VapiCall[] = [];

    try {
      // Method 1: Try to get the full campaign data
      const vapiResponse = await fetch(
        `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`,
        {
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`,
          },
        }
      );

      if (vapiResponse.ok) {
        const vapiCampaign = await vapiResponse.json();

        if (vapiCampaign.calls) {
          if (Array.isArray(vapiCampaign.calls)) {
            // Parse JSON strings if they come as strings
            callsArray = vapiCampaign.calls.map((call: unknown) => {
              if (typeof call === "string") {
                return JSON.parse(call) as VapiCall;
              }
              return call as VapiCall;
            });
          } else if (typeof vapiCampaign.calls === "object") {
            callsArray = Object.values(vapiCampaign.calls).map(
              (call: unknown) => {
                if (typeof call === "string") {
                  return JSON.parse(call) as VapiCall;
                }
                return call as VapiCall;
              }
            );
          }
        }
      }
    } catch (error) {
      console.error("Error fetching campaign from VAPI:", error);
    }

    // Method 2: Fallback to general calls endpoint
    if (callsArray.length === 0) {
      try {
        const callsResponse = await fetch(
          `${VAPI_BASE_URL}/call?campaignId=${campaign.vapiCampaignId}&limit=1000`,
          {
            headers: {
              Authorization: `Bearer ${VAPI_API_KEY}`,
            },
          }
        );

        if (callsResponse.ok) {
          const callsData = await callsResponse.json();
          const rawCalls = Array.isArray(callsData)
            ? callsData
            : callsData.calls || [];
          callsArray = rawCalls.map((call: unknown) => {
            if (typeof call === "string") {
              return JSON.parse(call) as VapiCall;
            }
            return call as VapiCall;
          });
        }
      } catch (error) {
        console.warn("Could not fetch calls from general endpoint:", error);
      }
    }

    // Calculate call analytics
    const callAnalytics: CallAnalytics = callsArray.reduce(
      (acc, call) => {
        acc.totalCalls++;

        // Calculate duration
        const duration = calculateCallDuration(call.startedAt, call.endedAt);
        if (duration > 0) {
          acc.totalCallDuration += duration;
        }

        // Categorize calls
        if (call.status === "ended") {
          acc.completedCalls++;

          if (call.endedReason === "customer-did-not-answer") {
            acc.unansweredCalls++;
          } else if (call.endedReason === "customer-ended-call") {
            acc.customerEndedCalls++;
            acc.answeredCalls++;
          } else {
            acc.answeredCalls++;
          }

          // Check for successful calls
          if (call.analysis?.successEvaluation === "true") {
            acc.successfulCalls++;
          }
        } else if (call.status === "failed") {
          acc.failedCalls++;
        }

        return acc;
      },
      {
        totalCalls: 0,
        completedCalls: 0,
        answeredCalls: 0,
        unansweredCalls: 0,
        customerEndedCalls: 0,
        successfulCalls: 0,
        failedCalls: 0,
        averageCallDuration: 0,
        totalCallDuration: 0,
        answerRate: 0,
        successRate: 0,
        completionRate: 0,
      }
    );

    // Calculate percentages and averages
    callAnalytics.averageCallDuration =
      callAnalytics.completedCalls > 0
        ? callAnalytics.totalCallDuration / callAnalytics.completedCalls
        : 0;

    callAnalytics.answerRate =
      callAnalytics.totalCalls > 0
        ? (callAnalytics.answeredCalls / callAnalytics.totalCalls) * 100
        : 0;

    callAnalytics.successRate =
      callAnalytics.answeredCalls > 0
        ? (callAnalytics.successfulCalls / callAnalytics.answeredCalls) * 100
        : 0;

    callAnalytics.completionRate =
      callAnalytics.totalCalls > 0
        ? (callAnalytics.completedCalls / callAnalytics.totalCalls) * 100
        : 0;

    // Time-based analytics
    const hourlyDistribution: Record<string, number> = {};
    const dailyDistribution: Record<string, number> = {};

    callsArray.forEach((call) => {
      const hour = getHourFromTimestamp(call.startedAt);
      const day = getDayFromTimestamp(call.startedAt);

      hourlyDistribution[hour] = (hourlyDistribution[hour] || 0) + 1;
      dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
    });

    const peakCallHour = Object.entries(hourlyDistribution).reduce(
      (a, b) => (hourlyDistribution[a[0]] > hourlyDistribution[b[0]] ? a : b),
      ["00", 0]
    )[0];

    const peakCallDay = Object.entries(dailyDistribution).reduce(
      (a, b) => (dailyDistribution[a[0]] > dailyDistribution[b[0]] ? a : b),
      ["Unknown", 0]
    )[0];

    const timeBasedAnalytics: TimeBasedAnalytics = {
      hourlyDistribution,
      dailyDistribution,
      peakCallHour,
      peakCallDay,
    };

    // Outcome analytics
    const endReasonBreakdown: Record<string, number> = {};
    let successfulCallsDuration = 0;

    callsArray.forEach((call) => {
      endReasonBreakdown[call.endedReason] =
        (endReasonBreakdown[call.endedReason] || 0) + 1;

      if (call.analysis?.successEvaluation === "true") {
        successfulCallsDuration += calculateCallDuration(
          call.startedAt,
          call.endedAt
        );
      }
    });

    const mostCommonEndReason = Object.entries(endReasonBreakdown).reduce(
      (a, b) => (endReasonBreakdown[a[0]] > endReasonBreakdown[b[0]] ? a : b),
      ["unknown", 0]
    )[0];

    const outcomeAnalytics: OutcomeAnalytics = {
      endReasonBreakdown,
      mostCommonEndReason,
      successfulCallsDetails: {
        count: callAnalytics.successfulCalls,
        percentage: callAnalytics.successRate,
        averageDuration:
          callAnalytics.successfulCalls > 0
            ? successfulCallsDuration / callAnalytics.successfulCalls
            : 0,
      },
    };

    // Get recent calls (last 10)
    const recentCalls = callsArray
      .sort((a, b) => {
        const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
        const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
        return dateB - dateA;
      })
      .slice(0, 10);

    const analyticsResponse: AnalyticsResponse = {
      campaignId: id,
      vapiCampaignId: campaign.vapiCampaignId,
      generatedAt: new Date().toISOString(),
      callAnalytics,
      timeBasedAnalytics,
      outcomeAnalytics,
      recentCalls,
    };

    return NextResponse.json(analyticsResponse);
  } catch (error) {
    console.error("Error generating analytics:", error);
    return NextResponse.json(
      { error: "Failed to generate analytics" },
      { status: 500 }
    );
  }
}
