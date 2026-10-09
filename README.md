# BÀI TẬP BUỔI 8 - AUTHENTICATION & JWT (CUSTOMER - PRODUCT - ORDER)

Dự án hoàn thành đầy đủ toàn bộ 7 câu hỏi theo yêu cầu đề bài **Thực hành Lesson 8 - MindX Web Fullstack**.

---

## 1. Cấu trúc thư mục (Mô hình MVC)

```text
BaiTap_LS8/
├── .env                                  # Cấu hình biến môi trường
├── .env.example                          # Mẫu cấu hình môi trường
├── .gitignore                            # Bỏ qua node_modules, .env
├── package.json                          # Khai báo dependencies & scripts
├── index.js                              # Điểm khởi chạy server Express
├── test_api.js                           # Script kiểm thử tự động toàn bộ 7 câu API
├── BaiTap_LS8.postman_collection.json    # File Import vào Postman kiểm thử
└── src/
    ├── controllers/
    │   ├── customer.controller.js        # Controller đăng ký, đăng nhập, refresh token, đơn hàng user
    │   ├── product.controller.js         # Controller quản lý sản phẩm
    │   └── order.controller.js           # Controller tạo, sửa, xóa, xem đơn hàng
    ├── middlewares/
    │   ├── auth.middleware.js            # Middleware xác thực JWT Bearer Token
    │   ├── customer.middleware.js        # Middleware validate dữ liệu đăng ký & đăng nhập
    │   └── order.middleware.js           # Middleware validate dữ liệu đơn hàng (tạo & cập nhật)
    ├── models/
    │   ├── customer.model.js             # Mongoose Model Customer (id ngẫu nhiên qua crypto)
    │   ├── product.model.js              # Mongoose Model Product
    │   └── order.model.js                # Mongoose Model Order
    └── routes/
        ├── customer.routes.js            # Routes cho Customer (/register, /login, /refresh-token, /users/:id/orders)
        ├── product.routes.js             # Routes cho Product (/products)
        └── order.routes.js               # Routes cho Order (/orders)
```

---

## 2. Thiết kế Cơ sở Dữ liệu & Mô tả Dữ liệu

### 2.1 Collection `customers`
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | String | Mã định danh duy nhất ngẫu nhiên sinh bằng `crypto.randomUUID()` |
| `name` | String | Tên đầy đủ của khách hàng |
| `email` | String | Địa chỉ email (duy nhất, không được trùng) |
| `age` | Integer | Tuổi của khách hàng (số nguyên dương) |
| `password` | String | Mật khẩu đã được mã hóa bằng `bcrypt` |
| `refreshToken` | String | Lưu refresh token của phiên đăng nhập |

### 2.2 Collection `products`
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `id` | String | Mã định danh duy nhất cho mỗi sản phẩm (`crypto.randomUUID()`) |
| `name` | String | Tên của sản phẩm |
| `price` | Float (Number) | Giá của một đơn vị sản phẩm |
| `quantity` | Integer | Số lượng sản phẩm còn lại trong kho |

### 2.3 Collection `orders`
| Trường | Kiểu dữ liệu | Mô tả |
| :--- | :--- | :--- |
| `orderId` | String | Mã định danh duy nhất cho mỗi đơn hàng (`crypto.randomUUID()`) |
| `customerId` | String | Mã định danh của khách hàng đã đặt đơn hàng |
| `productId` | String | Mã định danh của sản phẩm trong đơn hàng |
| `quantity` | Integer | Số lượng sản phẩm được mua |
| `totalPrice` | Float (Number) | Tổng số tiền (`price * quantity`) |

---

## 3. Chi tiết toàn bộ 7 API theo yêu cầu

###  Câu 1: Viết API đăng ký tài khoản
- **Method & Route**: `POST /register`
- **Middleware**: `validateRegister` (kiểm tra đầy đủ `name`, `email`, `age`, `password`).
- **Xử lý**:
  - `id` được sinh ngẫu nhiên duy nhất bằng module `crypto`.
  - Kiểm tra `email` không được phép trùng.
  - Mã hóa `password` bằng `bcrypt`.
  - Lưu vào collection `customers` và trả về thông tin khách hàng mới thêm.

