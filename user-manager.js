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
    
    // Verificar si el usuario ya existe
    if (index.users.some(u => u.username === normalizedName)) {
      return { success: false, error: 'El usuario ya existe' };
    }
    
    // Verificar también por displayName
    if (index.users.some(u => u.displayName.toLowerCase() === username.toLowerCase())) {
      return { success: false, error: 'El usuario ya existe' };
    }
    
    const finalName = normalizedName;
    
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

    // Use cross-platform storage
    await Storage.saveCredentials(finalName, password);
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

    // Use cross-platform storage
    await Storage.saveCredentials(user.username, password);
    this.currentUser = user.username;

    return { success: true, username: user.username };
  }

  async logout() {
    await Storage.clearCredentials();
    this.currentUser = null;
  }

  async getCurrentUser() {
    const creds = await Storage.getCredentials();
    if (creds.username) {
      this.currentUser = creds.username;
    }
    return this.currentUser;
  }

  async getStoredPassword() {
    const creds = await Storage.getCredentials();
    return creds.password;
  }

  async autoLogin() {
    const username = await this.getCurrentUser();
    const password = await this.getStoredPassword();
    
    if (username && password) {
      const result = await this.login(username, password);
      return result.success ? username : null;
    }
    return null;
  }
}

window.UserManager = UserManager;