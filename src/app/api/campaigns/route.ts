import { connectDB } from "@/lib/db";
import campaigns from "@/models/campaigns";
import company from "@/models/campany";
import { parseCSVFromUrl } from "@/lib/csvParser";
import { NextRequest, NextResponse } from "next/server";

const VAPI_BASE_URL = "https://api.vapi.ai";
const VAPI_API_KEY = process.env.VAPI_API_KEY;
const VAPI_ASSISTANT_ID = process.env.VAPI_ASSISTANT_ID;
const VAPI_PHONE_NUMBER_ID = process.env.VAPI_PHONE_NUMBER_ID;

// Simplified function to format Indian phone numbers to E.164 format
function formatToE164(phone: string): string {
  if (!phone) return "";

  // Remove all non-digit characters
  const cleanPhone = phone.replace(/\D/g, "");

  if (!cleanPhone) return "";

  // Handle Indian phone number patterns

  // Case 1: 10-digit number starting with 6,7,8,9 (Indian mobile)
  if (cleanPhone.length === 10 && /^[6-9]/.test(cleanPhone)) {
    return `+91${cleanPhone}`;
  }

  // Case 2: 11-digit number starting with 0 (remove leading 0)
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
    const withoutZero = cleanPhone.substring(1);
    if (/^[6-9]/.test(withoutZero)) {
      return `+91${withoutZero}`;
    }
  }

  // Case 3: 12-digit number starting with 91 (already has country code)
  if (cleanPhone.length === 12 && cleanPhone.startsWith("91")) {
    const numberPart = cleanPhone.substring(2);
    if (/^[6-9]/.test(numberPart)) {
      return `+${cleanPhone}`;
    }
  }

  // Case 4: 13-digit number starting with 091 (remove leading 0 from country code)
  if (cleanPhone.length === 13 && cleanPhone.startsWith("091")) {
    const withoutZero = cleanPhone.substring(1);
    const numberPart = withoutZero.substring(2);
    if (/^[6-9]/.test(numberPart)) {
      return `+${withoutZero}`;
    }
  }

  // If none of the above patterns match, try adding +91 as fallback
  if (cleanPhone.length >= 6 && cleanPhone.length <= 15) {
    console.warn(`Unusual phone number format, adding +91: ${phone}`);
    return `+91${cleanPhone}`;
  }

  // If nothing works, log error and return with +91 prefix
  console.warn(`Could not properly format phone number: ${phone}`);
  return `+91${cleanPhone}`;
}

// Helper function to validate Indian phone number in E.164 format
function validateE164(phone: string): boolean {
  // Indian E.164 format: +91 followed by 10 digits starting with 6,7,8,9
  const indianE164Regex = /^\+91[6-9]\d{9}$/;
  return indianE164Regex.test(phone);
}

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

