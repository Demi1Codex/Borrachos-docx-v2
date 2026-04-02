// User Manager for NOSE App
// Handles user registration, login, and name resolution

class UserManager {
  constructor(githubClient) {
    this.github = githubClient;
    this.currentUser = null;
  }

  async hashPassword(password, salt = null) {
    const useSalt = salt || this.generateSalt();
    const encoder = new TextEncoder();
    const data = encoder.encode(useSalt + password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return { hash: hashHex, salt: useSalt };
  }

  generateSalt() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let salt = '';
    for (let i = 0; i < 16; i++) {
      salt += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return salt;
  }

  normalizeUsername(name) {
    return name.toLowerCase().trim().replace(/[^a-z0-9]/g, '_');
  }

  async resolveDuplicateName(baseName, index) {
    if (index === 0) return this.normalizeUsername(baseName);
    return `${this.normalizeUsername(baseName)}_${index}`;
  }

  async register(username, password) {
    const normalizedName = this.normalizeUsername(username);
    const index = await this.github.getUserIndex();
    
    let finalName = normalizedName;
    let counter = 0;
    
    while (index.users.some(u => u.username === finalName)) {
      finalName = await this.resolveDuplicateName(normalizedName, counter + 1);
      counter++;
    }

    const { hash, salt } = await this.hashPassword(password);

    const newUser = {
      username: finalName,
      displayName: username,
      passwordHash: hash,
      salt: salt,
      createdAt: new Date().toISOString()
    };

    index.users.push(newUser);
    await this.github.saveUserIndex(index);
    
    await this.github.saveUserIdeas(finalName, { ideas: [] });

    localStorage.setItem('nose_current_user', finalName);
    localStorage.setItem('nose_user_password', password);
    this.currentUser = finalName;

    return { success: true, username: finalName };
  }

  async login(username, password) {
    const normalizedName = this.normalizeUsername(username);
    const index = await this.github.getUserIndex();
    
    const user = index.users.find(u => 
      u.username === normalizedName || 
      u.displayName.toLowerCase() === username.toLowerCase()
    );

    if (!user) {
      return { success: false, error: 'Usuario no encontrado' };
    }

    const { hash } = await this.hashPassword(password, user.salt);
    
    if (hash !== user.passwordHash) {
      return { success: false, error: 'Contraseña incorrecta' };
    }

    localStorage.setItem('nose_current_user', user.username);
    localStorage.setItem('nose_user_password', password);
    this.currentUser = user.username;

    return { success: true, username: user.username };
  }

  logout() {
    localStorage.removeItem('nose_current_user');
    localStorage.removeItem('nose_user_password');
    this.currentUser = null;
  }

  getCurrentUser() {
    const stored = localStorage.getItem('nose_current_user');
    if (stored) {
      this.currentUser = stored;
    }
    return this.currentUser;
  }

  getStoredPassword() {
    return localStorage.getItem('nose_user_password');
  }

  async autoLogin() {
    const username = this.getCurrentUser();
    const password = this.getStoredPassword();
    
    if (username && password) {
      const result = await this.login(username, password);
      return result.success ? username : null;
    }
    return null;
  }
}

window.UserManager = UserManager;