import { connectDB } from "@/lib/db";
import Company from "@/models/campany";
import { NextResponse } from "next/server";
import '@/models/campaigns'  
import mongoose from "mongoose";
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();

    const { id } = await context.params; // ✅ Await here

    console.log('Registered models:', mongoose.modelNames());

    const companyDetails = await Company.findById(id).populate("campaigns");
    if (!companyDetails) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    console.log("company details:", companyDetails);
    return NextResponse.json(companyDetails, { status: 200 });
  } catch (error) {
    console.error("Error fetching company:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
