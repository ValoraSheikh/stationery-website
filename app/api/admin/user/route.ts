import dbConnect from "@/lib/connectDB";
import User from "@/models/User.model";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function GET() {
  await dbConnect();

  const session = await getServerSession(authOptions);
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }

  try {
    const users = await User.find().sort({ createdAt: -1 }).select("-password");
    return NextResponse.json(users);
    
  } catch (err) {
    return NextResponse.json({ error: "Failed to fetch users" }, { status: 500 });
  }
}
