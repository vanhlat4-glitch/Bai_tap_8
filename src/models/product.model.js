import mongoose from "mongoose";
import crypto from "crypto";

const productSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Product name is required"],
            trim: true,
        },
        price: {
            type: Number,
            required: [true, "Product price is required"],
            min: [0, "Price cannot be negative"],
        },
        quantity: {
            type: Number,
            required: [true, "Product quantity is required"],
            min: [0, "Quantity cannot be negative"],
            default: 0,
        },
    },
    {
        timestamps: true,
        collection: "products",
    }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
