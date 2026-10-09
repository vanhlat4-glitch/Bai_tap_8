// Middleware kiểm tra tồn tại và tính hợp lệ của các trường khi đăng ký
export const validateRegister = (req, res, next) => {
    const { name, email, age, password } = req.body ?? {};

    // 1. Kiểm tra sự tồn tại của các trường bắt buộc
    if (!name || !email || age === undefined || age === null || !password) {
        return res.status(400).json({
            message: "Missing required fields: name, email, age, and password are required",
            data: null,
        });
    }

    // 2. Kiểm tra định dạng name
    if (typeof name !== "string" || name.trim() === "") {
        return res.status(400).json({
            message: "Name must be a non-empty string",
            data: null,
        });
    }

    // 3. Kiểm tra định dạng email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== "string" || !emailRegex.test(email.trim())) {
        return res.status(400).json({
            message: "Invalid email format",
            data: null,
        });
    }

    // 4. Kiểm tra tuổi (age phải là số nguyên dương)
    const numAge = Number(age);
    if (isNaN(numAge) || numAge <= 0 || !Number.isInteger(numAge)) {
        return res.status(400).json({
            message: "Age must be a positive integer",
            data: null,
        });
    }

    // 5. Kiểm tra mật khẩu
    if (typeof password !== "string" || password.trim().length === 0) {
        return res.status(400).json({
            message: "Password must be a non-empty string",
            data: null,
        });
    }

    next();
};

// Middleware kiểm tra email và password khi đăng nhập
export const validateLogin = (req, res, next) => {
    const { email, password } = req.body ?? {};

    if (!email || !password) {
        return res.status(400).json({
            message: "Missing required fields: email and password are required",
            data: null,
        });
    }

    if (typeof email !== "string" || email.trim() === "") {
        return res.status(400).json({
            message: "Email must be a non-empty string",
            data: null,
        });
    }

    if (typeof password !== "string" || password.trim() === "") {
        return res.status(400).json({
            message: "Password must be a non-empty string",
            data: null,
        });
    }

    next();
};
