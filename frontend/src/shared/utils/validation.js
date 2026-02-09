class ValidationService {
  static validateOrder(order) {
    if (!order.items || order.items.length === 0) {
      throw new Error('장바구니가 비어있습니다');
    }

    order.items.forEach(item => {
      if (item.quantity < 1 || item.quantity > 99) {
        throw new Error('수량은 1~99 사이여야 합니다');
      }
    });

    if (order.totalAmount <= 0) {
      throw new Error('주문 금액이 올바르지 않습니다');
    }

    return true;
  }

  static validateCartItem(item) {
    if (!item.menuId) {
      throw new Error('메뉴 ID가 필요합니다');
    }

    if (item.quantity < 1 || item.quantity > 99) {
      throw new Error('수량은 1~99 사이여야 합니다');
    }

    if (item.price <= 0) {
      throw new Error('가격이 올바르지 않습니다');
    }

    return true;
  }
}

export default ValidationService;
