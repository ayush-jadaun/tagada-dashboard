import { parseCSVFromUrl } from "@/lib/csvParser";
import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns";
import company from "@/models/campany";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;

// GET - List all campaigns for a company
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("companyId");

    await connectDB();

    let campaignList;
    if (companyId) {
      campaignList = await campaigns
        .find({ company_id: companyId })
        .populate("company_id");
    } else {
      campaignList = await campaigns.find().populate("company_id");
    }

    return NextResponse.json(campaignList);
  } catch (error) {
    console.error("Error fetching campaigns:", error);
    return NextResponse.json(
      { error: "Failed to fetch campaigns" },
      { status: 500 }
    );
  }
}

// POST - Create new campaign
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      name,
      description,
      csvUrl,
      company_id,
      phoneNumbers, // Array of phone numbers to call
      scheduleAt, // Optional: when to schedule the campaign
    } = body;
console.log(phoneNumbers);
    if (!name || !company_id || !phoneNumbers) {
      return NextResponse.json(
        {
          error:
            "Missing required fields: name, company_id, phoneNumbers",
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Verify company exists
    const existingCompany = await company.findById(company_id);
    if (!existingCompany) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }


let finalNumbers = phoneNumbers;

// If csvUrl is provided, parse it instead of using phoneNumbers directly
if (csvUrl) {
  finalNumbers = await parseCSVFromUrl(csvUrl);
}

const vapiCampaignData = {
  name,
  assistantId: "a84057e3-1fea-402d-881e-102f603e95b2",
  phoneNumberId: "bd1b7811-bbbc-42bb-8b47-4abd96c6342e",
  customers: finalNumbers.map((num: string) => ({
    number: num,
    
    
  })),
  ...(scheduleAt && { scheduleAt }),
};

// const vapiCampaignData = {
//   name,
//   assistantId: "a84057e3-1fea-402d-881e-102f603e95b2",
//   phoneNumberId:"bd1b7811-bbbc-42bb-8b47-4abd96c6342e",
//   customers: phoneNumbers.map((customerNumber: string) => ({
//   number: customerNumber
//   })),
//   ...(scheduleAt && { scheduleAt }),
// };


console.log("Data to vapi:",vapiCampaignData);
    const vapiResponse = await fetch(`${VAPI_BASE_URL}/campaign`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${VAPI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(vapiCampaignData),
    });

    if (!vapiResponse.ok) {
      const error = await vapiResponse.text();
      console.error("VAPI Campaign creation failed:", error);
      return NextResponse.json(
        { error: "Failed to create VAPI campaign" },
        { status: vapiResponse.status }
      );
    }

    const vapiCampaign = await vapiResponse.json();

    // Save campaign in local DB
    const newCampaign = await campaigns.create({
      name,
      description,
      csvUrl,
      company_id,
      vapiCampaignId: vapiCampaign.id,
      status: vapiCampaign.status || "created",
      total_contacts: phoneNumbers.length,
    });

    // Update company's campaign list
    await company.findByIdAndUpdate(company_id, {
      $push: { campaigns: newCampaign._id },
    });

    const populatedCampaign = await campaigns
      .findById(newCampaign._id)
      .populate("company_id");

    return NextResponse.json(populatedCampaign, { status: 201 });
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      { error: "Failed to create campaign" },
      { status: 500 }
    );
  }
}
