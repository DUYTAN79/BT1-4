require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const messageRoutes = require('./routes/messageRoutes');

const app = express();
app.use(express.json());

// Kết nối trực tiếp với Database của bạn
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("🔥 Kết nối Database thành công!"))
    .catch(err => console.error("❌ Lỗi kết nối:", err));

// Sử dụng Routes
app.use('/api/messages', messageRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🚀 Server đang chạy tại: http://localhost:${PORT}`);
});