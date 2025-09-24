import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import mongoose from "mongoose";
import dbConnect from "@/lib/connectDB";
import Cart from "@/models/Cart.model";
import Product from "@/models/Product.model";
import User from "@/models/User.model";
import { authOptions } from "../auth/[...nextAuth]/options";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userId = user._id;
    const body = await request.json();
    const { productId, variantSku, quantity } = body;

    if (!productId || !quantity) {
      return NextResponse.json(
        { message: "Missing required fields" },
        { status: 400 }
      );
    }

    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { message: "Product not found" },
        { status: 404 }
      );
    }

    const priceAtAdd = product.price;

    let cart = await Cart.findOne({ userId });
    if (!cart) {
      cart = new Cart({ userId, items: [] });
    }

    const existingItem = cart.items.find(
      (item) =>
        item.productId.toString() === productId &&
        item.variantSku === variantSku
    );

    if (existingItem) {
      existingItem.quantity += quantity;
      existingItem.priceAtAdd = priceAtAdd;
      existingItem.addedAt = new Date();
    } else {
      cart.items.push({
        productId,
        variantSku,
        quantity,
        priceAtAdd,
        addedAt: new Date(),
      });
    }

    await cart.save();

    return NextResponse.json(
      { message: "Product added to cart", cart },
      { status: 200 }
    );
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { message: "Server error", error },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    await dbConnect();
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const user = await User.findOne({ email: session.user.email });
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    const userId = user._id;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      model: Product,
      select: "name price images variants",
    });

    if (!cart) {
      return NextResponse.json(
        { items: [], shippingCost: 0, taxAmount: 0, totalAmount: 0 },
        { status: 200 }
      );
    }

    const items = cart.items.map((item) => {
      const product = item.productId as unknown as {
        _id: mongoose.Types.ObjectId;
        name: string;
        price: number;
        images: string[];
      };

      const effectivePrice = item.priceAtAdd || product.price;

      return {
        productId: product._id,
        name: product.name,
        images: product.images,
        basePrice: product.price,
        quantity: item.quantity,
        priceAtAdd: effectivePrice,
        subtotal: item.quantity * effectivePrice,
      };
    });

    return NextResponse.json(
      {
        items,
        shippingCost: cart.shippingCost,
        taxAmount: cart.taxAmount,
        totalAmount: cart.totalAmount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}


