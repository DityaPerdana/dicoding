class AuthManager {
  constructor() {
    this.tokenKey = "authToken";
    this.userKey = "userData";
  }

  setAuth(userData, token) {
    console.log(
      "Setting auth with token:",
      token ? "Token provided" : "No token",
    );
    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(userData));
  }

  getToken() {
    const token = localStorage.getItem(this.tokenKey);
    console.log(
      "Retrieved token from storage:",
      token ? "Token exists" : "No token",
    );

    if (
      token &&
      (token.length < 20 ||
        !token.includes(".") ||
        token === "undefined" ||
        token === "null")
    ) {
      console.log("Token appears invalid, removing it");
      this.logout();
      return null;
    }

    return token;
  }

  getUserData() {
    try {
      const userData = localStorage.getItem(this.userKey);
      if (!userData) return null;

      const parsedData = JSON.parse(userData);
      return parsedData;
    } catch (error) {
      console.error("Error parsing user data from storage:", error);
      this.logout();
      return null;
    }
  }

  isLoggedIn() {
    const token = this.getToken();
    return !!token;
  }

  logout() {
    console.log("Logging out, removing auth data");
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }
}

export default AuthManager;
