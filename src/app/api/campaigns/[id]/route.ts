import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns";
import company from "@/models/campany";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// GET - Get specific campaign by ID with call data
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);

    // Check if user wants call data specifically
    const includeCalls = searchParams.get("includeCalls") === "true";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    await connectDB();

    const campaign = await campaigns.findById(id).populate("company_id");
    if (!campaign) {
      return NextResponse.json(
        { error: "Campaign not found" },
        { status: 404 }
      );
    }

    let vapiCampaignData = null;
    let callsInfo = null;

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
          vapiCampaignData = await vapiResponse.json();

          // Update local campaign status if different
          if (campaign.status !== vapiCampaignData.status) {
            campaign.status = vapiCampaignData.status;
            await campaign.save();
          }

          // Extract call information if requested
          if (includeCalls) {
            // Get calls data - it might be in different formats
            let callsArray = [];

            if (vapiCampaignData.calls) {
              if (
                typeof vapiCampaignData.calls === "object" &&
                !Array.isArray(vapiCampaignData.calls)
              ) {
                // If calls is an object with call IDs as keys
                callsArray = Object.values(vapiCampaignData.calls);
              } else if (Array.isArray(vapiCampaignData.calls)) {
                // If calls is already an array
                callsArray = vapiCampaignData.calls;
              }
            }

            // If no calls in the campaign response, try to fetch them separately
            if (callsArray.length === 0 && campaign.vapiCampaignId) {
              try {
                // Try to fetch calls from VAPI calls endpoint (if it exists)
                const callsResponse = await fetch(
                  `${VAPI_BASE_URL}/call?campaignId=${campaign.vapiCampaignId}`,
                  {
                    headers: {
                      Authorization: `Bearer ${VAPI_API_KEY}`,
                    },
                  }
                );

                if (callsResponse.ok) {
                  const callsData = await callsResponse.json();
                  callsArray = Array.isArray(callsData)
                    ? callsData
                    : callsData.calls || [];
                }
              } catch (error) {
                console.warn("Could not fetch calls separately:", error);
              }
            }

            // Apply pagination to calls
            const startIndex = (page - 1) * limit;
            const endIndex = startIndex + limit;
            const paginatedCalls = callsArray.slice(startIndex, endIndex);

            callsInfo = {
              calls: paginatedCalls,
              pagination: {
                page,
                limit,
                total: callsArray.length,
                totalPages: Math.ceil(callsArray.length / limit),
              },
              counters: {
                scheduled: vapiCampaignData.callsCounterScheduled || 0,
                queued: vapiCampaignData.callsCounterQueued || 0,
                inProgress: vapiCampaignData.callsCounterInProgress || 0,
                ended: vapiCampaignData.callsCounterEnded || 0,
                endedVoicemail:
                  vapiCampaignData.callsCounterEndedVoicemail || 0,
              },
            };
          }
        }
      } catch (error) {
        console.error("Error syncing with VAPI:", error);
      }
    }

    // Build response object
    const response = {
      ...campaign.toObject(),
      vapiData: vapiCampaignData
        ? {
            status: vapiCampaignData.status,
            endedReason: vapiCampaignData.endedReason,
            schedulePlan: vapiCampaignData.schedulePlan,
            counters: {
              scheduled: vapiCampaignData.callsCounterScheduled || 0,
              queued: vapiCampaignData.callsCounterQueued || 0,
              inProgress: vapiCampaignData.callsCounterInProgress || 0,
              ended: vapiCampaignData.callsCounterEnded || 0,
              endedVoicemail: vapiCampaignData.callsCounterEndedVoicemail || 0,
            },
          }
        : null,
    };

    // Add call information if requested
    if (callsInfo) {
      response.callsInfo = callsInfo;
    }

    return NextResponse.json(response);
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
