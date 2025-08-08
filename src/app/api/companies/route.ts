import { connectDB } from "@/lib/db";
import company from "@/models/campany";
import { NextRequest, NextResponse } from "next/server";


export async function GET() {
  try {
    
    await connectDB();
    const companies = await company.find();
    console.log(companies);
    return NextResponse.json(companies, { status: 200 });
  } catch (error) {
    console.error('Error fetching companies:', error);
    return NextResponse.json(
      { error: 'Failed to fetch companies' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/company called');

    const body = await request.json(); // ✅ Fix here
    const { name, email } = body;

    await connectDB();

    const newCompany = await company.create({ name, email });

    return NextResponse.json(newCompany);
  } catch (error) {
    console.error('Error creating company:', error);
    return NextResponse.json({ error: 'Failed to create company' }, { status: 500 });
  }
}