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

// 정적 파일 경로를 실행 파일의 경로를 기준으로 설정
const staticPath = path.resolve(process.cwd(), 'uploads');
app.use('/uploads', express.static(staticPath));

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads')); // 파일 저장 경로
    },
    filename: (req, file, cb) => {
        cb(null, `${Date.now()}-${file.originalname}`); // 고유 파일 이름 생성
    },
});

const upload = multer({
    storage: multer.diskStorage({
        destination: (req, file, cb) => {
            cb(null, path.resolve(process.cwd(), 'uploads')); // 실행 파일 외부 경로
        },
        filename: (req, file, cb) => {
            cb(null, file.originalname);
        },
    }),
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB 제한
    fileFilter: (req, file, cb) => {
        const fileTypes = /jpeg|jpg|png|gif/;
        const extname = fileTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = fileTypes.test(file.mimetype);
        if (extname && mimetype) {
            return cb(null, true);
        }
        cb(new Error('파일 형식이 올바르지 않습니다.'));
    },
});

// 주문 로그 파일 경로
const logFilePath = path.join(__dirname, 'order-log.txt');

// 주문 내역을 기록하는 함수
const logOrder = (order, status) => {
    if (!fs.existsSync(logFilePath)) {
        fs.writeFileSync(logFilePath, '', 'utf-8');
    }

    // 현재 날짜와 시간 가져오기
    const currentDate = new Date().toISOString();

    // 필요한 키만 남기고 나머지는 제거
    const filteredCart = order.cart.map(item => {
        return {
            name: item.name,
            price: item.price,
            size: item.size,
            notes: item.notes
        };
    });

    // 처리 결과(status) 저장
    const orderStatus = status;

    // 로그 메시지 작성: 공백과 줄바꿈 제거, 필요한 키만 포함
    const logMessage = `Date: ${currentDate} ID: ${order.id} 주문내역: ${JSON.stringify(filteredCart)} 처리결과: ${orderStatus}\n`;

    // 로그 메시지를 파일에 추가
    fs.appendFileSync(logFilePath, logMessage, 'utf-8');
    console.log('로그 파일(order-log.txt)에 기록되었습니다.');
};

// 새로운 엔드포인트 추가
app.post('/logOrder', (req, res) => {
    const { orderId, status } = req.body;
    
    // 주문 정보를 가져오는 로직 (임시로 orders 배열 사용)
    const order = orders.find(o => o.id === orderId);
    if (!order) {
        return res.status(404).json({ message: '주문을 찾을 수 없습니다.' });
    }

    // logOrder 함수 호출
    logOrder(order, status);
    res.status(200).json({ message: '주문 로그가 기록되었습니다.' });
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

        // 업로드된 이미지 경로를 강제로 'uploads/'로 설정
        let imagePath = 'uploads/default_image.png';
        if (req.file) {
            // 업로드된 파일의 이름을 uploads/ 경로 하에 저장하도록 설정
            imagePath = `uploads/${req.file.filename}`;
        }

        const menuList = getMenuData();
        const newMenuItem = {
            id: menuList.length + 1,
            name,
            price,
            category,
            image: imagePath, // JSON에 'uploads/' 경로로 저장
            soldOut: false,
            originalImage: imagePath
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
// POST: 주문 내역 처리
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
    logOrder(newOrder,"결제완료")
    res.json({ success: true });
});

// GET: 주문 내역 확인을 위한 엔드포인트
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
    logOrder(orders[orderIndex],"삭제")

    // 해당 주문 삭제
    orders.splice(orderIndex, 1);

    res.json({ success: true, message: `주문번호 : ${id}번 삭제되었습니다.` });
});

// ID 재정렬 함수
function reorderIds() {
    orders = orders.map((order, index) => ({ ...order, id: index + 1 }));
}

// POST: 주문 내역 ID 재정렬
app.post('/reorderIds', (req, res) => {
    reorderIds();  // 전역 변수를 재정렬

    // 재정렬된 주문 데이터를 클라이언트에 반환
    res.json({ success: true, message: `주문번호가 재정렬 되었습니다.` });
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
    let imagePath = 'uploads/default_image.png';
    if (req.file) {
        // 업로드된 파일의 이름을 uploads/ 경로 하에 저장하도록 설정
        imagePath = `uploads/${req.file.filename}`;
    }
    const menuList = getMenuData();  // 기존 메뉴 목록 읽기
    const updatedMenu = menuList.map((item) => {
        if (item.id === parseInt(id)) {
            return { ...item, name, price, category, image: imagePath, originalImage: imagePath };
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
