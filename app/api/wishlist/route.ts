import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/connectDB";
import Wishlist from "@/models/Wishlist.model";
import Product from "@/models/Product.model";
import { getServerSession } from "next-auth/next";
import { authOptions } from "../auth/[...nextauth]/options";
import mongoose from "mongoose";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { message: "Product ID is required" },
        { status: 400 }
      );
    }

    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return NextResponse.json(
        { message: "Invalid Product ID" },
        { status: 400 }
      );
    }

    const productExists = await Product.findById(productId);
    if (!productExists) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    let wishlist = await Wishlist.findOne({ userId: session.user.id });
    if (!wishlist) {
      wishlist = new Wishlist({ userId: session.user.id, items: [] });
    }

    const exists = wishlist.items.some(
      (item) => item.productId.toString() === productId
    );
    if (exists) {
      return NextResponse.json(
        { message: "Product already in wishlist" },
        { status: 200 }
      );
    }

    wishlist.items.push({ productId, addedAt: new Date() });
    await wishlist.save();

    return NextResponse.json(
      { message: "Product added to wishlist", wishlist },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Fetch wishlist and populate product basic fields
    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: "items.productId",
      model: Product,
      select: "name price images", // only fetch fields we need
    });

    if (!wishlist || !wishlist.items || wishlist.items.length === 0) {
      return NextResponse.json({ products: [] }, { status: 200 });
    }

    // Map items to a lightweight product list for client
    const products = wishlist.items.map((item) => {
      // When populated, product is an object; otherwise it's an ObjectId
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const populatedProduct: any = item.productId;

      const productId =
        populatedProduct && populatedProduct._id
          ? populatedProduct._id.toString()
          : item.productId?.toString?.() || null;

      const name = populatedProduct?.name ?? null;
      const price = populatedProduct?.price ?? null;
      const image =
        Array.isArray(populatedProduct?.images) &&
        populatedProduct.images.length
          ? populatedProduct.images[0]
          : null;

      return {
        productId,
        name,
        price,
        image,
        addedAt: item.addedAt ?? null,
      };
    });

    return NextResponse.json({ products }, { status: 200 });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
