import { Router } from "express";
import {
    createOrder,
    updateOrder,
    deleteOrder,
    getAllOrders,
    getOrderById,
} from "../controllers/order.controller.js";
import {
    validateCreateOrder,
    validateUpdateOrder,
} from "../middlewares/order.middleware.js";
import { authenticate } from "../middlewares/auth.middleware.js";

const OrderRouter = Router();

// 4. POST /orders - Tạo đơn hàng mới (Yêu cầu đăng nhập, kiểm tra body tồn tại các trường)
OrderRouter.post("/", authenticate, validateCreateOrder, createOrder);

// 5. PUT /orders/:id và /orders/:iid - Cập nhật đơn hàng (Chỉ bản thân được cập nhật)
OrderRouter.put("/:id", authenticate, validateUpdateOrder, updateOrder);

// 6. DELETE /orders/:id và /orders/:iid - Xoá đơn hàng (Chỉ bản thân được xoá)
OrderRouter.delete("/:id", authenticate, deleteOrder);

// Lấy danh sách tất cả đơn hàng
OrderRouter.get("/", authenticate, getAllOrders);

// Lấy chi tiết đơn hàng theo id
OrderRouter.get("/:id", authenticate, getOrderById);

export default OrderRouter;