###  Câu 2: Viết API đăng nhập
- **Method & Route**: `POST /login`
- **Middleware**: `validateLogin` (kiểm tra `email`, `password`).
- **Xử lý**:
  - Kiểm tra email, so khớp mật khẩu mã hóa với `bcrypt.compare`.
  - Trả về thông tin `access_token` (hạn 1h) và `refresh_token` (hạn 7d) khi đăng nhập thành công.

###  Câu 3: Viết API lấy thông tin order của một user
- **Method & Route**: `GET /users/:id/orders`
- **Yêu cầu**:
  - User đã đăng nhập (sử dụng Header `Authorization: Bearer <access_token>`).
  - User chỉ xem được thông tin orders của bản thân mình (nếu cố tình xem của người khác -> trả về `403 Forbidden`).

###  Câu 4: Viết API tạo đơn hàng
- **Method & Route**: `POST /orders`
- **Yêu cầu**:
  - User đã đăng nhập (sử dụng token).
  - Body request: `productId`, `quantity` (tùy chọn truyền `orderId` hoặc server tự sinh qua crypto).
  - Middleware `validateCreateOrder`: kiểm tra tồn tại và tính hợp lệ các trường.
  - Mặc định đơn hàng tạo ra là của người đang đăng nhập (`customerId = req.user.id`).
  - Kiểm tra tồn kho của sản phẩm, giảm số lượng trong kho và tính `totalPrice = product.price * quantity`.

###  Câu 5: Viết API cập nhật đơn hàng
- **Method & Route**: `PUT /orders/:id`
- **Yêu cầu**:
  - User đã đăng nhập (sử dụng token).
  - Middleware `validateUpdateOrder`: kiểm tra tính hợp lệ dữ liệu cập nhật (`quantity`).
  - User chỉ được cập nhật đơn hàng của chính bản thân mình (`403 Forbidden` nếu của người khác).
  - Khi đơn hàng thay đổi số lượng thành công, số lượng kho sản phẩm được cập nhật tương ứng (tăng đặt thì kho giảm thêm, giảm đặt thì hoàn lại kho), tính lại `totalPrice`.

###  Câu 6: Viết API xoá đơn hàng
- **Method & Route**: `DELETE /orders/:id`
- **Yêu cầu**:
  - User đã đăng nhập (sử dụng token).
  - User chỉ được xoá đơn hàng của bản thân mình (`403 Forbidden` nếu của người khác).
  - Khi xoá đơn hàng thành công, hoàn lại toàn bộ số lượng sản phẩm vào kho.

###  Câu 7: Viết API tạo mới token
- **Method & Route**: `POST /refresh-token`
- **Yêu cầu**:
  - Nhận `refresh_token` từ body.
  - Xác thực refresh token hợp lệ và cấp mới một `access_token`.

---

## 4. Hướng dẫn chạy & Kiểm thử

### 4.1 Cài đặt dependencies
```bash
cd BaiTap_LS8
npm install
```

### 4.2 Khởi động Server
```bash
npm run dev
# Hoặc
npm start
```
Server chạy tại: `http://localhost:3008`

### 4.3 Chạy Test tự động toàn bộ 7 câu
```bash
node test_api.js
```
Kết quả kiểm thử tự động đạt 100% tất cả 7 câu.

### 4.4 Kiểm thử trên Postman
1. Mở Postman và bấm **Import**.
2. Chọn file [BaiTap_LS8.postman_collection.json](file:///c:/Users/legion/OneDrive/PNL-WEB99%20-%20T2,6/BaiTap_LS8/BaiTap_LS8.postman_collection.json).
3. Postman đã có sẵn các biến và script tự động gán token, user id, product id, order id để test liền mạch từ câu 1 đến câu 7.
