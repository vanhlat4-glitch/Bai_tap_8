import mongoose from "mongoose";
import crypto from "crypto";

const customerSchema = new mongoose.Schema(
    {
        id: {
            type: String,
            default: () => crypto.randomUUID(),
            unique: true,
            index: true,
        },
        name: {
            type: String,
            required: [true, "Customer name is required"],
            trim: true,
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            unique: true,
            trim: true,
            lowercase: true,
            index: true,
        },
        age: {
            type: Number,
            required: [true, "Age is required"],
            min: [0, "Age must be a positive number"],
        },
        password: {
            type: String,
            required: [true, "Password is required"],
        },
        refreshToken: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
        collection: "customers",
    }
);

const Customer = mongoose.model("Customer", customerSchema);
export default Customer;
