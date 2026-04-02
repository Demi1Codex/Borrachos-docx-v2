// GitHub Backend Client for NOSE App
// Token: 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
// Repo: Demi1Codex/Borachos-datax

const GITHUB_TOKEN = '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';
const REPO_OWNER = 'Demi1Codex';
const REPO_NAME = 'Borachos-datax';
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
  constructor(token = GITHUB_TOKEN) {
    this.token = token;
    this.baseUrl = BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    const response = await fetch(url, {
      ...options,
      headers: {
        'Authorization': `token ${this.token}`,
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