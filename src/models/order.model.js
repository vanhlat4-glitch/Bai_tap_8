import mongoose from "mongoose";
import crypto from "crypto";

const orderSchema = new mongoose.Schema(
    {
        orderId: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        customerId: {
            type: String,
            required: [true, "customerId is required"],
            index: true,
        },
        productId: {
            type: String,
            required: [true, "productId is required"],
            index: true,
        },
        quantity: {
            type: Number,
            required: [true, "Quantity is required"],
            min: [1, "Quantity must be at least 1"],
        },
        totalPrice: {
            type: Number,
            required: [true, "totalPrice is required"],
            min: [0, "totalPrice cannot be negative"],
        },
    },
    {
        timestamps: true,
        collection: "orders",
    }
);

const Order = mongoose.model("Order", orderSchema);
export default Order;