// POST - Create new campaign with CSV parsing and metadata
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log("POST /api/campaigns called");
    const {
      name,
      description,
      csvUrl,
      company_id,
      scheduleAt, // Optional: when to schedule the campaign
      csvOptions, // Optional: CSV parsing options
    } = body;

    if (!name || !company_id || !csvUrl) {
      return NextResponse.json(
        {
          error: "Missing required fields: name, company_id, csvUrl",
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

    // Parse CSV data
    let parsedData;
    try {
      parsedData = await parseCSVFromUrl(csvUrl, {
        nameColumn: "name",
        phoneColumn: "number",
        amountColumn: "amount_owed",
        requireAllFields: true,
        ...csvOptions, // Allow override of default options
      });
      console.log(parsedData);
    } catch (parseError) {
      console.error("CSV parsing error:", parseError);
      return NextResponse.json(
        {
          error: "Failed to parse CSV file",
          details:
            parseError instanceof Error
              ? parseError.message
              : "Unknown parsing error",
        },
        { status: 400 }
      );
    }

    // Check if we have any valid contacts
    if (parsedData.validCount === 0) {
      return NextResponse.json(
        {
          error: "No valid contacts found in CSV",
          details: parsedData.errors,
          totalRows: parsedData.totalCount,
        },
        { status: 400 }
      );
    }

    console.log(`Parsed ${parsedData.validCount} valid contacts from CSV`);
    console.log("CSV Summary:", parsedData.summary);

    // Format and validate phone numbers
    const formattedContacts = [];
    const invalidPhoneNumbers = [];

    for (const contact of parsedData.contacts) {
      try {
        // Format phone number for India
        const formattedPhone = formatToE164(contact.phoneNumber);

        // Validate the formatted number
        if (validateE164(formattedPhone)) {
          formattedContacts.push({
            ...contact,
            formattedPhone,
            originalPhone: contact.phoneNumber,
          });
        } else {
          invalidPhoneNumbers.push({
            original: contact.phoneNumber,
            formatted: formattedPhone,
            name: contact.name,
          });
        }
      } catch (error) {
        invalidPhoneNumbers.push({
          original: contact.phoneNumber,
          error: error instanceof Error ? error.message : "Unknown error",
          name: contact.name,
        });
      }
    }

    // Log phone number formatting results
    console.log(
      `Successfully formatted ${formattedContacts.length} phone numbers`
    );
    if (invalidPhoneNumbers.length > 0) {
      console.warn(
        `Failed to format ${invalidPhoneNumbers.length} phone numbers:`,
        invalidPhoneNumbers
      );
    }

    // Prepare VAPI campaign data with customer-specific variables
    const vapiCampaignData = {
      name,
      assistantId: VAPI_ASSISTANT_ID,
      phoneNumberId: VAPI_PHONE_NUMBER_ID,
      customers: formattedContacts.map((contact) => ({
        number: contact.formattedPhone, // Use the properly formatted E.164 number
        name: contact.name,
        // Optional standard fields
        email: contact.originalRow.email || undefined,
        externalId:
          contact.originalRow.external_id ||
          contact.originalRow.id ||
          undefined,
        // Use assistantOverrides to pass custom data for each customer
        assistantOverrides: {
          variableValues: {
            // Pass customer-specific data that your assistant can use
            name: contact.name,
            amount_owed: contact.amountOwed,
            formattedAmount: new Intl.NumberFormat("en-IN", {
              style: "currency",
              currency: "INR",
            }).format(contact.amountOwed),
            phoneNumber: contact.originalPhone, // Keep original for reference
            formattedPhoneNumber: contact.formattedPhone,
            // Add any other CSV columns as variables
            ...Object.fromEntries(
              Object.entries(contact.originalRow).filter(
                ([key, value]) =>
                  value !== undefined &&
                  value !== "" &&
                  !["name", "number", "amount_owed"].includes(key)
              )
            ),
          },
        },
      })),
      ...(scheduleAt && { scheduleAt }),
    };

    console.log(
      `Creating VAPI campaign with ${vapiCampaignData.customers.length} customers`
    );
    console.log("Sample customer format:", vapiCampaignData.customers[0]);

    // Create VAPI campaign
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
        { error: "Failed to create VAPI campaign", details: error },
        { status: vapiResponse.status }
      );
    }

    const vapiCampaign = await vapiResponse.json();

    // Save campaign in local DB with additional metadata
    const newCampaign = await campaigns.create({
      name,
      description,
      csvUrl,
      company_id,
      vapiCampaignId: vapiCampaign.id,
      status: vapiCampaign.status || "created",
      total_contacts: formattedContacts.length, // Use successfully formatted contacts
      default_country: "IN",
      default_country_code: "+91",
      // Store CSV parsing results for reference
      csv_stats: {
        totalRows: parsedData.totalCount,
        validContacts: parsedData.validCount,
        successfullyFormattedPhones: formattedContacts.length,
        invalidPhoneNumbers: invalidPhoneNumbers.length,
        errors: parsedData.errors,
        summary: parsedData.summary,
        phoneFormattingErrors: invalidPhoneNumbers,
      },
      // Store the customer metadata here in your local DB for reference
      customer_metadata: formattedContacts.map((contact) => ({
        name: contact.name,
        // phoneNumber: contact.originalPhone,
        // formattedPhoneNumber: contact.formattedPhone,
        amountOwed: contact.amountOwed,
        formattedAmount: new Intl.NumberFormat("en-IN", {
          style: "currency",
          currency: "INR",
        }).format(contact.amountOwed),
        originalRow: contact.originalRow,
      })),
    });

    // Update company's campaign list
    console.log("Updating company's campaign list");
    const updatedCompany = await company.findByIdAndUpdate(company_id, {
      $push: { campaigns: newCampaign._id },
    });
    console.log("Updated company:", updatedCompany);

    const populatedCampaign = await campaigns
      .findById(newCampaign._id)
      .populate("company_id");

    return NextResponse.json(
      {
        campaign: populatedCampaign,
        csvStats: {
          ...parsedData,
          phoneFormatting: {
            successful: formattedContacts.length,
            failed: invalidPhoneNumbers.length,
            failedNumbers: invalidPhoneNumbers,
          },
        },
        vapiCampaignId: vapiCampaign.id,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating campaign:", error);
    return NextResponse.json(
      {
        error: "Failed to create campaign",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 }
    );
  }
}