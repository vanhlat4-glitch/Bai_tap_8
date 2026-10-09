import crypto from "crypto";

// Middleware kiểm tra tồn tại và tính hợp lệ các trường khi tạo đơn hàng
export const validateCreateOrder = (req, res, next) => {
    const { productId, quantity } = req.body ?? {};

    // 1. Kiểm tra sự tồn tại của các trường bắt buộc
    if (!productId || quantity === undefined || quantity === null) {
        return res.status(400).json({
            message: "Missing required fields: productId and quantity are required",
            data: null,
        });
    }

    if (typeof productId !== "string" || productId.trim() === "") {
        return res.status(400).json({
            message: "productId must be a non-empty string",
            data: null,
        });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
        return res.status(400).json({
            message: "Quantity must be a positive integer (>= 1)",
            data: null,
        });
    }

    // Nếu người dùng không truyền orderId, tự động tạo mới bằng crypto
    if (!req.body.orderId || typeof req.body.orderId !== "string" || req.body.orderId.trim() === "") {
        req.body.orderId = crypto.randomUUID();
    }

    next();
};

// Middleware kiểm tra khi cập nhật đơn hàng
export const validateUpdateOrder = (req, res, next) => {
    const { quantity } = req.body ?? {};

    if (quantity === undefined || quantity === null) {
        return res.status(400).json({
            message: "Missing required field: quantity is required",
            data: null,
        });
    }

    const numQuantity = Number(quantity);
    if (isNaN(numQuantity) || numQuantity <= 0 || !Number.isInteger(numQuantity)) {
        return res.status(400).json({
            message: "Quantity must be a positive integer (>= 1)",
            data: null,
        });
    }

    next();
};
