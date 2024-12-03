const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Express 앱 생성
const app = express();
const port = 8000;

// CORS 설정
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const upload = multer({
    dest: 'uploads/',  // 업로드된 파일이 'uploads/' 폴더에 저장됨
    limits: { fileSize: 5 * 1024 * 1024 },  // 파일 크기 제한 (5MB)
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('파일 형식이 올바르지 않습니다.'));
    }
});

// 메뉴 데이터를 보관하는 JSON 파일 경로
const filePath = 'food_List.json';

// 메뉴 데이터를 읽어오는 함수
const getMenuData = () => {
    if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    }
    return [];
};

// 메뉴 데이터를 저장하는 함수
const saveMenuData = (menuList) => {
    // ID를 순차적으로 정렬
    menuList = menuList.map((item, index) => ({
        ...item,
        id: index + 1   // 1부터 순차적으로
    }));
    fs.writeFileSync(filePath, JSON.stringify(menuList, null, 2));  // 수정된 데이터 덮어쓰기
};

// GET: 메뉴 목록 반환
app.get('/menu', (req, res) => {
    const menuList = getMenuData();
    res.json(menuList);
});

// POST: 메뉴 추가
app.post('/menu', upload.single('image'), (req, res) => {
    try {
        const { name, price, category } = req.body;
        if (!name || !price || !category) {
            throw new Error('필수 필드(name, price, category)가 누락되었습니다.');
        }

        const image = req.file ? req.file.path : 'uploads/default_image.png';
        const menuList = getMenuData();
        const newMenuItem = {
            id: menuList.length + 1,
            name,
            price,
            category,
            image,
            soldOut: false,
        };

        menuList.push(newMenuItem);
        saveMenuData(menuList);

        res.json(newMenuItem);
        console.log(`메뉴가 추가되었습니다.`);
    } catch (error) {
        console.error(error.message);
        res.status(400).json({ status: 'error', message: error.message });
    }
});

let orders = [];
// 주문 내역 처리
app.post('/processOrder', (req, res) => {
    console.log('수신된 데이터:', req.body);
    const { cart } = req.body;

    if (!cart || cart.length === 0) {
        return res.status(400).json({ success: false, message: '장바구니가 비어 있습니다.' })
    }

    // 주문 내역 저장
    const newOrder = {
        id: orders.length + 1,
        cart,
        status: '처리 대기 중',
    };
    orders.push(newOrder);

    res.json({ success: true });
});

// 주문 내역 확인을 위한 엔드포인트
app.get('/orders', (req, res) => {
    res.json(orders);
});

// DELETE: 주문 삭제
app.delete('/orders', (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).json({ success: false, message: '주문 ID가 제공되지 않았습니다.' });
    }

    const orderIndex = orders.findIndex((order) => order.id === parseInt(id));
    if (orderIndex === -1) {
        return res.status(404).json({ success: false, message: '주문을 찾을 수 없습니다.' });
    }

    // 해당 주문 삭제
    orders.splice(orderIndex, 1);

    // ID를 다시 정렬
    orders = orders.map((order, index) => ({ ...order, id: index + 1 }));

    res.json({ success: true, message: `주문 ${id}이 삭제되었습니다.` });
});

// POST: 품절 상태 변경
app.post('/menu/soldout', (req, res) => {
    const { id, soldOut } = req.body;

    const menuList = getMenuData();
    const updatedMenu = menuList.map((item) => {
        if (item.id === parseInt(id)) {
            if (soldOut) {
                // 품절 설정: 원래 이미지를 저장하고 SoldOut 이미지로 교체
                return {
                    ...item,
                    originalImage: item.originalImage || item.image, // 원래 이미지 저장
                    image: 'uploads/SoldOut_img.png',
                    soldOut: true,
                };
            } else {
                // 품절 해제: 원래 이미지로 복원
                return {
                    ...item,
                    image: item.originalImage || item.image, // 원래 이미지 복원
                    soldOut: false,
                };
            }
        }
        return item;
    });

    saveMenuData(updatedMenu);

    res.json({ status: 'success', message: '품절 상태가 업데이트되었습니다.' });
});

// POST: 메뉴 수정
app.post('/menu/update', upload.single('image'), (req, res) => {
    const { id, name, price, category } = req.body;
    const image = req.file ? req.file.path : 'uploads/default_image.png';  // 이미지를 수정하지 않으면 기본 이미지 사용

    const menuList = getMenuData();  // 기존 메뉴 목록 읽기
    const updatedMenu = menuList.map((item) => {
        if (item.id === parseInt(id)) {
            return { ...item, name, price, category, image };
        }
        return item;  // 수정하지 않은 항목은 그대로
    });

    saveMenuData(updatedMenu);  // 수정된 데이터 저장

    res.json({ status: 'success', message: '메뉴가 수정되었습니다.' });
    console.log(`메뉴가 수정되었습니다.`);
});

// DELETE: 메뉴 삭제
app.delete('/menu', (req, res) => {
    const { id } = req.body;

    const menuList = getMenuData();
    const updatedMenu = menuList.filter((item) => item.id !== parseInt(id));

    saveMenuData(updatedMenu);

    res.json({ status: 'success', message: '메뉴가 삭제되었습니다.' });
    console.log(`메뉴가 삭제되었습니다.`);
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 실행 중입니다.`);
});
