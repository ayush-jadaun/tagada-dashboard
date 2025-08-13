import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // <-- fixed import
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// GET - Get campaign status and sync with VAPI
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    await connectDB();

    const campaign = await campaigns.findById(id); // <-- fixed usage
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    let vapiStatus = null;
    let vapiStats = null;

    // Fetch current status from VAPI
    if (campaign.vapiCampaignId) {
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
          const vapiCampaign = await vapiResponse.json();
          vapiStatus = vapiCampaign.status;
          vapiStats = {
            totalCalls: vapiCampaign.totalCalls || 0,
            completedCalls: vapiCampaign.completedCalls || 0,
            failedCalls: vapiCampaign.failedCalls || 0,
            inProgressCalls: vapiCampaign.inProgressCalls || 0,
          };

          // Sync local status
          if (campaign.status !== vapiStatus) {
            campaign.status = vapiStatus;
            await campaign.save();
          }
        }
      } catch (error) {
        console.error("Error fetching VAPI campaign status:", error);
      }
    }

    return NextResponse.json({
      localStatus: campaign.status,
      vapiStatus,
      stats: vapiStats,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Error fetching campaign status:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign status" },
      { status: 500 }
    );
  }
}
