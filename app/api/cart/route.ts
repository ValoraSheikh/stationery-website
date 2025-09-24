import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { getServerSession } from "next-auth/next";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import { authOptions } from "../auth/[...nextAuth]/options";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const body = await request.json();
    const { productId, variantSku, quantity } = body;

    if (!productId || !quantity) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 });
    }

    // Fetch product to get current price
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json({ message: "Product not found" }, { status: 404 });
    }

    const priceAtAdd = product.price; // adjust if variant price exists

    // Find or create cart
    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    // Check if product + variant already exists
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.variantSku === variantSku
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceAtAdd = priceAtAdd;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({ productId, variantSku, quantity, priceAtAdd, addedAt: new Date() });
    }

    await cart.save();

    return NextResponse.json({ message: "Product added to cart", cart }, { status: 200 });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json({ message: "Server error", error }, { status: 500 });
  }
}
