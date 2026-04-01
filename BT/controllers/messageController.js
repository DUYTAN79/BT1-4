const Message = require('../models/Message');
const mongoose = require('mongoose');

// 1. GET "/userID" - Lấy toàn bộ tin nhắn 2 chiều giữa 2 người
exports.getMessagesWithUser = async (req, res) => {
    try {
        const { userID } = req.params;
        const currentUserID = req.user.id; // Lấy từ middleware verifyToken

        // Tìm tin nhắn: (A gửi B) HOẶC (B gửi A)
        const messages = await Message.find({
            $or: [
                { from: currentUserID, to: userID },
                { from: userID, to: currentUserID }
            ]
        }).sort({ createdAt: 1 }); // Sắp xếp theo thời gian tăng dần

        res.status(200).json(messages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 2. POST "/" - Gửi tin nhắn (Tự động nhận diện File hoặc Text)
exports.sendMessage = async (req, res) => {
    try {
        // Log để debug trong Terminal nếu gặp lỗi
        console.log("Body nhận được:", req.body);
        console.log("File nhận được:", req.file);

        const { to, text } = req.body;
        const from = req.user.id;

        let type = 'text';
        let content = text;

        // Ưu tiên xử lý File nếu có gửi kèm từ Multer
        if (req.file) {
            type = 'file';
            content = req.file.path; // Lưu đường dẫn file (vd: uploads/abc.png)
        }

        // Kiểm tra hợp lệ: Phải có ít nhất nội dung chữ hoặc file
        if (!content || content.trim() === "") {
            return res.status(400).json({ 
                error: "Nội dung tin nhắn hoặc file không được để trống" 
            });
        }

        // Tạo message mới theo Schema yêu cầu
        const newMessage = new Message({
            from,
            to,
            messageContent: {
                type: type,
                text: content
            }
        });

        await newMessage.save();
        res.status(201).json(newMessage);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// 3. GET "/" - Lấy tin nhắn cuối cùng của mỗi cuộc trò chuyện (List Chat)
exports.getLastMessages = async (req, res) => {
    try {
        const currentUserID = new mongoose.Types.ObjectId(req.user.id);

        const lastMessages = await Message.aggregate([
            {
                // Lọc tất cả tin nhắn mà user hiện tại tham gia (gửi hoặc nhận)
                $match: {
                    $or: [{ from: currentUserID }, { to: currentUserID }]
                }
            },
            { 
                // Sắp xếp mới nhất lên đầu để lấy tin nhắn cuối cùng
                $sort: { createdAt: -1 } 
            },
            {
                // Nhóm theo "người kia" (partner)
                $group: {
                    _id: {
                        $cond: [
                            { $eq: ["$from", currentUserID] },
                            "$to", 
                            "$from"
                        ]
                    },
                    // Lấy bản ghi đầu tiên sau khi đã sort (chính là tin nhắn cuối cùng)
                    lastMsg: { $first: "$$ROOT" }
                }
            },
            {
                // Sắp xếp lại danh sách hội thoại theo tin nhắn mới nhất
                $sort: { "lastMsg.createdAt": -1 }
            }
        ]);

        res.status(200).json(lastMessages);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};