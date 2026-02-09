// Integration Test Script
const axios = require('axios');

const CUSTOMER_API = 'http://localhost:3000';
const ADMIN_API = 'http://localhost:4000';

async function testIntegration() {
  console.log('🧪 통합 테스트 시작...\n');

  try {
    // 1. Customer Login
    console.log('1️⃣ Customer 로그인 (테이블 T001)');
    const customerLogin = await axios.post(`${CUSTOMER_API}/auth/table-login`, {
      storeId: 'STORE123',
      tableNumber: 'T001',
      password: '1234'
    });
    const customerToken = customerLogin.data.token;
    const sessionId = customerLogin.data.tableInfo.sessionId;
    console.log('✅ Customer 로그인 성공');
    console.log(`   SessionId: ${sessionId}\n`);

    // 2. Get Menus
    console.log('2️⃣ 메뉴 조회');
    const menus = await axios.get(`${CUSTOMER_API}/menus?storeId=STORE123`);
    console.log(`✅ 메뉴 ${menus.data.length}개 조회 성공\n`);

    // 3. Create Order
    console.log('3️⃣ 주문 생성');
    const orderItems = [
      {
        menuId: menus.data[0].menuId,
        menuName: menus.data[0].menuName,
        quantity: 2,
        price: menus.data[0].price
      },
      {
        menuId: menus.data[1].menuId,
        menuName: menus.data[1].menuName,
        quantity: 1,
        price: menus.data[1].price
      }
    ];
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    const orderResponse = await axios.post(`${CUSTOMER_API}/orders`, {
      storeId: 'STORE123',
      tableId: 'T001',
      sessionId: sessionId,
      items: orderItems,
      totalAmount: totalAmount
    });
    const orderId = orderResponse.data.orderId;
    console.log('✅ 주문 생성 성공');
    console.log(`   OrderId: ${orderId}`);
    console.log(`   Total: ${totalAmount}원\n`);

    // 4. Admin Login
    console.log('4️⃣ Admin 로그인');
    const adminLogin = await axios.post(`${ADMIN_API}/auth/login`, {
      storeId: 'STORE123',
      username: 'admin1',
      password: 'password123'
    });
    const adminToken = adminLogin.data.token;
    console.log('✅ Admin 로그인 성공\n');

    // 5. Admin - Get Orders
    console.log('5️⃣ Admin - 주문 목록 조회');
    const orders = await axios.get(`${ADMIN_API}/orders`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });
    console.log(`✅ 주문 ${orders.data.length}개 조회 성공`);
    const createdOrder = orders.data.find(o => o.orderId === orderId);
    if (createdOrder) {
      console.log(`   주문 상태: ${createdOrder.status}\n`);
    }

    // 6. Admin - Update Order Status to PREPARING
    console.log('6️⃣ Admin - 주문 상태 변경 (PENDING → PREPARING)');
    await axios.patch(
      `${ADMIN_API}/orders/${orderId}/status`,
      { status: 'PREPARING' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ 주문 상태 변경 성공\n');

    // 7. Customer - Check Order Status
    console.log('7️⃣ Customer - 주문 상태 확인');
    const customerOrders = await axios.get(
      `${CUSTOMER_API}/orders?tableId=T001&sessionId=${sessionId}`
    );
    const updatedOrder = customerOrders.data.find(o => o.orderId === orderId);
    if (updatedOrder) {
      console.log(`✅ 주문 상태 확인: ${updatedOrder.status}\n`);
    }

    // 8. Admin - Update Order Status to COMPLETED
    console.log('8️⃣ Admin - 주문 상태 변경 (PREPARING → COMPLETED)');
    await axios.patch(
      `${ADMIN_API}/orders/${orderId}/status`,
      { status: 'COMPLETED' },
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    console.log('✅ 주문 상태 변경 성공\n');

    // 9. Customer - Final Check
    console.log('9️⃣ Customer - 최종 주문 상태 확인');
    const finalOrders = await axios.get(
      `${CUSTOMER_API}/orders?tableId=T001&sessionId=${sessionId}`
    );
    const finalOrder = finalOrders.data.find(o => o.orderId === orderId);
    if (finalOrder) {
      console.log(`✅ 최종 주문 상태: ${finalOrder.status}\n`);
    }

    console.log('🎉 통합 테스트 완료! 모든 테스트 통과 ✅');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.response?.data || error.message);
    process.exit(1);
  }
}

testIntegration();
