const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // File sẽ lưu vào folder uploads
const msgCtrl = require('../controllers/messageController');

// Giả sử bạn có middleware verifyToken để xác thực người dùng
const verifyToken = (req, res, next) => {
    // Demo: gán cứng ID để bạn test, sau này thay bằng logic JWT
    req.user = { id: "65e2345678901234567890ab" }; 
    next();
};

router.get('/userID/:userID', verifyToken, msgCtrl.getMessagesWithUser);
router.post('/', verifyToken, upload.single('file'), msgCtrl.sendMessage);
router.get('/', verifyToken, msgCtrl.getLastMessages);

module.exports = router;