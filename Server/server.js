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

// 이미지 업로드 설정
const upload = multer({
    dest: 'uploads/',  // 업로드된 파일이 저장될 디렉토리
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

// 메뉴 데이터를 저장할 JSON 파일
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
    // id를 순차적으로 재정렬
    menuList = menuList.map((item, index) => ({
        ...item,
        id: index + 1  // id를 1부터 순차적으로 매핑
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
    const { name, price, category } = req.body;
    const image = req.file ? req.file.path : 'uploads/default_image.png';

    const menuList = getMenuData();
    const newMenuItem = {
        id: menuList.length + 1,  // 메뉴 목록 길이에 따라 id를 설정
        name,
        price,
        category,
        image
    };

    menuList.push(newMenuItem);
    saveMenuData(menuList);

    res.json(newMenuItem);
});

// POST: 메뉴 수정
app.post('/menu/update', upload.single('image'), (req, res) => {
    const { id, name, price, category } = req.body;
    const image = req.file ? req.file.path : 'uploads/default_image.png';  // 이미지를 수정하지 않으면 기본 이미지 사용

    const menuList = getMenuData();  // 기존 메뉴 목록 읽기
    const updatedMenu = menuList.map((item) => {
        if (item.id === parseInt(id)) {
            // 해당 id의 메뉴 항목을 수정
            return { ...item, name, price, category, image };
        }
        return item;  // 수정하지 않은 항목은 그대로
    });

    saveMenuData(updatedMenu);  // 수정된 데이터 저장

    res.json({ status: 'success', message: '메뉴가 수정되었습니다.' });
});

// DELETE: 메뉴 삭제
app.delete('/menu', (req, res) => {
    const { id } = req.body;
    const menuList = getMenuData();
    const updatedMenu = menuList.filter(item => item.id !== parseInt(id));

    saveMenuData(updatedMenu);

    res.json({ status: 'success', message: '메뉴가 삭제되었습니다.' });
});

// 서버 시작
app.listen(port, () => {
    console.log(`서버가 http://localhost:${port}에서 실행 중입니다.`);
});
