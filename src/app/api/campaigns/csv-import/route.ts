import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns"; // ✅ Fixed import
import companies from "@/models/campany"; // ✅ Fixed import
import { parseCSVFromUrl } from "@/lib/csvParser";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// POST - Create campaign from CSV upload
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      csvUrl,
      company_id,
      assistantId,
      phoneNumberColumn = "phone",
      scheduleAt,
    } = body;

    if (!name || !company_id || !assistantId || !csvUrl) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, company_id, assistantId, csvUrl",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // ✅ Validate company
    const company = await companies.findById(company_id);
    if (!company) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // ✅ Parse CSV
    let parsedData;
    try {
      parsedData = await parseCSVFromUrl(csvUrl, phoneNumberColumn);
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    if (parsedData.phoneNumbers.length === 0) {
      return NextResponse.json(
        {
          error: "No valid phone numbers found in CSV",
          parseErrors: parsedData.errors,
        },
        { status: 400 }
      );
    }

    // ✅ Create VAPI campaign
    const vapiPayload = {
      name,
      assistantId,
      phoneNumbers: parsedData.phoneNumbers.map((phone: string) => ({
        phoneNumber: phone,
      })),
      ...(scheduleAt && { scheduleAt }),
    };

    const vapiResponse = await fetch(`${VAPI_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vapiPayload),
    });

    if (!vapiResponse.ok) {
      const errorText = await vapiResponse.text();
      console.error("VAPI Campaign creation failed:", errorText);
      return NextResponse.json(
        { error: "Failed to create VAPI campaign from CSV" },
        { status: vapiResponse.status }
      );
    }

    const vapiCampaign = await vapiResponse.json();

    // ✅ Store locally
    const newCampaign = await campaigns.create({
      name,
      description,
      csvUrl,
      company_id,
      vapiCampaignId: vapiCampaign.id,
      status: vapiCampaign.status || "created",
      total_contacts: parsedData.phoneNumbers.length,
    });

    await companies.findByIdAndUpdate(company_id, {
      $push: { campaigns: newCampaign._id },
    });

    const populatedCampaign = await campaigns
      .findById(newCampaign._id)
      .populate("company_id");

    return NextResponse.json(
      {
        campaign: populatedCampaign,
        message: `Campaign created with ${parsedData.phoneNumbers.length} contacts from CSV`,
        parseStats: {
          totalRows: parsedData.totalCount,
          validPhoneNumbers: parsedData.phoneNumbers.length,
          errors: parsedData.errors,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign from CSV:", error);
    return NextResponse.json(
      { error: "Failed to create campaign from CSV" },
      { status: 500 }
    );
  }
}
