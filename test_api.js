import dotenv from "dotenv";
dotenv.config();

import mongoose from "mongoose";
import express from "express";
import CustomerRouter from "./src/routes/customer.routes.js";
import ProductRouter from "./src/routes/product.routes.js";
import OrderRouter from "./src/routes/order.routes.js";

const mongoUri = process.env.MONGODB_URI;
await mongoose.connect(mongoUri);
console.log("Connected to MongoDB for testing");

const app = express();
app.use(express.json());
app.use("/", CustomerRouter);
app.use("/products", ProductRouter);
app.use("/orders", OrderRouter);

const server = app.listen(3098, async () => {
    const baseUrl = "http://localhost:3098";
    try {
        console.log("=== BẮT ĐẦU CHẠY KIỂM THỬ TOÀN BỘ 7 CÂU HỎI ===");

        // ==========================================
        // CÂU 1: POST /register
        // ==========================================
        const testEmail = `test_user_${Date.now()}@gmail.com`;
        const regRes = await fetch(`${baseUrl}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                name: "Nguyen Van B",
                email: testEmail,
                age: 26,
                password: "password123",
            }),
        });
        const regData = await regRes.json();
        console.log("1. [POST /register] Status:", regRes.status, "User ID:", regData.data?.id);
        if (regRes.status !== 201 || !regData.data?.id) throw new Error("Register failed: " + JSON.stringify(regData));

        // ==========================================
        // CÂU 2: POST /login
        // ==========================================
        const loginRes = await fetch(`${baseUrl}/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                email: testEmail,
                password: "password123",
            }),
        });
        const loginData = await loginRes.json();
        console.log("2. [POST /login] Status:", loginRes.status, "access_token:", !!loginData.access_token, "refresh_token:", !!loginData.refresh_token);
        if (loginRes.status !== 200 || !loginData.access_token || !loginData.refresh_token) {
            throw new Error("Login failed: " + JSON.stringify(loginData));
        }

        const accessToken = loginData.access_token;
        const refreshToken = loginData.refresh_token;
        const userId = regData.data.id;

        // Chuẩn bị sản phẩm: Seed sản phẩm
        await fetch(`${baseUrl}/products/seed`, { method: "POST" });
        const prodRes = await fetch(`${baseUrl}/products`);
        const prodData = await prodRes.json();
        const sampleProduct = prodData.data[0];
        const initialStock = sampleProduct.quantity;
        console.log("--- Chuẩn bị test: Sản phẩm:", sampleProduct.name, "Giá:", sampleProduct.price, "Tồn kho ban đầu:", initialStock);

        // ==========================================
        // CÂU 4: POST /orders (Tạo đơn hàng mới)
        // ==========================================
        const createOrderRes = await fetch(`${baseUrl}/orders`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                productId: sampleProduct.id,
                quantity: 3,
            }),
        });
        const createOrderData = await createOrderRes.json();
        const createdOrder = createOrderData.data;
        console.log("4. [POST /orders] Status:", createOrderRes.status, "OrderID:", createdOrder?.orderId, "TotalPrice:", createdOrder?.totalPrice);
        if (createOrderRes.status !== 201 || !createdOrder?.orderId) {
            throw new Error("Create order failed: " + JSON.stringify(createOrderData));
        }

        // Kiểm tra tồn kho đã bị trừ 3
        const checkProdRes1 = await fetch(`${baseUrl}/products/${sampleProduct.id}`);
        const checkProdData1 = await checkProdRes1.json();
        console.log("   -> Tồn kho sau khi tạo đơn hàng (giảm 3):", checkProdData1.data.quantity, "(Kỳ vọng:", initialStock - 3, ")");
        if (checkProdData1.data.quantity !== initialStock - 3) throw new Error("Stock decrement incorrect!");

        // ==========================================
        // CÂU 3: GET /users/:id/orders (Lấy orders của user)
        // ==========================================
        const ownOrdersRes = await fetch(`${baseUrl}/users/${userId}/orders`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });
        const ownOrdersData = await ownOrdersRes.json();
        console.log("3. [GET /users/:id/orders] Status của bản thân:", ownOrdersRes.status, "Số đơn:", ownOrdersData.total);
        if (ownOrdersRes.status !== 200 || ownOrdersData.total < 1) throw new Error("Get user orders failed!");

        // Thử xem orders của user khác -> Phải trả về 403 Forbidden
        const otherOrdersRes = await fetch(`${baseUrl}/users/fake-user-id-9999/orders`, {
            headers: { "Authorization": `Bearer ${accessToken}` },
        });
        console.log("   -> Thử xem đơn user khác (Kỳ vọng 403 Forbidden):", otherOrdersRes.status);
        if (otherOrdersRes.status !== 403) throw new Error("Expected 403 Forbidden but got " + otherOrdersRes.status);

        // ==========================================
        // CÂU 5: PUT /orders/:id (Cập nhật đơn hàng)
        // ==========================================
        // Tăng số lượng đặt từ 3 lên 5 (chênh lệch +2, tồn kho phải trừ thêm 2)
        const updateOrderRes = await fetch(`${baseUrl}/orders/${createdOrder.orderId}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${accessToken}`,
            },
            body: JSON.stringify({
                quantity: 5,
            }),
        });
        const updateOrderData = await updateOrderRes.json();
        console.log("5. [PUT /orders/:id] Status:", updateOrderRes.status, "Số lượng mới:", updateOrderData.data?.quantity, "TotalPrice mới:", updateOrderData.data?.totalPrice);
        if (updateOrderRes.status !== 200 || updateOrderData.data?.quantity !== 5) {
            throw new Error("Update order failed: " + JSON.stringify(updateOrderData));
        }

        // Kiểm tra tồn kho sau khi tăng lên 5 (tồn kho ban đầu - 5)
        const checkProdRes2 = await fetch(`${baseUrl}/products/${sampleProduct.id}`);
        const checkProdData2 = await checkProdRes2.json();
        console.log("   -> Tồn kho sau khi cập nhật số lượng lên 5:", checkProdData2.data.quantity, "(Kỳ vọng:", initialStock - 5, ")");
        if (checkProdData2.data.quantity !== initialStock - 5) throw new Error("Stock after update incorrect!");

        // ==========================================
        // CÂU 6: DELETE /orders/:id (Xoá đơn hàng)
        // ==========================================
        const deleteOrderRes = await fetch(`${baseUrl}/orders/${createdOrder.orderId}`, {
            method: "DELETE",
            headers: {
                "Authorization": `Bearer ${accessToken}`,
            },
        });
        const deleteOrderData = await deleteOrderRes.json();
        console.log("6. [DELETE /orders/:id] Status:", deleteOrderRes.status, "Message:", deleteOrderData.message);
        if (deleteOrderRes.status !== 200) throw new Error("Delete order failed: " + JSON.stringify(deleteOrderData));

        // Kiểm tra tồn kho sau khi xoá đơn: Phải được hoàn lại 5 cái về tồn kho ban đầu
        const checkProdRes3 = await fetch(`${baseUrl}/products/${sampleProduct.id}`);
        const checkProdData3 = await checkProdRes3.json();
        console.log("   -> Tồn kho sau khi hoàn trả (sau khi xóa đơn):", checkProdData3.data.quantity, "(Kỳ vọng:", initialStock, ")");
        if (checkProdData3.data.quantity !== initialStock) throw new Error("Stock after delete refund incorrect!");

        // ==========================================
        // CÂU 7: POST /refresh-token (Tạo mới token)
        // ==========================================
        const refreshTokenRes = await fetch(`${baseUrl}/refresh-token`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                refresh_token: refreshToken,
            }),
        });
        const refreshTokenData = await refreshTokenRes.json();
        console.log("7. [POST /refresh-token] Status:", refreshTokenRes.status, "New access_token:", !!refreshTokenData.access_token);
        if (refreshTokenRes.status !== 200 || !refreshTokenData.access_token) {
            throw new Error("Refresh token failed: " + JSON.stringify(refreshTokenData));
        }

        console.log("\n=======================================================");
        console.log(" CHÚC MỪNG: TOÀN BỘ 7 CÂU HỎI ĐÃ VƯỢT QUA TEST THÀNH CÔNG 100%!");
        console.log("=======================================================");
    } catch (err) {
        console.error("Test error:", err);
    } finally {
        server.close();
        await mongoose.disconnect();
        process.exit(0);
    }
});
