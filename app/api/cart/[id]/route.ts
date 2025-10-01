import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import mongoose from "mongoose";
import dbConnect from "@/lib/connectDB";
import Cart from "@/models/Cart.model";
import User from "@/models/User.model";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function DELETE(req: Request) {
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

    // get body
    const body = await req.json().catch(() => ({}));
    const { productId } = body;

    if (!productId) {
      return NextResponse.json(
        { message: "productId is required" },
        { status: 400 }
      );
    }

    if (!mongoose.isValidObjectId(productId)) {
      return NextResponse.json({ message: "Invalid productId" }, { status: 400 });
    }

    // remove the item just by productId
    const updatedCart = await Cart.findOneAndUpdate(
      { userId: user._id },
      {
        $pull: {
          items: {
            productId: new mongoose.Types.ObjectId(productId),
          },
        },
      },
      { new: true }
    );

    if (!updatedCart) {
      return NextResponse.json({ message: "Cart not found" }, { status: 404 });
    }

    return NextResponse.json(
      { message: "Item removed", cart: updatedCart },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error removing item from cart:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
