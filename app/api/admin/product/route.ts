import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import dbConnect from "@/lib/connectDB";
import Product, { IProduct, IProductVariant } from "@/models/Product.model";
import User from "@/models/User.model";
import { authOptions } from "../../auth/[...nextauth]/options";

export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const adminUser = await User.findOne({ email: session.user.email });
    if (!adminUser || adminUser.role !== "admin") {
      return NextResponse.json({ message: "Forbidden - admin only" }, { status: 403 });
    }

    // 👇 Parse body as Partial<IProduct> (not any)
    const body: Partial<IProduct> = await request.json();

    const {
      name,
      brandName,
      model,
      price,
      productCode,
      mainCategory,
      subCategory,
      tags,
      variants,
      description,
      images,
      specifications,
      minStockAlert,
      isActive,
      isFeatured,
      metaTitle,
      metaDescription,
    } = body;

    if (!name || !brandName || price == null || !productCode || !mainCategory || !subCategory) {
      return NextResponse.json({ message: "Missing required product fields" }, { status: 400 });
    }

    if (!Array.isArray(variants) || variants.length === 0) {
      return NextResponse.json({ message: "At least one variant is required" }, { status: 400 });
    }

    if (!description || !images || !Array.isArray(images) || images.length === 0) {
      return NextResponse.json({ message: "Description and at least one image are required" }, { status: 400 });
    }

    if (!specifications || !specifications.size || !specifications.binding || !specifications.paperGsm || !specifications.coverType) {
      return NextResponse.json({ message: "Invalid specifications" }, { status: 400 });
    }

    // ✅ Collect SKUs and validate
    const skus: string[] = [];
    for (const v of variants as IProductVariant[]) {
      if (!v.sku || !v.pageType || v.quantity < 1 || v.stock < 0) {
        return NextResponse.json({ message: "Invalid variant data" }, { status: 400 });
      }
      skus.push(v.sku.trim());
    }
    if (new Set(skus).size !== skus.length) {
      return NextResponse.json({ message: "Duplicate SKUs in request" }, { status: 400 });
    }

    // Normalize productCode, tags, images
    const normalizedProductCode = String(productCode).trim().toUpperCase();
    const normalizedTags = Array.isArray(tags) ? tags.map((t) => String(t).trim().toLowerCase()) : [];
    const normalizedImages = images.map((img) => String(img).trim());

    // Check uniqueness
    const existingProduct = await Product.findOne({ productCode: normalizedProductCode });
    if (existingProduct) {
      return NextResponse.json({ message: "Product code already exists" }, { status: 409 });
    }

    const existingWithSku = await Product.findOne({ "variants.sku": { $in: skus } });
    if (existingWithSku) {
      const colliding: string[] = (existingWithSku.variants as IProductVariant[])
        .map((v: IProductVariant): string => v.sku)
        .filter((sku: string): boolean => skus.includes(sku));
      return NextResponse.json({ message: "Variant SKU already exists", colliding }, { status: 409 });
    }

    // ✅ productPayload is Partial<IProduct>
    const productPayload: Partial<IProduct> = {
      name: name.trim(),
      brandName: brandName.trim(),
      model: model?.trim(),
      price,
      productCode: normalizedProductCode,
      mainCategory,
      subCategory: subCategory.trim(),
      tags: normalizedTags,
      variants: variants as IProductVariant[],
      description: description.trim(),
      images: normalizedImages,
      specifications,
      minStockAlert: minStockAlert ?? 5,
      isActive: isActive ?? true,
      isFeatured: isFeatured ?? false,
      metaTitle: metaTitle?.trim(),
      metaDescription: metaDescription?.trim(),
    };

    const created = await Product.create(productPayload);

    return NextResponse.json({ message: "Product created", product: created }, { status: 201 });
  } catch (error) {
    console.error("Create product error:", error);
    return NextResponse.json({ message: "Internal Server Error" }, { status: 500 });
  }
}
