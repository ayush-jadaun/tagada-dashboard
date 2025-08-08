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
      nameColumn = "name",
      phoneColumn = "phone_number",
      amountColumn = "amount_owed",
      requireAllFields = true,
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

    // ✅ Parse CSV with all three fields
    let parsedData;
    try {
      parsedData = await parseCSVFromUrl(csvUrl, {
        nameColumn,
        phoneColumn,
        amountColumn,
        requireAllFields,
      });
    } catch (error) {
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details: error instanceof Error ? error.message : "Unknown error",
        },
        { status: 400 }
      );
    }

    if (parsedData.validCount === 0) {
      return NextResponse.json(
        {
          error: "No valid contacts found in CSV",
          parseErrors: parsedData.errors,
          totalRows: parsedData.totalCount,
        },
        { status: 400 }
      );
    }

    // ✅ Create VAPI campaign with contact data
    const vapiPayload = {
      name,
      assistantId,
      phoneNumbers: parsedData.contacts.map((contact) => ({
        phoneNumber: contact.phoneNumber,
        // Include additional contact data if VAPI supports it
        metadata: {
          name: contact.name,
          amountOwed: contact.amountOwed,
          // You can add more fields here if needed
        },
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

    // ✅ Store locally with enhanced contact data
    const newCampaign = await campaigns.create({
      name,
      description,
      csvUrl,
      company_id,
      vapiCampaignId: vapiCampaign.id,
      status: vapiCampaign.status || "created",
      total_contacts: parsedData.validCount,
      // Store the parsed contact data
      contacts: parsedData.contacts.map((contact) => ({
        name: contact.name,
        phoneNumber: contact.phoneNumber,
        amountOwed: contact.amountOwed,
        status: "pending", // or whatever default status you want
      })),
      // Store summary statistics
      summary: {
        totalAmount: parsedData.summary.totalAmount,
        averageAmount: parsedData.summary.averageAmount,
        minAmount: parsedData.summary.minAmount,
        maxAmount: parsedData.summary.maxAmount,
      },
      // Store parsing metadata
      parseMetadata: {
        totalRowsParsed: parsedData.totalCount,
        validContactsFound: parsedData.validCount,
        errorCount: parsedData.errors.length,
        columnMapping: {
          nameColumn,
          phoneColumn,
          amountColumn,
        },
      },
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
        message: `Campaign created with ${parsedData.validCount} valid contacts from CSV`,
        parseStats: {
          totalRows: parsedData.totalCount,
          validContacts: parsedData.validCount,
          invalidRows: parsedData.totalCount - parsedData.validCount,
          errors: parsedData.errors,
          summary: parsedData.summary,
          contactPreview: parsedData.contacts.slice(0, 5), // Show first 5 contacts as preview
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
