import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // ✅ Correct import
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// POST - Pause campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;

    await connectDB();

    const campaign = await campaigns.findById(id); // ✅ Correct model usage
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

    // Pause campaign in VAPI
    const vapiResponse = await fetch(
      `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "paused" }),
      }
    );

    if (!vapiResponse.ok) {
      return NextResponse.json(
        { error: "Failed to pause campaign" },
        { status: vapiResponse.status }
      );
    }

    // Update local status
    campaign.status = "paused";
    await campaign.save();

    return NextResponse.json({
      message: "Campaign paused successfully",
      status: "paused",
    });
  } catch (error) {
    console.error("Error pausing campaign:", error);
    return NextResponse.json(
      { error: "Failed to pause campaign" },
      { status: 500 }
    );
  }
}
