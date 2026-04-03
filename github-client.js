// GitHub Backend Client for NOSE App
// Repo: Demi1Codex/Borachos-datax

const REPO_OWNER = 'Demi1Codex';
const REPO_NAME = 'Borachos-datax';

// URL de Pastebin que contiene el token (fallback)
// User can also input token manually in Settings (stored in localStorage)
const PASTEBIN_URL = 'https://pastebin.com/raw/DYwRH2H7';
const CORS_PROXY = 'https://corsproxy.io/?';

let GITHUB_TOKEN = null;

async function fetchTokenFromPastebin(url) {
  const proxyUrl = CORS_PROXY + encodeURIComponent(url);
  try {
    const response = await fetch(proxyUrl);
    if (response.ok) {
      const token = await response.text();
      const trimmed = token.trim();
      if (trimmed.startsWith('ghp_') && trimmed.length > 20) {
        return trimmed;
      }
    }
  } catch (err) {
    console.error('[GitHub] Error fetching token from pastebin:', err);
  }
  return null;
}

async function getGitHubToken() {
  if (GITHUB_TOKEN) return GITHUB_TOKEN;
  
  // Intentar obtener del Storage primero
  if (window.Capacitor && window.Capacitor.isNativePlatform) {
    try {
      const { Preferences } = window.Capacitor.Plugins;
      const result = await Preferences.get({ key: 'github_token' });
      GITHUB_TOKEN = result.value;
    } catch {}
  }
  
  if (!GITHUB_TOKEN) {
    GITHUB_TOKEN = localStorage.getItem('github_token');
  }
  
  // Si no hay token en storage, intentar obtener de Pastebin
  if (!GITHUB_TOKEN) {
    GITHUB_TOKEN = await fetchTokenFromPastebin(PASTEBIN_URL);
    
    // Guardar el token obtenido de pastebin para la próxima vez
    if (GITHUB_TOKEN) {
      localStorage.setItem('github_token', GITHUB_TOKEN);
    }
  }
  
  return GITHUB_TOKEN;
}

async function setGitHubToken(token) {
  GITHUB_TOKEN = token;
  localStorage.setItem('github_token', token);
  
  if (window.Capacitor && window.Capacitor.isNativePlatform) {
    try {
      const { Preferences } = window.Capacitor.Plugins;
      await Preferences.set({ key: 'github_token', value: token });
    } catch {}
  }
}

const BASE_URL = `https://api.github.com/repos/${REPO_OWNER}/${REPO_NAME}/contents`;

// Storage helper using Capacitor Preferences for Android
const Storage = {
  _isNative: null,
  
  async isNative() {
    if (this._isNative === null) {
      try {
        this._isNative = window.Capacitor && window.Capacitor.isNativePlatform ? await window.Capacitor.isNativePlatform() : false;
      } catch {
        this._isNative = false;
      }
    }
    return this._isNative;
  },
  
  async saveCredentials(username, password) {
    try {
      if (await this.isNative() && window.Capacitor.Plugins.Preferences) {
        await window.Capacitor.Plugins.Preferences.set({ key: 'nose_current_user', value: username });
        await window.Capacitor.Plugins.Preferences.set({ key: 'nose_user_password', value: password });
      }
    } catch {}
    // Always also save to localStorage for web
    localStorage.setItem('nose_current_user', username);
    localStorage.setItem('nose_user_password', password);
  },
  
  async getCredentials() {
    if (await this.isNative()) {
      try {
        const user = await window.Capacitor.Plugins.Preferences.get({ key: 'nose_current_user' });
        const pass = await window.Capacitor.Plugins.Preferences.get({ key: 'nose_user_password' });
        if (user.value && pass.value) {
          return { username: user.value, password: pass.value };
        }
      } catch {}
    }
    // Fallback to localStorage
    return {
      username: localStorage.getItem('nose_current_user'),
      password: localStorage.getItem('nose_user_password')
    };
  },
  
  async clearCredentials() {
    try {
      if (await this.isNative() && window.Capacitor.Plugins.Preferences) {
        await window.Capacitor.Plugins.Preferences.remove({ key: 'nose_current_user' });
        await window.Capacitor.Plugins.Preferences.remove({ key: 'nose_user_password' });
      }
    } catch {}
    localStorage.removeItem('nose_current_user');
    localStorage.removeItem('nose_user_password');
  }
};

class GitHubBackendClient {
  constructor() {
    this.baseUrl = BASE_URL;
  }

  async getToken() {
    return await getGitHubToken();
  }

  async request(endpoint, options = {}) {
    const token = await this.getToken();
    if (!token) {
      throw new Error('Token de GitHub no configurado. Ve a Settings para configurar el token.');
    }
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        ...options.headers
      }
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getFile(path) {
    try {
      const data = await this.request(`/${path}`);
      if (data.content) {
        const content = atob(data.content);
        return JSON.parse(content);
      }
      return null;
    } catch (err) {
      if (err.message.includes('404')) return null;
      throw err;
    }
  }

  async saveFile(path, content, message = 'Update') {
    let sha = null;
    
    try {
      const existing = await this.request(`/${path}`);
      sha = existing.sha;
    } catch (err) {
      // File doesn't exist, will create new
    }

    const encodedContent = btoa(JSON.stringify(content, null, 2));
    
    const body = {
      message,
      content: encodedContent,
      ...(sha && { sha })
    };

    return await this.request(`/${path}`, {
      method: 'PUT',
      body: JSON.stringify(body)
    });
  }

  async getUserIndex() {
    const index = await this.getFile('users/index.json');
    return index || { users: [] };
  }

  async saveUserIndex(index) {
    return await this.saveFile('users/index.json', index, 'Update user index');
  }

  async getUserIdeas(username) {
    const data = await this.getFile(`users/${username}/ideas.json`);
    return data || { username, ideas: [], lastSync: null };
  }

  async saveUserIdeas(username, ideasData) {
    const path = `users/${username}/ideas.json`;
    const content = {
      username,
      ideas: ideasData.ideas || [],
      lastSync: new Date().toISOString()
    };
    return await this.saveFile(path, content, `Sync ideas for ${username}`);
  }
}

window.GitHubBackendClient = GitHubBackendClient;
window.setGitHubToken = setGitHubToken;
