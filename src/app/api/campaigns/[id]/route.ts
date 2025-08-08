import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns";
import company from "@/models/campany";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// GET - Get specific campaign by ID
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

    // Sync status with VAPI if campaign exists
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
          if (campaign.status !== vapiCampaign.status) {
            campaign.status = vapiCampaign.status;
            await campaign.save();
          }
        }
      } catch (error) {
        console.error("Error syncing with VAPI:", error);
      }
    }

    return NextResponse.json(campaign);
  } catch (error) {
    console.error("Error fetching campaign:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaign" },
      { status: 500 }
    );
  }
}

// PATCH - Update campaign
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { name, description, status } = body;

    await connectDB();

    const campaign = await campaigns.findById(id);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Update VAPI campaign if needed
    if (campaign.vapiCampaignId && (name || status)) {
      const updateData: Partial<{ name: string; status: string }> = {};
      if (name) updateData.name = name;
      if (status) updateData.status = status;

      const vapiResponse = await fetch(
        `${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!vapiResponse.ok) {
        console.error("Failed to update VAPI campaign");
      }
    }

    // Update local campaign
    const updatedCampaign = await campaigns
      .findByIdAndUpdate(id, { name, description, status }, { new: true })
      .populate("company_id");

    return NextResponse.json(updatedCampaign);
  } catch (error) {
    console.error("Error updating campaign:", error);
    return NextResponse.json(
      { error: "Failed to update campaign" },
      { status: 500 }
    );
  }
}

// DELETE - Delete campaign
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    await connectDB();

    const campaign = await campaigns.findById(id);
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    // Delete from VAPI if exists
    if (campaign.vapiCampaignId) {
      try {
        await fetch(`${VAPI_BASE_URL}/campaign/${campaign.vapiCampaignId}`, {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${VAPI_API_KEY}`,
          },
        });
      } catch (error) {
        console.error("Error deleting VAPI campaign:", error);
      }
    }

    // Remove from company's campaigns array
    await company.findByIdAndUpdate(campaign.company_id, {
      $pull: { campaigns: campaign._id },
    });

    // Delete from local database
    await campaigns.findByIdAndDelete(id);

    return NextResponse.json({ message: "Campaign deleted successfully" });
  } catch (error) {
    console.error("Error deleting campaign:", error);
    return NextResponse.json(
      { error: "Failed to delete campaign" },
      { status: 500 }
    );
  }
}
