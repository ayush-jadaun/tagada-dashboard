import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Define interfaces for type safety
interface VapiCall {
  id: string;
  status: "queued" | "ringing" | "in-progress" | "ended" | "failed";
  endedReason?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
  phoneNumber?: string;
  campaignId?: string;
}

interface VapiCampaign {
  id: string;
  calls?: VapiCall[] | Record<string, VapiCall>;
  name?: string;
  status?: string;
}

interface VapiCallsResponse {
  calls?: VapiCall[];
  data?: VapiCall[];
}

interface CallStats {
  totalCalls: number;
  completedCalls: number;
  answeredCalls: number;
  voicemailCalls: number;
  failedCalls: number;
  totalDuration: number;
  averageDuration: number;
}

interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  calls: VapiCall[];
  pagination: PaginationInfo;
  stats: CallStats;
  campaignId: string;
  vapiCampaignId: string;
  filters: {
    status: string | null;
  };
}

// GET - Get calls for a specific campaign
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status"); // Filter by call status

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

    // Method 1: Try to get the full campaign data which should include calls
    let callsArray: VapiCall[] = [];
    try {
      const vapiResponse = await fetch(
        `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`,
        {
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`,
          },
        }
      );

      if (vapiResponse.ok) {
        const vapiCampaign: VapiCampaign = await vapiResponse.json();

        // Extract calls from the campaign response
        if (vapiCampaign.calls) {
          if (
            typeof vapiCampaign.calls === "object" &&
            !Array.isArray(vapiCampaign.calls)
          ) {
            callsArray = Object.values(vapiCampaign.calls);
          } else if (Array.isArray(vapiCampaign.calls)) {
            callsArray = vapiCampaign.calls;
          }
        }
      }
    } catch (error) {
      console.error("Error fetching campaign from VAPI:", error);
    }

    // Method 2: If no calls found, try the general calls endpoint with campaign filter
    if (callsArray.length === 0) {
      try {
        const callsResponse = await fetch(
          `${VAPI_BASE_URL}/call?campaignId=${campaign.vapiCampaignId}&limit=100`,
          {
            headers: {
              Authorization: `Bearer ${VAPI_API_KEY}`,
            },
          }
        );

        if (callsResponse.ok) {
          const callsData: VapiCallsResponse | VapiCall[] =
            await callsResponse.json();

          if (Array.isArray(callsData)) {
            callsArray = callsData;
          } else {
            callsArray = callsData.calls || callsData.data || [];
          }
        }
      } catch (error) {
        console.warn("Could not fetch calls from general endpoint:", error);
      }
    }

    // Filter by status if provided
    if (status) {
      callsArray = callsArray.filter(
        (call: VapiCall) => call.status === status
      );
    }

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedCalls = callsArray.slice(startIndex, endIndex);

    // Calculate statistics from the calls
    const stats: CallStats = callsArray.reduce(
      (acc: CallStats, call: VapiCall) => {
        acc.totalCalls++;

        if (call.status === "ended") {
          acc.completedCalls++;
          if (
            call.endedReason?.includes("human-answered") ||
            call.endedReason === "assistant-ended-call"
          ) {
            acc.answeredCalls++;
          }
          if (call.endedReason?.includes("voicemail")) {
            acc.voicemailCalls++;
          }
          if (call.duration) {
            acc.totalDuration += call.duration;
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
        voicemailCalls: 0,
        failedCalls: 0,
        totalDuration: 0,
        averageDuration: 0,
      }
    );

    stats.averageDuration =
      stats.completedCalls > 0 ? stats.totalDuration / stats.completedCalls : 0;

    const response: ApiResponse = {
      calls: paginatedCalls,
      pagination: {
        page,
        limit,
        total: callsArray.length,
        totalPages: Math.ceil(callsArray.length / limit),
      },
      stats,
      campaignId: id,
      vapiCampaignId: campaign.vapiCampaignId,
      filters: {
        status,
      },
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching campaign calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign calls" },
      { status: 500 }
    );
  }
}
