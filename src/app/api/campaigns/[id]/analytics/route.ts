import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // ✅ match lowercase convention
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// GET - Get campaign analytics
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    await connectDB();

    const campaign = await campaigns.findById(id).populate("company_id");
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

    // Fetch analytics from VAPI
    const vapiRes = await fetch(
      `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}/analytics`,
      {
        headers: {
          Authorization: `Bearer ${VAPI_API_KEY}`,
        },
      }
    );

    if (!vapiRes.ok) {
      return NextResponse.json(
        { error: "Failed to fetch analytics from VAPI" },
        { status: vapiRes.status }
      );
    }

    const data = await vapiRes.json();

    const summary = {
      totalCalls: data.totalCalls || 0,
      completedCalls: data.completedCalls || 0,
      failedCalls: data.failedCalls || 0,
      inProgressCalls: data.inProgressCalls || 0,
      averageCallDuration: data.averageCallDuration || 0,
      successRate:
        data.totalCalls > 0
          ? (((data.completedCalls || 0) / data.totalCalls) * 100).toFixed(2)
          : "0.00",
    };

    const response = {
      campaign: {
        id: campaign._id,
        name: campaign.name,
        description: campaign.description,
        status: campaign.status,
        totalContacts: campaign.total_contacts,
        createdAt: campaign.createdAt,
        company: campaign.company_id,
      },
      vapi: data,
      summary,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error fetching campaign analytics:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign analytics" },
      { status: 500 }
    );
  }
}
