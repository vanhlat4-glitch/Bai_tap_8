import { Router } from "express";
import {
    registerCustomer,
    loginCustomer,
    refreshTokenHandler,
    getUserOrders,
    getProfile,
} from "../controllers/customer.controller.js";
import {
    validateRegister,
    validateLogin,
} from "../middlewares/customer.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const CustomerRouter = Router();

// 1. POST /register - Đăng ký tài khoản khách hàng
CustomerRouter.post("/register", validateRegister, registerCustomer);

// 2. POST /login - Đăng nhập tài khoản, trả về access_token và refresh_token
CustomerRouter.post("/login", validateLogin, loginCustomer);

// Cấp lại access_token khi hết hạn
CustomerRouter.post("/refresh-token", refreshTokenHandler);

// Xem thông tin cá nhân của user đang đăng nhập
CustomerRouter.get("/profile", authenticate, getProfile);

// 3. GET /users/:id/orders - Lấy danh sách orders của một user (Chỉ bản thân xem được)
CustomerRouter.get("/users/:id/orders", authenticate, getUserOrders);

export default CustomerRouter;
