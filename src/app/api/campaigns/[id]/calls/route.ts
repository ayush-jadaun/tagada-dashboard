import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // ✅ Use lowercase to match your schema
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// GET - Get call details for a campaign
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectDB();

    const campaign = await campaigns.findById(id); // ✅ lowercase model name
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

    // ✅ Fetch calls from VAPI
    const vapiResponse = await fetch(
      `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}/calls?page=${page}&limit=${limit}`,
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    if (!vapiResponse.ok) {
      return NextResponse.json(
        { error: "Failed to fetch calls from VAPI" },
        { status: vapiResponse.status }
      );
    }

    const callsData = await vapiResponse.json();

    return NextResponse.json({
      calls: callsData.calls || [],
      pagination: {
        page,
        limit,
        total: callsData.total || 0,
        totalPages: Math.ceil((callsData.total || 0) / limit),
      },
      campaignId: id,
      vapiCampaignId: campaign.vapiCampaignId,
    });
  } catch (error) {
    console.error("Error fetching campaign calls:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign calls" },
      { status: 500 }
    );
  }
}
