import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// Types for nested data
interface StructuredData {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | StructuredData
    | StructuredData[];
}

interface StructuredDataMulti {
  [key: string]:
    | string
    | number
    | boolean
    | null
    | StructuredData
    | StructuredData[];
}

interface VapiMessage {
  role: "system" | "assistant" | "user" | string;
  message: string;
  time: number;
  duration: number;
}

interface VapiRecording {
  stereoUrl?: string;
  videoUrl?: string;
}

interface VapiArtifact {
  transcript?: string;
  recording?: VapiRecording;
  messages?: VapiMessage[];
}

interface VapiAnalysis {
  summary?: string;
  structuredData?: StructuredData;
  structuredDataMulti?: StructuredDataMulti[];
  successEvaluation?: string;
}

// Interface for the call response from VAPI
interface VapiCallResponse {
  id: string;
  status: string;
  endedReason?: string;
  duration?: number;
  createdAt?: string;
  updatedAt?: string;
  startedAt?: string;
  endedAt?: string;
  cost?: number;
  analysis?: VapiAnalysis;
  artifact?: VapiArtifact;
  campaignId?: string;
  phoneNumber?: string;
  customer?: {
    number?: string;
    name?: string;
    email?: string;
  };
}

interface CallSummaryResponse {
  callId: string;
  summary: string | null;
  analysis: VapiAnalysis | null;
  callDetails: {
    status: string;
    duration?: number;
    cost?: number;
    startedAt?: string;
    endedAt?: string;
    endedReason?: string;
  };
  transcript?: string;
  campaignId?: string;
  customer?: {
    number?: string;
    name?: string;
    email?: string;
  };
}

// GET - Get call summary by call ID
export async function GET(
  request: NextRequest,
  { params }: { params: { ideal: string } }
) {
  try {
    const { ideal: callId } = await params;

    if (!VAPI_API_KEY) {
      return NextResponse.json(
        { error: "VAPI API key not configured" },
        { status: 500 }
      );
    }

    const vapiResponse = await fetch(`${VAPI_BASE_URL}/call/${callId}`, {
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
      },
    });

    if (!vapiResponse.ok) {
      if (vapiResponse.status === 404) {
        return NextResponse.json({ error: "Call not found" }, { status: 404 });
      }

      const errorText = await vapiResponse.text();
      console.error("VAPI API error:", errorText);
      return NextResponse.json(
        { error: "Failed to fetch call from VAPI" },
        { status: vapiResponse.status }
      );
    }

    const callData: VapiCallResponse = await vapiResponse.json();

    const response: CallSummaryResponse = {
      callId: callData.id,
      summary: callData.analysis?.summary || null,
      analysis: callData.analysis || null,
      callDetails: {
        status: callData.status,
        duration: callData.duration,
        cost: callData.cost,
        startedAt: callData.startedAt,
        endedAt: callData.endedAt,
        endedReason: callData.endedReason,
      },
      transcript: callData.artifact?.transcript,
      campaignId: callData.campaignId,
      customer: callData.customer,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching call summary:", error);
    return NextResponse.json(
      { error: "Failed to fetch call summary" },
      { status: 500 }
    );
  }
}
