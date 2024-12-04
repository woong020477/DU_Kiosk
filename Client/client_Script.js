// 메뉴 데이터를 가져오는 함수
function getMenuData() {
    fetch('http://localhost:8000/menu')  // 서버에서 메뉴 데이터 가져오기
        .then(response => response.json())
        .then(data => {
            localStorage.setItem('menuData', JSON.stringify(data)); // 메뉴 데이터를 로컬 스토리지에 저장

            // 필터링 상태 가져오기
            const currentCategory = localStorage.getItem('currentCategory');
            if (currentCategory) {
                // 저장된 필터 상태로 데이터 필터링
                filterMenu(currentCategory, data);
            } else {
                // 필터 상태가 없으면 전체 메뉴 표시
                displayMenu(data);
            }
        })
        .catch(error => {
            console.error('메뉴 데이터를 가져오는 데 오류가 발생했습니다:', error);
        });
}

// 메뉴 데이터를 화면에 표시하는 함수
function displayMenu(menuData) {
    const menuListContainer = document.getElementById('menu-list');
    menuListContainer.innerHTML = '';  // 기존 내용 초기화

    menuData.forEach(item => {
        const menuCard = document.createElement('div');
        menuCard.classList.add('menu-card');
        menuCard.innerHTML = `
            <h3>${item.name}</h3>
            <img src="http://localhost:8000/${item.image}" alt="${item.name}">
            <p>${item.price}원</p>
            <button ${item.soldOut ? 'disabled' : ''} onclick="showAddItemPopup(${item.id})">담기</button>
        `;
        menuListContainer.appendChild(menuCard);
    });
}

// 메뉴 필터링 함수
function filterMenu(category, menuData = null) {
    const storedMenuData = menuData || JSON.parse(localStorage.getItem('menuData'));
    if (!storedMenuData) {
        console.error('메뉴 데이터가 로컬 스토리지에 없습니다.');
        return;
    }

    const filteredData = category === '전체' ? storedMenuData : storedMenuData.filter(item => item.category === category);
    displayMenu(filteredData);

    // 현재 필터 상태 저장
    localStorage.setItem('currentCategory', category);
}

// 담기 버튼 클릭 시 호출되는 함수
function showAddItemPopup(menuId) {
    const storedMenuData = localStorage.getItem('menuData');
    const menuData = storedMenuData ? JSON.parse(storedMenuData) : [];

    const menuItem = menuData.find(item => item.id === menuId);
    if (!menuItem) {
        console.error("메뉴 아이템을 찾을 수 없습니다. menuId: " + menuId);
        return;
    }

    // 팝업에 메뉴 ID, 이름, 가격 업데이트
    const popupId = document.getElementById('popup-item-id');
    const popupName = document.getElementById('popup-item-name');
    const popupPrice = document.getElementById('popup-item-price');
    const extraCheckbox = document.getElementById('extra');
    const removeTextInput = document.getElementById('remove-text');

    popupId.textContent = menuId;  // 메뉴 ID 설정
    popupName.textContent = menuItem.name;  // 메뉴 이름 설정
    popupPrice.textContent = `${menuItem.price}원`;  // 가격 설정

    // 기존 입력 값 초기화
    extraCheckbox.checked = false;
    removeTextInput.value = '';

    // 팝업 표시
    const addItemPopup = document.getElementById('add-item-popup');
    addItemPopup.style.display = 'flex';
}

// 팝업 닫기 함수
function closeAddItemPopup() {
    const addItemPopup = document.getElementById('add-item-popup');
    addItemPopup.style.display = 'none';  // 팝업 닫기
}

