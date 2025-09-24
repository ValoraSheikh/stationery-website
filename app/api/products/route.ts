import { NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Product from "@/models/Product.model";

export async function GET(req: Request) {
  try {
    await dbConnect();

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    if (!category) {
      return NextResponse.json(
        { message: "Category query is required" },
        { status: 400 }
      );
    }

    const products = await Product.find({ mainCategory: category, isActive: true })
      .select("name brandName price images variants totalStock isFeatured createdAt")
      .sort({ createdAt: -1 });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching products by category:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
