import { Router } from "express";
import {
    createProduct,
    getProducts,
    getProductById,
    seedProducts,
} from "../controllers/product.controller.js";

const ProductRouter = Router();

// GET /products - Xem toàn bộ sản phẩm
ProductRouter.get("/", getProducts);

// POST /products - Thêm sản phẩm mới
ProductRouter.post("/", createProduct);

// POST /products/seed - Khởi tạo dữ liệu mẫu
ProductRouter.post("/seed", seedProducts);

// GET /products/:id - Lấy sản phẩm theo id
ProductRouter.get("/:id", getProductById);

export default ProductRouter;
