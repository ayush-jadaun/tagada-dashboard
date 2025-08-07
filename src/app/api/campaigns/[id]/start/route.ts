import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // ✅ fixed import
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// POST - Start/Resume campaign
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const campaign = await campaigns.findById(id); // ✅ fixed usage
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

    // Start campaign in VAPI
    const vapiResponse = await fetch(
      `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`,
      {
        method: "PATCH",
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "running" }),
      }
    );

    if (!vapiResponse.ok) {
      return NextResponse.json(
        { error: "Failed to start campaign" },
        { status: vapiResponse.status }
      );
    }

    // Update local status
    campaign.status = "running";
    await campaign.save();

    return NextResponse.json({
      message: "Campaign started successfully",
      status: "running",
    });
  } catch (error) {
    console.error("Error starting campaign:", error);
    return NextResponse.json(
      { error: "Failed to start campaign" },
      { status: 500 }
    );
  }
}
