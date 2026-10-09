import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";

import CustomerRouter from "./src/routes/customer.routes.js";
import ProductRouter from "./src/routes/product.routes.js";
import OrderRouter from "./src/routes/order.routes.js";

// 1. Kiểm tra biến môi trường
const mongoUri = process.env.MONGODB_URI || process.env.URI_MONGO;
const port = process.env.PORT || 3008;

if (!mongoUri) {
    console.error("Missing required environment variable: MONGODB_URI or URI_MONGO");
    process.exit(1);
}

// 2. Kết nối cơ sở dữ liệu MongoDB Atlas
try {
    await mongoose.connect(mongoUri);
    console.log("Connected to MongoDB successfully!");
} catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
}

// 3. Khởi tạo ứng dụng Express
const app = express();

// Middleware đọc JSON từ request body
app.use(express.json());

// Tuyến đường kiểm tra server
app.get("/", (req, res) => {
    res.json({
        message: "BaiTap Lesson 8 API is running! (Authentication & JWT)",
        routes: {
            auth: {
                register: "POST /register",
                login: "POST /login",
                refreshToken: "POST /refresh-token",
                profile: "GET /profile (Bearer token required)",
            },
            orders: {
                getUserOrders: "GET /users/:id/orders (Bearer token required - Only owner)",
                createOrder: "POST /orders (Bearer token required)",
                updateOrder: "PUT /orders/:id (Bearer token required - Only owner)",
                deleteOrder: "DELETE /orders/:id (Bearer token required - Only owner)",
                getAllOrders: "GET /orders (Bearer token required)",
                getOrderDetail: "GET /orders/:id (Bearer token required)",
            },
            products: {
                getProducts: "GET /products",
                createProduct: "POST /products",
                getProductDetail: "GET /products/:id",
                seedProducts: "POST /products/seed",
            },
        },
    });
});

// 4. Đăng ký các Router theo mô hình MVC
app.use("/", CustomerRouter);
app.use("/products", ProductRouter);
app.use("/orders", OrderRouter);

// Middleware xử lý 404 Not Found
app.use((req, res) => {
    res.status(404).json({
        message: `Endpoint ${req.method} ${req.originalUrl} not found`,
        data: null,
    });
});

// Middleware xử lý lỗi tập trung (Global error handler)
app.use((err, req, res, next) => {
    console.error("Internal Server Error:", err);
    res.status(500).json({
        message: "Internal server error",
        error: err.message,
        data: null,
    });
});

// 5. Khởi động server
app.listen(Number(port), () => {
    console.log(`Server is running at: http://localhost:${port}`);
});
