import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // ✅ lowercase import for model
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// POST - Perform bulk actions on campaigns
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, campaignIds, company_id } = body;

    if (!action || !campaignIds || !Array.isArray(campaignIds)) {
      return NextResponse.json(
        { error: "Missing required fields: action, campaignIds (array)" },
        { status: 400 }
      );
    }

    await connectDB();

    const query: Record<string, unknown> = { _id: { $in: campaignIds } };
    if (company_id) query.company_id = company_id;

    const foundCampaigns = await campaigns.find(query);
    if (foundCampaigns.length === 0) {
      return NextResponse.json(
        { error: "No campaigns found" },
        { status: 404 }
      );
    }

    const results = [];

    for (const campaign of foundCampaigns) {
      const result: { campaignId: string; success: boolean; error: string | null } = { campaignId: campaign._id, success: false, error: null };

      try {
        switch (action) {
          case "start":
            if (campaign.vapiCampaignId) {
              const response = await fetch(
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

              if (response.ok) {
                campaign.status = "running";
                await campaign.save();
                result.success = true;
              }
            }
            break;

          case "pause":
            if (campaign.vapiCampaignId) {
              const response = await fetch(
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

              if (response.ok) {
                campaign.status = "paused";
                await campaign.save();
                result.success = true;
              }
            }
            break;

          case "delete":
            if (campaign.vapiCampaignId) {
              await fetch(
                `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`,
                {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${VAPI_API_KEY}`,
                  },
                }
              );
            }

            await campaigns.findByIdAndDelete(campaign._id);
            result.success = true;
            break;

          default:
            result.error = "Invalid action";
        }
      } catch (err) {
        result.error =
          err instanceof Error ? err.message : "Unknown internal error";
      }

      results.push(result);
    }

    return NextResponse.json({
      message: `Bulk ${action} completed`,
      results,
      summary: {
        total: results.length,
        successful: results.filter((r) => r.success).length,
        failed: results.filter((r) => !r.success).length,
      },
    });
  } catch (error) {
    console.error("Error performing bulk action:", error);
    return NextResponse.json(
      { error: "Failed to perform bulk action" },
      { status: 500 }
    );
  }
}