// 장바구니에 아이템을 추가하는 함수
function addToCart() {
    // 팝업에 설정된 menuId를 가져오기
    const menuId = parseInt(document.getElementById('popup-item-id').textContent);
    const menuName = document.getElementById('popup-item-name').textContent;
    const menuPrice = parseInt(document.getElementById('popup-item-price').textContent.replace('원', ''));

    const sizeChecked = document.getElementById('extra').checked;
    const notes = document.getElementById('remove-text').value;

    const cartItem = {
        id: menuId,
        name: menuName,
        price: menuPrice,
        size: sizeChecked,
        notes
    };

    // 기존 장바구니 데이터를 가져와서 추가
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart.push(cartItem);
    
    // 로컬 스토리지에 장바구니 데이터를 저장
    localStorage.setItem('cart', JSON.stringify(cart));

    closeAddItemPopup();  // 팝업 닫기
    updateCart();  // 장바구니 상태 갱신
}

// 장바구니 상태 갱신 함수
function updateCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartCount = cart.length;

    const cartDisplay = document.getElementById('cart-count');
    if (cartDisplay) {
        cartDisplay.innerHTML = `${cartCount}`;  // 장바구니 항목 개수 표시
    }

    const cartViewButton = document.getElementById('cart-view-button');
    if (cartViewButton) {
        cartViewButton.style.display = cartCount > 0 ? 'inline-block' : 'none';  // 항목이 있을 때만 보이기
    }
}

// 장바구니 보기 버튼 클릭 시
function showCart() {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const cartListContainer = document.getElementById('cart-items');

    if (!cartListContainer) {
        console.error('장바구니 항목을 표시할 요소가 없습니다.');
        return;
    }

    cartListContainer.innerHTML = '';  // 기존 장바구니 내용 초기화

    if (cart.length === 0) {
        cartListContainer.innerHTML = '<p>장바구니에 항목이 없습니다.</p>';
        return;
    }

    // 장바구니 항목들 표시
    cart.forEach(item => {
        const cartItem = document.createElement('div');
        cartItem.classList.add('cart-item');
        cartItem.innerHTML = `
            <p>메뉴: ${item.name}</p>
            <span>가격: ${item.price}원</span>
            <span>곱빼기: ${item.size ? '예' : '아니오'}</span>
            <p>요청사항: ${item.notes}</p>
            <button onclick="removeFromCart(${item.id})">삭제</button>
        `;
        cartListContainer.appendChild(cartItem);
    });

    // 팝업을 보이도록 설정
    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
        cartPopup.style.display = 'flex';  // 팝업 표시
    }
}

// 장바구니에서 항목을 제거하는 함수
function removeFromCart(menuId) {
    let cart = JSON.parse(localStorage.getItem('cart')) || [];
    cart = cart.filter(item => item.id !== menuId);  // 해당 메뉴 제거
    localStorage.setItem('cart', JSON.stringify(cart));  // 업데이트된 장바구니 저장

    showCart();  // 장바구니 보기 갱신
    updateCart();  // 장바구니 갱신
}

// 팝업 닫기 함수
function closeCartPopup() {
    const cartPopup = document.getElementById('cart-popup');
    if (cartPopup) {
        cartPopup.style.display = 'none';  // 팝업 닫기
    }
}

// 결제하기 버튼 클릭 시 발생되는 함수
async function CheckOut() {
    const payButton = document.getElementById('payButton');
    if (!payButton) return;
    const cart = JSON.parse(localStorage.getItem('cart')) || [];

    if (cart.length === 0) {
        alert('장바구니가 비어 있습니다.');
        return;
    }

    try {
        // 서버로 POST 요청
        const response = await fetch('http://localhost:8000/processOrder', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cart }), // cart 내용을 JSON으로 전송
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || '서버 오류가 발생했습니다.');
        }

        // 결제 완료 후 payComList 업데이트
        updatePayComList(cart);

        // 요청 성공 시 로컬 스토리지 초기화 및 성공 메시지 출력
        localStorage.removeItem('cart');
        document.getElementById('cart-items').innerHTML = ''; // 장바구니 UI 초기화
        alert('결제가 완료되었습니다.');
        closeCartPopup();
        showCart();  // 장바구니 보기 갱신
        updateCart();  // 장바구니 갱신
    } catch (error) {
        console.error(error);
        alert(`결제 처리 중 오류가 발생했습니다: ${error.message}`);
    }
}

