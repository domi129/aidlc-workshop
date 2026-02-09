import * as fs from 'fs';
import * as path from 'path';

const MOCK_DATA_FILE = path.join(__dirname, '../../../shared-mock-data.json');

interface MockData {
  tables: any[];
  menus: any[];
  orders: any[];
  admins: any[];
}

class SharedMockData {
  static loadData(): MockData {
    try {
      const data = fs.readFileSync(MOCK_DATA_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading shared mock data:', error);
      return { tables: [], menus: [], orders: [], admins: [] };
    }
  }

  static saveData(data: MockData): void {
    try {
      fs.writeFileSync(MOCK_DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
    } catch (error) {
      console.error('Error saving shared mock data:', error);
    }
  }

  // Tables
  static getTables(): any[] {
    const data = this.loadData();
    return data.tables;
  }

  static getTable(tableId: string): any {
    const tables = this.getTables();
    return tables.find(t => t.tableId === tableId);
  }

  // Menus
  static getMenus(storeId: string | null = null, category: string | null = null): any[] {
    const data = this.loadData();
    let menus = data.menus;
    
    if (storeId) {
      menus = menus.filter(m => m.storeId === storeId);
    }
    
    if (category && category !== '전체') {
      menus = menus.filter(m => m.category === category);
    }
    
    return menus;
  }

  static getMenu(menuId: string): any {
    const data = this.loadData();
    return data.menus.find(m => m.menuId === menuId);
  }

  static addMenu(menu: any): any {
    const data = this.loadData();
    data.menus.push(menu);
    this.saveData(data);
    return menu;
  }

  static updateMenu(menuId: string, updates: any): any | null {
    const data = this.loadData();
    const index = data.menus.findIndex(m => m.menuId === menuId);
    if (index !== -1) {
      data.menus[index] = { ...data.menus[index], ...updates };
      this.saveData(data);
      return data.menus[index];
    }
    return null;
  }

  static deleteMenu(menuId: string): void {
    const data = this.loadData();
    data.menus = data.menus.filter(m => m.menuId !== menuId);
    this.saveData(data);
  }

  // Orders
  static getOrders(storeId: string | null = null): any[] {
    const data = this.loadData();
    let orders = data.orders;
    
    if (storeId) {
      orders = orders.filter(o => o.storeId === storeId);
    }
    
    return orders.sort((a, b) => b.createdAt - a.createdAt);
  }

  static getOrder(orderId: string): any {
    const data = this.loadData();
    return data.orders.find(o => o.orderId === orderId);
  }

  static addOrder(order: any): any {
    const data = this.loadData();
    data.orders.push(order);
    this.saveData(data);
    return order;
  }

  static updateOrder(orderId: string, updates: any): any | null {
    const data = this.loadData();
    const index = data.orders.findIndex(o => o.orderId === orderId);
    if (index !== -1) {
      data.orders[index] = { ...data.orders[index], ...updates, updatedAt: Date.now() };
      this.saveData(data);
      return data.orders[index];
    }
    return null;
  }

  static deleteOrder(orderId: string): void {
    const data = this.loadData();
    data.orders = data.orders.filter(o => o.orderId !== orderId);
    this.saveData(data);
  }

  // Admins
  static getAdmin(username: string, storeId: string): any {
    const data = this.loadData();
    return data.admins.find(a => a.username === username && a.storeId === storeId);
  }

  static getAdmins(): any[] {
    const data = this.loadData();
    return data.admins;
  }
}

export default SharedMockData;
