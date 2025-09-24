import dbConnect from "@/lib/connectDB";
import Contact from "@/models/Contact.model";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    await dbConnect();

    const body = await req.json();

    const { name, email, phoneNo, subject, message } = body;

    if (!name || !email || !phoneNo || !message || !subject ) {
      return NextResponse.json(
        { error: "Missing or invalid required fields" },
        { status: 400 }
      );
    }

    const newContact = await Contact.create({
      name, email, phoneNo, subject, message
    });

    return NextResponse.json(
      {
        success: true,
        message: "Contact created successfully",
        room: newContact,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/contact", { error });
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