// payComList에 결제 내역 추가하는 함수
function updatePayComList(cart) {
    // 현재 날짜와 시간 가져오기
    const currentDate = new Date().toISOString();

    // 필요한 키만 남기고 나머지는 제거
    const filteredCart = cart.map(item => {
        return {
            name: item.name,
            price: item.price,
            size: item.size,
            notes: item.notes
        };
    });

    // 로컬 스토리지에서 기존 payComList 가져오기
    const payComList = JSON.parse(localStorage.getItem('payComList')) || [];

    // 새로운 주문 내역 추가
    const newPayEntry = {
        date: currentDate,
        orderDetails: filteredCart
    };
    payComList.push(newPayEntry);

    // 업데이트된 payComList를 로컬 스토리지에 저장
    localStorage.setItem('payComList', JSON.stringify(payComList));
    console.log('payComList 업데이트:', newPayEntry);
}

// payComList를 초기화하는 함수
function clearPayComList() {
    if (confirm('결제 내역을 초기화하시겠습니까?')) {
        localStorage.removeItem('payComList');
        const payListContainer = document.getElementById('payListContainer');
        payListContainer.innerHTML = '<p>결제 내역이 없습니다.</p>';
        refreshPayComList();
        alert('결제 내역이 초기화되었습니다.');
    }
}

// 결제 내역 보기
function payList() {
    const payListContainer = document.getElementById('payListContainer');
    const payComList = JSON.parse(localStorage.getItem('payComList')) || [];

    // PayComList가 비어있을 경우 처리
    if (payComList.length === 0) {
        payListContainer.innerHTML = '<p>결제 내역이 없습니다.</p>';
        return;
    }

    // 결제 내역 HTML 생성
    payListContainer.innerHTML = payComList.map(entry => `
            <div class="pay-entry">
                <p>결제시간: ${entry.date}</p>
                ${entry.orderDetails.map(item => `
                    <div class="pay-item">
                        <p>메뉴: ${item.name}</p>
                        <span>가격: ${item.price}원</span>
                        <span>곱빼기: ${item.size ? '예' : '아니오'}</span>
                        <p>요청사항: ${item.notes || '없음'}</p>
                    </div>
                `).join('')}
            </div>
        `).join('') +
        '<button onclick="clearPayComList()">결제 내역 초기화</button>';
}

// 모달 열기
function openPayListModal() {
    const modal = document.getElementById('payListModal');
    modal.style.display = 'block';
}

// 모달 닫기
function closePayListModal() {
    const modal = document.getElementById('payListModal');
    modal.style.display = 'none';
}

function refreshPayComList() {
    // 로컬 스토리지에서 기존 PayComList 가져오기
    const payComList = JSON.parse(localStorage.getItem('payComList')) || [];

    // PayComList 상태 갱신: 기존 데이터를 특정 규칙에 따라 업데이트
    const updatedPayComList = payComList.map(item => ({
        ...item,
        updated: true, // 예시로 "updated" 속성을 추가
    }));

    // 로컬 스토리지에 갱신된 리스트 저장
    localStorage.setItem('payComList', JSON.stringify(updatedPayComList));
}

// 페이지 로드 시 메뉴 데이터를 가져오고 장바구니 상태를 갱신
window.onload = function() {
    const storedMenuData = localStorage.getItem('menuData');
    if (storedMenuData) {
        // 필터 상태 확인
        const currentCategory = localStorage.getItem('currentCategory');
        if (currentCategory) {
            filterMenu(currentCategory);  // 현재 필터 상태로 메뉴 표시
        } else {
            displayMenu(JSON.parse(storedMenuData));  // 전체 메뉴 표시
        }
    } else {
        getMenuData();  // 서버에서 메뉴 데이터를 불러옴
    }

    updateCart();  // 페이지 로드 시 장바구니 상태 갱신

    // 3초마다 메뉴 데이터를 갱신
    setInterval(getMenuData, 3000);
    setInterval(refreshPayComList, 3000);
};
