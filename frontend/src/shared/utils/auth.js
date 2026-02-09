class AuthService {
  static setTokens(accessToken, refreshToken) {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  static getAccessToken() {
    return localStorage.getItem('accessToken');
  }

  static getRefreshToken() {
    return localStorage.getItem('refreshToken');
  }

  static clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  static isAuthenticated() {
    return !!this.getAccessToken();
  }

  static setTableInfo(tableInfo) {
    localStorage.setItem('tableInfo', JSON.stringify(tableInfo));
  }

  static getTableInfo() {
    const info = localStorage.getItem('tableInfo');
    return info ? JSON.parse(info) : null;
  }

  static clearTableInfo() {
    localStorage.removeItem('tableInfo');
  }

  static clearAll() {
    this.clearTokens();
    this.clearTableInfo();
  }
}

export default AuthService;
