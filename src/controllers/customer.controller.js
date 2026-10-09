import crypto from "crypto";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";
import Order from "../models/order.model.js";

// ==========================================
// 1. POST /register - Đăng ký tài khoản
// ==========================================
export const registerCustomer = async (req, res) => {
    try {
        const { name, email, age, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        // Kiểm tra email đã tồn tại hay chưa
        const existingCustomer = await Customer.findOne({ email: normalizedEmail });
        if (existingCustomer) {
            return res.status(409).json({
                message: "Email already exists",
                data: null,
            });
        }

        // Mã hóa mật khẩu với bcrypt
        const saltRounds = Number(process.env.BCRYPT_SALT_ROUNDS) || 10;
        const hashedPassword = await bcrypt.hash(password, saltRounds);

        // id được sinh ra ngẫu nhiên bằng crypto
        const randomId = crypto.randomUUID();

        // Tạo khách hàng mới
        const newCustomer = await Customer.create({
            id: randomId,
            name: name.trim(),
            email: normalizedEmail,
            age: Number(age),
            password: hashedPassword,
        });

        // Trả về thông tin khách hàng mới thêm (ẩn password)
        const customerData = newCustomer.toObject();
        delete customerData.password;
        delete customerData.refreshToken;

        return res.status(201).json({
            message: "Customer registered successfully",
            data: customerData,
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                message: "Email already exists",
                data: null,
            });
        }
        return res.status(500).json({
            message: "Internal server error during registration",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// 2. POST /login - Đăng nhập tài khoản
// ==========================================
export const loginCustomer = async (req, res) => {
    try {
        const { email, password } = req.body;
        const normalizedEmail = email.trim().toLowerCase();

        // Tìm khách hàng theo email
        const customer = await Customer.findOne({ email: normalizedEmail });
        if (!customer) {
            return res.status(401).json({
                message: "Invalid email or password",
                data: null,
            });
        }

        // So sánh mật khẩu đã mã hóa
        const isPasswordMatch = await bcrypt.compare(password, customer.password);
        if (!isPasswordMatch) {
            return res.status(401).json({
                message: "Invalid email or password",
                data: null,
            });
        }

        // Lấy secret keys và thời gian hết hạn từ env
        const accessSecret = process.env.JWT_ACCESS_SECRET || "VIETANH_ACCESS_SECRET_KEY_2026";
        const refreshSecret = process.env.JWT_REFRESH_SECRET || "VIETANH_REFRESH_SECRET_KEY_2026";
        const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";
        const refreshExpiresIn = process.env.REFRESH_TOKEN_EXPIRES_IN || "7d";

        // Tạo access_token và refresh_token
        const tokenPayload = {
            id: customer.id,
            _id: customer._id,
            name: customer.name,
            email: customer.email,
        };

        const accessToken = jwt.sign(tokenPayload, accessSecret, { expiresIn: accessExpiresIn });
        const refreshToken = jwt.sign(
            { id: customer.id, _id: customer._id },
            refreshSecret,
            { expiresIn: refreshExpiresIn }
        );

        // Lưu refresh token vào DB
        customer.refreshToken = refreshToken;
        await customer.save();

        // Trả về thông tin đăng nhập thành công
        const customerData = customer.toObject();
        delete customerData.password;
        delete customerData.refreshToken;

        return res.status(200).json({
            message: "Login successful",
            access_token: accessToken,
            refresh_token: refreshToken,
            data: customerData,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error during login",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// POST /refresh-token - Cấp lại access_token
// ==========================================
export const refreshTokenHandler = async (req, res) => {
    try {
        const { refresh_token } = req.body ?? {};
        if (!refresh_token) {
            return res.status(400).json({
                message: "Missing required field: refresh_token",
                data: null,
            });
        }

        const refreshSecret = process.env.JWT_REFRESH_SECRET || "VIETANH_REFRESH_SECRET_KEY_2026";
        const accessSecret = process.env.JWT_ACCESS_SECRET || "VIETANH_ACCESS_SECRET_KEY_2026";
        const accessExpiresIn = process.env.ACCESS_TOKEN_EXPIRES_IN || "1h";

        let decoded;
        try {
            decoded = jwt.verify(refresh_token, refreshSecret);
        } catch (jwtErr) {
            return res.status(401).json({
                message: "Invalid or expired refresh token",
                error: jwtErr.message,
                data: null,
            });
        }

        const customer = await Customer.findOne({
            $or: [{ id: decoded.id }, { _id: decoded._id || decoded.id }],
            refreshToken: refresh_token,
        });

        if (!customer) {
            return res.status(401).json({
                message: "Refresh token is invalid or has been revoked",
                data: null,
            });
        }

        const newAccessToken = jwt.sign(
            {
                id: customer.id,
                _id: customer._id,
                name: customer.name,
                email: customer.email,
            },
            accessSecret,
            { expiresIn: accessExpiresIn }
        );

        return res.status(200).json({
            message: "Token refreshed successfully",
            access_token: newAccessToken,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error during token refresh",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// 3. GET /users/:id/orders - Lấy đơn hàng của user
// ==========================================
export const getUserOrders = async (req, res) => {
    try {
        const { id } = req.params;

        // Yêu cầu: User chỉ xem được thông tin orders của bản thân mình
        const currentUserId = req.user.id;
        const currentUserObjectId = req.user._id ? req.user._id.toString() : null;

        if (id !== currentUserId && id !== currentUserObjectId) {
            return res.status(403).json({
                message: "Forbidden: You are only allowed to view your own orders",
                data: null,
            });
        }

        // Tìm tất cả đơn hàng thuộc về customer này (hỗ trợ cả id string và ObjectId)
        const orders = await Order.find({
            $or: [{ customerId: id }, { customerId: currentUserId }, { customerId: currentUserObjectId }],
        }).sort({ createdAt: -1 });

        return res.status(200).json({
            message: "User orders retrieved successfully",
            total: orders.length,
            data: orders,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error retrieving user orders",
            error: error.message,
            data: null,
        });
    }
};

// GET /profile - Lấy thông tin tài khoản hiện tại của user
export const getProfile = async (req, res) => {
    return res.status(200).json({
        message: "Profile retrieved successfully",
        data: req.user,
    });
};
