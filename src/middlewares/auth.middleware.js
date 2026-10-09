import jwt from "jsonwebtoken";
import Customer from "../models/customer.model.js";

// Middleware xác thực Access Token từ Header Authorization: Bearer <token>
export const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader) {
            return res.status(401).json({
                message: "Unauthorized: Missing Authorization header",
                data: null,
            });
        }

        const parts = authHeader.split(" ");
        if (parts.length !== 2 || parts[0] !== "Bearer") {
            return res.status(401).json({
                message: "Unauthorized: Token must follow 'Bearer <token>' format",
                data: null,
            });
        }

        const token = parts[1];
        const secret = process.env.JWT_ACCESS_SECRET || "VIETANH_ACCESS_SECRET_KEY_2026";

        let decoded;
        try {
            decoded = jwt.verify(token, secret);
        } catch (jwtError) {
            if (jwtError.name === "TokenExpiredError") {
                return res.status(401).json({
                    message: "Unauthorized: Access token has expired",
                    data: null,
                });
            }
            return res.status(401).json({
                message: "Unauthorized: Invalid access token",
                error: jwtError.message,
                data: null,
            });
        }

        // Tìm customer theo id từ decoded token
        const customer = await Customer.findOne({
            $or: [{ id: decoded.id }, { _id: decoded._id || decoded.id }],
        }).select("-password");

        if (!customer) {
            return res.status(401).json({
                message: "Unauthorized: User not found or no longer exists",
                data: null,
            });
        }

        // Gán thông tin user vào req để controller tiếp theo sử dụng
        req.user = customer;
        next();
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error during authentication",
            error: error.message,
            data: null,
        });
    }
};
