import crypto from "crypto";
import Order from "../models/order.model.js";
import Product from "../models/product.model.js";

// ==========================================
// 4. POST /orders - Viết API tạo đơn hàng
// ==========================================
export const createOrder = async (req, res) => {
    try {
        const { productId, quantity } = req.body;
        const finalOrderId = req.body.orderId || crypto.randomUUID();
        const numQuantity = Number(quantity);

        // Tìm sản phẩm theo id (hỗ trợ cả UUID string và ObjectId)
        const product = await Product.findOne({
            $or: [{ id: productId }, { _id: productId.match(/^[0-9a-fA-F]{24}$/) ? productId : null }],
        });

        if (!product) {
            return res.status(404).json({
                message: "Product not found",
                data: null,
            });
        }

        // Kiểm tra số lượng sản phẩm còn lại trong kho
        if (product.quantity < numQuantity) {
            return res.status(400).json({
                message: `Insufficient inventory: only ${product.quantity} items left in stock`,
                data: null,
            });
        }

        // Tính totalPrice = product.price * quantity theo yêu cầu
        const totalPrice = product.price * numQuantity;

        // Giảm số lượng của sản phẩm trong kho khi tạo đơn hàng
        product.quantity -= numQuantity;
        await product.save();

        // Mặc định customerId sẽ là của người đang đăng nhập
        const currentUserId = req.user.id || req.user._id.toString();

        const newOrder = await Order.create({
            orderId: finalOrderId,
            customerId: currentUserId,
            productId: product.id || product._id.toString(),
            quantity: numQuantity,
            totalPrice,
        });

        return res.status(201).json({
            message: "Order created successfully",
            data: newOrder,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error creating order",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// 5. PUT /orders/:id hoặc /orders/:iid - Cập nhật đơn hàng
// ==========================================
export const updateOrder = async (req, res) => {
    try {
        const targetOrderId = req.params.iid || req.params.id;
        const { quantity, productId } = req.body;
        const newQuantity = Number(quantity);

        // Tìm đơn hàng theo orderId, id hoặc _id
        const order = await Order.findOne({
            $or: [
                { orderId: targetOrderId },
                { id: targetOrderId },
                { _id: targetOrderId.match(/^[0-9a-fA-F]{24}$/) ? targetOrderId : null },
            ],
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                data: null,
            });
        }

        // Yêu cầu: User chỉ được cập nhật đơn hàng của bản thân
        const currentUserId = req.user.id;
        const currentUserObjectId = req.user._id ? req.user._id.toString() : null;

        if (order.customerId !== currentUserId && order.customerId !== currentUserObjectId) {
            return res.status(403).json({
                message: "Forbidden: You are only allowed to update your own orders",
                data: null,
            });
        }

        // Lấy sản phẩm hiện tại trong đơn hàng
        const product = await Product.findOne({
            $or: [
                { id: order.productId },
                { _id: order.productId.match(/^[0-9a-fA-F]{24}$/) ? order.productId : null },
            ],
        });

        if (!product) {
            return res.status(404).json({
                message: "Product associated with this order not found",
                data: null,
            });
        }

        // Tính toán độ chênh lệch số lượng sản phẩm
        // Khi thay đổi số lượng thành công:
        // - Nếu tăng số lượng đặt (newQuantity > oldQuantity) -> kho giảm thêm (diff > 0)
        // - Nếu giảm số lượng đặt (newQuantity < oldQuantity) -> kho được hoàn lại
        const diff = newQuantity - order.quantity;

        if (diff > 0 && product.quantity < diff) {
            return res.status(400).json({
                message: `Insufficient inventory: cannot increase by ${diff}, only ${product.quantity} items left in stock`,
                data: null,
            });
        }

        // Cập nhật số lượng kho sản phẩm
        product.quantity -= diff;
        await product.save();

        // Cập nhật đơn hàng
        order.quantity = newQuantity;
        order.totalPrice = product.price * newQuantity;
        await order.save();

        return res.status(200).json({
            message: "Order updated successfully",
            data: order,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error updating order",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// 6. DELETE /orders/:id hoặc /orders/:iid - Xoá đơn hàng
// ==========================================
export const deleteOrder = async (req, res) => {
    try {
        const targetOrderId = req.params.iid || req.params.id;

        // Tìm đơn hàng
        const order = await Order.findOne({
            $or: [
                { orderId: targetOrderId },
                { id: targetOrderId },
                { _id: targetOrderId.match(/^[0-9a-fA-F]{24}$/) ? targetOrderId : null },
            ],
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                data: null,
            });
        }

        // Yêu cầu: User chỉ được xoá đơn hàng của bản thân
        const currentUserId = req.user.id;
        const currentUserObjectId = req.user._id ? req.user._id.toString() : null;

        if (order.customerId !== currentUserId && order.customerId !== currentUserObjectId) {
            return res.status(403).json({
                message: "Forbidden: You are only allowed to delete your own orders",
                data: null,
            });
        }

        // Hoàn lại số lượng tồn kho của sản phẩm khi xoá đơn hàng
        const product = await Product.findOne({
            $or: [
                { id: order.productId },
                { _id: order.productId.match(/^[0-9a-fA-F]{24}$/) ? order.productId : null },
            ],
        });

        if (product) {
            product.quantity += order.quantity;
            await product.save();
        }

        // Xoá đơn hàng khỏi database
        await Order.deleteOne({ _id: order._id });

        return res.status(200).json({
            message: "Order deleted successfully",
            data: {
                orderId: order.orderId,
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error deleting order",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// Lấy danh sách tất cả đơn hàng (cho kiểm tra)
// ==========================================
export const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        return res.status(200).json({
            message: "Orders retrieved successfully",
            total: orders.length,
            data: orders,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error retrieving orders",
            error: error.message,
            data: null,
        });
    }
};

// ==========================================
// Lấy chi tiết đơn hàng theo orderId
// ==========================================
export const getOrderById = async (req, res) => {
    try {
        const targetOrderId = req.params.iid || req.params.id;
        const order = await Order.findOne({
            $or: [
                { orderId: targetOrderId },
                { _id: targetOrderId.match(/^[0-9a-fA-F]{24}$/) ? targetOrderId : null },
            ],
        });

        if (!order) {
            return res.status(404).json({
                message: "Order not found",
                data: null,
            });
        }

        return res.status(200).json({
            message: "Order details retrieved successfully",
            data: order,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Internal server error retrieving order",
            error: error.message,
            data: null,
        });
    }
};
