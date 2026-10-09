import crypto from "crypto";
import Product from "../models/product.model.js";

// POST /products - Tạo sản phẩm mới
export const createProduct = async (req, res) => {
    try {
        const { name, price, quantity } = req.body ?? {};

        if (!name || price === undefined || quantity === undefined) {
            return res.status(400).json({
                message: "Missing required fields: name, price, and quantity are required",
                data: null,
            });
        }

        const numPrice = Number(price);
        const numQuantity = Number(quantity);

        if (isNaN(numPrice) || numPrice < 0) {
            return res.status(400).json({
                message: "Price must be a non-negative number",
                data: null,
            });
        }

        if (isNaN(numQuantity) || numQuantity < 0 || !Number.isInteger(numQuantity)) {
            return res.status(400).json({
                message: "Quantity must be a non-negative integer",
                data: null,
            });
        }

        const newProduct = await Product.create({
            id: crypto.randomUUID(),
            name: name.trim(),
            price: numPrice,
            quantity: numQuantity,
        });

        return res.status(201).json({
            message: "Product created successfully",
            data: newProduct,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error creating product",
            error: error.message,
            data: null,
        });
    }
};

// GET /products - Lấy danh sách sản phẩm
export const getProducts = async (req, res) => {
    try {
        const products = await Product.find().sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Products retrieved successfully",
            total: products.length,
            data: products,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error retrieving products",
            error: error.message,
            data: null,
        });
    }
};

// GET /products/:id - Lấy thông tin 1 sản phẩm
export const getProductById = async (req, res) => {
    try {
        const { id } = req.params;
        const product = await Product.findOne({
            $or: [{ id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : null }],
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                data: null,
            });
        }

        return res.status(200).json({
            message: "Product retrieved successfully",
            data: product,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error retrieving product",
            error: error.message,
            data: null,
        });
    }
};

// POST /products/seed - Tạo sẵn dữ liệu mẫu cho sản phẩm
export const seedProducts = async (req, res) => {
    try {
        const sampleProducts = [
            { id: crypto.randomUUID(), name: "MacBook Air M2 13-inch", price: 24990000, quantity: 20 },
            { id: crypto.randomUUID(), name: "iPhone 15 Pro Max 256GB", price: 29990000, quantity: 15 },
            { id: crypto.randomUUID(), name: "Bàn phím cơ Logitech MX Mechanical", price: 3490000, quantity: 50 },
            { id: crypto.randomUUID(), name: "Chuột không dây Logitech MX Master 3S", price: 2490000, quantity: 40 },
        ];

        await Product.deleteMany({});
        const inserted = await Product.insertMany(sampleProducts);

        return res.status(201).json({
            message: "Seeded products successfully",
            total: inserted.length,
            data: inserted,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error seeding products",
            error: error.message,
            data: null,
        });
    }
};
