import { Schema, model, models } from "mongoose";

export interface IProductVariant {
  _id?: string;
  pageType: "ruled" | "plain" | "grid" | "dotted";
  quantity: number; // number of pages/sheets
  color: string; // cover color
  additionalPrice: number; // extra price for this variant
  stock: number;
  sku: string; // variant-specific SKU
}

export interface IProduct {
  name: string;
  brandName: string;
  model?: string;
  price: number; // base price
  productCode: string; // unique product identifier
  
  // Categories
  mainCategory: "A4" | "A3" | "RoughNotenook" | "Diary" ;
  subCategory: string; // spiral-notebooks, composition-books, journals, etc.
  tags: string[]; // searchable keywords
  
  // Product variants (different combinations)
  variants: IProductVariant[];
  
  // Product details
  description: string;
  images: string[]; // product image URLs
  
  // Specifications (for notebooks)
  specifications: {
    size: "A4" | "A5" | "B5" | "letter" | "legal" | "pocket";
    binding: "spiral" | "perfect-bound" | "stapled" | "ring-bound";
    paperGsm: number;
    coverType: "soft" | "hard" | "plastic";
    ruled?: {
      lineSpacing: string;
      marginLeft: boolean;
    };
  };
  
  // Business fields
  totalStock: number; // calculated from all variants
  minStockAlert: number;
  isActive: boolean;
  isFeatured: boolean;
  
  // SEO & Marketing
  metaTitle?: string;
  metaDescription?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

const variantSchema = new Schema<IProductVariant>({
  pageType: {
    type: String,
    enum: ["ruled", "plain", "grid", "dotted"],
    required: [true, "Page type is required"],
  },
  quantity: {
    type: Number,
    required: [true, "Page quantity is required"],
    min: [1, "Quantity must be at least 1"],
  },
  color: {
    type: String,
    required: [true, "Cover color is required"],
    trim: true,
  },
  additionalPrice: {
    type: Number,
    default: 0,
    min: [0, "Additional price cannot be negative"],
  },
  stock: {
    type: Number,
    required: [true, "Stock is required"],
    min: [0, "Stock cannot be negative"],
  },
  sku: {
    type: String,
    required: [true, "Variant SKU is required"],
    unique: true,
    trim: true,
  }
});

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    brandName: {
      type: String,
      required: [true, "Brand name is required"],
      trim: true,
    },
    model: {
      type: String,
      trim: true,
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    productCode: {
      type: String,
      required: [true, "Product code is required"],
      unique: true,
      trim: true,
      uppercase: true,
    },
    
    mainCategory: {
      type: String,
      enum: ["A4", "A5", "A3", "RoughNotebook", "Diary"],
      required: [true, "Main category is required"],
    },
    subCategory: {
      type: String,
      required: [true, "Sub category is required"],
      trim: true,
    },
    tags: [{
      type: String,
      trim: true,
      lowercase: true,
    }],
    
    // Product variants
    variants: {
      type: [variantSchema],
      validate: {
        validator: function(variants: IProductVariant[]) {
          return variants.length > 0;
        },
        message: "At least one variant is required"
      }
    },
    
    // Product details
    description: {
      type: String,
      required: [true, "Product description is required"],
      minlength: [10, "Description must be at least 10 characters"],
    },
    images: [{
      type: String,
      required: true,
    }],
    
    // Specifications
    specifications: {
      size: {
        type: String,
        enum: ["A4", "A5", "B5", "letter", "legal", "pocket"],
        required: [true, "Size is required"],
      },
      binding: {
        type: String,
        enum: ["spiral", "perfect-bound", "stapled", "ring-bound"],
        required: [true, "Binding type is required"],
      },
      paperGsm: {
        type: Number,
        required: [true, "Paper GSM is required"],
        min: [50, "Paper GSM must be at least 50"],
        max: [300, "Paper GSM cannot exceed 300"],
      },
      coverType: {
        type: String,
        enum: ["soft", "hard", "plastic"],
        required: [true, "Cover type is required"],
      },
      ruled: {
        lineSpacing: {
          type: String,
          enum: ["8mm", "9mm", "college-ruled", "wide-ruled"],
        },
        marginLeft: {
          type: Boolean,
          default: false,
        }
      }
    },
    
    // Business fields
    totalStock: {
      type: Number,
      default: 0,
      min: [0, "Total stock cannot be negative"],
    },
    minStockAlert: {
      type: Number,
      default: 5,
      min: [0, "Min stock alert cannot be negative"],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isFeatured: {
      type: Boolean,
      default: false,
    },
    
    // SEO
    metaTitle: {
      type: String,
      maxlength: [60, "Meta title cannot exceed 60 characters"],
    },
    metaDescription: {
      type: String,
      maxlength: [160, "Meta description cannot exceed 160 characters"],
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
productSchema.index({ productCode: 1 }, { unique: true });
productSchema.index({ mainCategory: 1, subCategory: 1 });
productSchema.index({ brandName: 1 });
productSchema.index({ tags: 1 });
productSchema.index({ isActive: 1 });
productSchema.index({ isFeatured: 1 });
productSchema.index({ "variants.sku": 1 });
productSchema.index({ name: "text", description: "text", tags: "text" }); // Text search

productSchema.virtual('inStock').get(function(this: IProduct) {
  return this.totalStock > 0;
});

productSchema.virtual('lowStock').get(function(this: IProduct) {
  return this.totalStock <= this.minStockAlert;
});

productSchema.virtual('priceRange').get(function(this: IProduct) {
  if (!this.variants || this.variants.length === 0) {
    return { min: this.price, max: this.price };
  }
  
  const prices = this.variants.map(variant => this.price + variant.additionalPrice);
  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
});

// Pre-save middleware to calculate total stock
productSchema.pre('save', function(next) {
  if (this.isModified('variants')) {
    this.totalStock = this.variants.reduce((total, variant) => total + variant.stock, 0);
  }
  next();
});

productSchema.methods.getVariantBySku = function(sku: string) {
  return this.variants.find((variant: IProductVariant) => variant.sku === sku);
};

productSchema.methods.updateVariantStock = function(sku: string, newStock: number) {
  const variant = this.getVariantBySku(sku);
  if (!variant) {
    throw new Error('Variant not found');
  }
  
  variant.stock = newStock;
  this.totalStock = this.variants.reduce((total: number, v: IProductVariant) => total + v.stock, 0);
  
  return this.save();
};

productSchema.methods.addVariant = function(variantData: Omit<IProductVariant, '_id'>) {
  this.variants.push(variantData);
  this.totalStock = this.variants.reduce((total: number, v: IProductVariant) => total + v.stock, 0);
  
  return this.save();
};

const Product = models?.Product || model<IProduct>("Product", productSchema);
export default Product;