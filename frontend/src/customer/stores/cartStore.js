import { create } from 'zustand';

const useCartStore = create((set, get) => ({
  items: [],
  totalAmount: 0,

  addItem: (menu) => {
    const items = get().items;
    const existingItem = items.find(item => item.menuId === menu.menuId);

    if (existingItem) {
      set({
        items: items.map(item =>
          item.menuId === menu.menuId
            ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
            : item
        )
      });
    } else {
      set({ items: [...items, { ...menu, quantity: 1 }] });
    }

    get().calculateTotal();
    get().saveToLocalStorage();
  },

  incrementQuantity: (menuId) => {
    set({
      items: get().items.map(item =>
        item.menuId === menuId
          ? { ...item, quantity: Math.min(item.quantity + 1, 99) }
          : item
      )
    });
    get().calculateTotal();
    get().saveToLocalStorage();
  },

  decrementQuantity: (menuId) => {
    const items = get().items;
    const item = items.find(i => i.menuId === menuId);

    if (item && item.quantity === 1) {
      get().removeItem(menuId);
    } else {
      set({
        items: items.map(i =>
          i.menuId === menuId ? { ...i, quantity: i.quantity - 1 } : i
        )
      });
      get().calculateTotal();
      get().saveToLocalStorage();
    }
  },

  removeItem: (menuId) => {
    set({ items: get().items.filter(item => item.menuId !== menuId) });
    get().calculateTotal();
    get().saveToLocalStorage();
  },

  clearCart: () => {
    set({ items: [], totalAmount: 0 });
    localStorage.removeItem('cart');
  },

  calculateTotal: () => {
    const total = get().items.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );
    set({ totalAmount: total });
  },

  saveToLocalStorage: () => {
    const { items, totalAmount } = get();
    localStorage.setItem('cart', JSON.stringify({ items, totalAmount }));
  },

  loadFromLocalStorage: () => {
    const saved = localStorage.getItem('cart');
    if (saved) {
      const { items, totalAmount } = JSON.parse(saved);
      set({ items, totalAmount });
    }
  }
}));

export default useCartStore;
