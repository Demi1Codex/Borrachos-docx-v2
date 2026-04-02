// Borrachos.docx Idea Manager Logic with GitHub Sync
let ideas = JSON.parse(localStorage.getItem('borrachos-ideas')) || JSON.parse(localStorage.getItem('patata-ideas')) || [];
let githubClient = null;
let userManager = null;
let currentUser = null;

const modal = document.getElementById('ideaModal');
const ideaForm = document.getElementById('ideaForm');
const themeToggle = document.getElementById('themeToggle');
const calendarModal = document.getElementById('calendarModal');
const sharedFileInput = document.getElementById('sharedFileInput');
const colorPickerBtn = document.getElementById('colorPickerBtn');
const accentColorInput = document.getElementById('accentColorInput');
const loginModal = document.getElementById('loginModal');
const userInfoBar = document.getElementById('userInfoBar');

// State
let currentFilter = 'all';

// Initialize
function init() {
  console.log('Borrachos.docx initializing...');
  
  // Initialize GitHub client and user manager
  githubClient = new GitHubBackendClient();
  userManager = new UserManager(githubClient);
  
  console.log('Testing GitHub connection...');
  
  // Check for stored user and try to login using cross-platform storage
  userManager.getCurrentUser().then(storedUser => {
    console.log('Stored user found:', storedUser);
    if (storedUser) {
      // Try auto-login
      userManager.autoLogin().then(loggedInUser => {
        console.log('Auto-login result:', loggedInUser);
        if (loggedInUser) {
          currentUser = loggedInUser;
          githubClient.getUserIdeas(currentUser).then(userData => {
            ideas = userData.ideas || [];
            console.log('Ideas loaded:', ideas.length);
            showApp();
            finishInit();
          }).catch((err) => {
            console.error('Error getting user ideas:', err);
            showLogin();
            finishInit();
          });
        } else {
          showLogin();
          finishInit();
        }
      }).catch((err) => {
        console.error('Auto-login error:', err);
        showLogin();
        finishInit();
      });
    } else {
      showLogin();
      finishInit();
    }
  }).catch((err) => {
    console.error('getCurrentUser error:', err);
    showLogin();
    finishInit();
  });
}

function finishInit() {
  renderIdeas();
  setupEventListeners();
  applySavedTheme();
  applySavedAccentColor();
}

function showLogin() {
  if (loginModal) {
    loginModal.style.display = 'flex';
    loginModal.classList.add('open');
  }
  if (userInfoBar) {
    userInfoBar.style.display = 'none';
  }
}

function showApp() {
  if (loginModal) {
    loginModal.style.display = 'none';
    loginModal.classList.remove('open');
  }
  if (userInfoBar) {
    userInfoBar.style.display = 'flex';
    const userDisplay = document.getElementById('currentUserDisplay');
    if (userDisplay && currentUser) {
      userDisplay.textContent = '👤 ' + currentUser;
    }
  }
}

function applySavedTheme() {
  const savedTheme = localStorage.getItem('theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  if (themeToggle) {
    themeToggle.textContent = savedTheme === 'dark' ? '☀️' : '🌙';
  }
}

function hexToHSL(H) {
  let r = 0, g = 0, b = 0;
  if (H.length == 4) {
    r = "0x" + H[1] + H[1];
    g = "0x" + H[2] + H[2];
    b = "0x" + H[3] + H[3];
  } else if (H.length == 7) {
    r = "0x" + H[1] + H[2];
    g = "0x" + H[3] + H[4];
    b = "0x" + H[5] + H[6];
  }
  r /= 255;
  g /= 255;
  b /= 255;
  let cmin = Math.min(r, g, b),
    cmax = Math.max(r, g, b),
    delta = cmax - cmin,
    h = 0,
    s = 0,
    l = 0;

  if (delta == 0) h = 0;
  else if (cmax == r) h = ((g - b) / delta) % 6;
  else if (cmax == g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;

  h = Math.round(h * 60);
  if (h < 0) h += 360;

  l = (cmax + cmin) / 2;
  s = delta == 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);

  return { h, s, l };
}

function updateThemeColors(hexColor) {
  const { h, s, l } = hexToHSL(hexColor);
  document.documentElement.style.setProperty('--accent-hue', h);
  document.documentElement.style.setProperty('--accent-saturation', s + '%');
  document.documentElement.style.setProperty('--accent-lightness', l + '%');
  document.documentElement.style.setProperty('--accent-color', hexColor);
}

function applySavedAccentColor() {
  const savedColor = localStorage.getItem('accentColor') || '#60A5FA';
  if (savedColor) {
    updateThemeColors(savedColor);
    if (accentColorInput) accentColorInput.value = savedColor;
  }
}

function setupEventListeners() {
  // Login/Register tabs
  const loginTabBtn = document.getElementById('loginTabBtn');
  const registerTabBtn = document.getElementById('registerTabBtn');
  const loginForm = document.getElementById('loginForm');
  const registerForm = document.getElementById('registerForm');
  
  if (loginTabBtn) {
    loginTabBtn.addEventListener('click', () => {
      loginTabBtn.classList.add('active');
      if (registerTabBtn) registerTabBtn.classList.remove('active');
      if (loginForm) loginForm.style.display = 'block';
      if (registerForm) registerForm.style.display = 'none';
    });
  }
  
  if (registerTabBtn) {
    registerTabBtn.addEventListener('click', () => {
      registerTabBtn.classList.add('active');
      if (loginTabBtn) loginTabBtn.classList.remove('active');
      if (loginForm) loginForm.style.display = 'none';
      if (registerForm) registerForm.style.display = 'block';
    });
  }
  
  // Login form submit
  if (loginForm) {
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('loginUsername').value;
      const password = document.getElementById('loginPassword').value;
      
      const result = await userManager.login(username, password);
      if (result.success) {
        currentUser = result.username;
        localStorage.setItem('nose_current_user', username);
        localStorage.setItem('nose_user_password', password);
        const userData = await githubClient.getUserIdeas(currentUser);
        ideas = userData.ideas || [];
        showApp();
        renderIdeas();
      } else {
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
          errorEl.textContent = result.error;
          errorEl.style.display = 'block';
        }
      }
    });
  }
  
  // Register form submit
  if (registerForm) {
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const username = document.getElementById('registerUsername').value;
      const password = document.getElementById('registerPassword').value;
      const password2 = document.getElementById('registerPassword2').value;
      
      if (password !== password2) {
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
          errorEl.textContent = 'Las contraseñas no coinciden';
          errorEl.style.display = 'block';
        }
        return;
      }
      
      const result = await userManager.register(username, password);
      if (result.success) {
        currentUser = result.username;
        localStorage.setItem('nose_current_user', username);
        localStorage.setItem('nose_user_password', password);
        ideas = [];
        showApp();
        renderIdeas();
      } else {
        const errorEl = document.getElementById('loginError');
        if (errorEl) {
          errorEl.textContent = result.error;
          errorEl.style.display = 'block';
        }
      }
    });
  }
  
  // Logout button
  const logoutBtn = document.getElementById('logoutBtn');
  if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
      await userManager.logout();
      currentUser = null;
      ideas = [];
      showLogin();
    });
  }
  
  // Color picker (accent color)
  if (colorPickerBtn) {
    colorPickerBtn.addEventListener('click', () => {
      accentColorInput.click();
    });
  }
  
  if (accentColorInput) {
    accentColorInput.addEventListener('input', (e) => {
      const color = e.target.value;
      updateThemeColors(color);
      localStorage.setItem('accentColor', color);
    });
  }
  
  themeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
    themeToggle.textContent = newTheme === 'dark' ? '☀️' : '🌙';
  });

  // Modal Open (Main button)
  document.getElementById('addIdeaBtn').addEventListener('click', () => {
    openModal();
  });

  // Modal Close
  document.getElementById('closeModalBtn').addEventListener('click', closeModal);
  document.getElementById('cancelIdea').addEventListener('click', closeModal);

  // Calendar
  document.getElementById('calendarBtn').addEventListener('click', openCalendar);
  document.getElementById('closeCalendar').addEventListener('click', closeCalendar);
  document.getElementById('closeCalendarBtn').addEventListener('click', closeCalendar);

  // Share (Export)
  document.getElementById('shareBtn').addEventListener('click', exportIdeas);

  // Open (Import)
  document.getElementById('openSharedBtn').addEventListener('click', () => sharedFileInput.click());
  sharedFileInput.addEventListener('change', importIdeas);

  // Form Submit
  ideaForm.addEventListener('submit', (e) => {
    e.preventDefault();
    saveIdea();
  });

  // Filter change
  document.querySelectorAll('input[name="category"]').forEach(radio => {
    radio.addEventListener('change', (e) => {
      currentFilter = e.target.value;
      renderIdeas();
    });
  });

  // Drag and Drop
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.lock') || file.name.endsWith('.json'))) {
      handleImport(file);
    }
  });

  // Notifications Permission
  const requestNotifyBtn = document.getElementById('requestNotifyBtn');
  if (requestNotifyBtn) {
    requestNotifyBtn.addEventListener('click', async () => {
      try {
        if (window.Capacitor && window.Capacitor.isNativePlatform()) {
          const { LocalNotifications } = await import('@capacitor/local-notifications');
          const permission = await LocalNotifications.requestPermissions();
          if (permission.display === 'granted') {
            showToast('✅ Notificaciones activadas');
          } else {
            showToast('❌ Permiso denegado');
          }
        } else if ('Notification' in window) {
          const permission = await Notification.requestPermission();
          if (permission === 'granted') {
            showToast('✅ Notificaciones activadas');
          } else {
            showToast('❌ Permiso denegado');
          }
        }
      } catch (err) {
        console.error('Error requesting notifications', err);
      }
    });
  }
}

function openModal(idea = null, defaultStatus = 'progress') {
  const title = document.getElementById('modalTitle');
  const idInput = document.getElementById('ideaId');
  const nameInput = document.getElementById('ideaTitle');
  const descInput = document.getElementById('ideaDesc');
  const catSelect = document.getElementById('ideaCategory');
  const statusSelect = document.getElementById('ideaStatus');
  const dateInput = document.getElementById('ideaDate');
  const notifySelect = document.getElementById('ideaNotify');
  const keepSharedCheckbox = document.getElementById('ideaKeepShared');

  if (idea) {
    title.textContent = 'Editar Idea';
    idInput.value = idea.id;
    nameInput.value = idea.name;
    descInput.value = idea.description;
    catSelect.value = idea.category;
    statusSelect.value = idea.status;
    dateInput.value = idea.date || '';
    notifySelect.value = idea.notify !== undefined ? idea.notify.toString() : 'true';
    if (keepSharedCheckbox) keepSharedCheckbox.checked = idea.keepShared || false;
  } else {
    title.textContent = 'Nueva Idea';
    idInput.value = '';
    ideaForm.reset();
    statusSelect.value = defaultStatus;
    if (keepSharedCheckbox) keepSharedCheckbox.checked = false;
  }

  modal.classList.add('open');
}

function closeModal() {
  modal.classList.remove('open');
}

function openCalendar() {
  const eventsContainer = document.getElementById('eventsContainer');
  eventsContainer.innerHTML = '';

  const ideasWithDate = ideas.filter(i => i.date).sort((a, b) => new Date(a.date) - new Date(b.date));

  if (ideasWithDate.length === 0) {
    eventsContainer.innerHTML = '<p class="empty-state">No hay ideas con fecha programada.</p>';
  } else {
    ideasWithDate.forEach(idea => {
      const dateObj = new Date(idea.date);
      const timeStr = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const dateStr = dateObj.toLocaleDateString([], { day: '2-digit', month: 'short' });

      const item = document.createElement('div');
      item.className = 'event-item';
      item.innerHTML = `
        <div class="event-time-badge">
          <span class="time">${timeStr}</span>
          <span class="date">${dateStr}</span>
        </div>
        <div class="event-details">
          <div class="event-title">${idea.name}</div>
          <div class="event-meta">
            <span class="category">${idea.category}</span>
          </div>
        </div>
      `;
      eventsContainer.appendChild(item);
    });
  }

  calendarModal.classList.add('open');
}

function closeCalendar() {
  calendarModal.classList.remove('open');
}

async function deriveKey(password, salt) {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    'PBKDF2',
    false,
    ['deriveBits', 'deriveKey']
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

async function exportIdeas() {
  const password = prompt('Elige una contraseña para cifrar el archivo (déjala vacía para no cifrar):');
  const dataStr = JSON.stringify(ideas, null, 2);
  const fileName = `borrachos-ideas-${new Date().toISOString().split('T')[0]}.lock`;

  let exportData;
  if (password) {
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);
    const enc = new TextEncoder();
    const data = enc.encode(dataStr);
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv },
      key,
      data
    );

    exportData = {
      salt: Array.from(salt),
      iv: Array.from(iv),
      ciphertext: Array.from(new Uint8Array(ciphertext))
    };
  } else {
    exportData = ideas;
  }

  const contentToSave = JSON.stringify(exportData, null, 2);

  // 1. Android / iOS (Capacitor Native)
  if (window.Capacitor && window.Capacitor.isNativePlatform()) {
    try {
      const { Filesystem, Directory } = await import('@capacitor/filesystem');

      // Request permission explicitly
      if (window.Capacitor.getPlatform() === 'android') {
        let perm = await Filesystem.checkPermissions();
        console.log('Current permissions:', perm);

        if (perm.publicStorage !== 'granted') {
          perm = await Filesystem.requestPermissions();
          if (perm.publicStorage !== 'granted') {
            alert('Permiso de almacenamiento denegado. No se puede guardar el archivo.');
            return;
          }
        }
      }

      const folderName = 'borrachos.locks';
      const dir = Directory.Documents; // Using Documents corresponds to /storage/emulated/0/Documents
      // Documents is much more reliable on Android 11+ (API 30+)

      try {
        await Filesystem.mkdir({
          path: folderName,
          directory: dir,
          recursive: true
        });
      } catch (e) {
        // Folder might already exist
      }

      const writeResult = await Filesystem.writeFile({
        path: `${folderName}/${fileName}`,
        data: contentToSave,
        directory: dir,
        encoding: 'utf8'
      });

      showToast(`✅ Guardado en Documentos/${folderName}`);
      console.log('Save result:', writeResult);
      return;
    } catch (err) {
      console.error('Filesystem Error:', err);
      alert('Error técnico al guardar: ' + err.message);
    }
  }

  // 2. Electron Native Dialog (Previous implementation)
  if (window.ipcRenderer || (window.process && window.process.type === 'renderer')) {
    const ipc = window.ipcRenderer || require('electron').ipcRenderer;
    try {
      const result = await ipc.invoke('show-save-dialog', {
        title: 'Guardar tablero',
        defaultPath: fileName,
        filters: [{ name: 'Borrachos Lock', extensions: ['lock'] }]
      });

      if (!result.canceled && result.filePath) {
        const writeResult = await ipc.invoke('write-file', result.filePath, contentToSave);
        if (writeResult.success) {
          showToast('✅ Archivo guardado correctamente');
          return;
        } else {
          alert('Error al guardar el archivo: ' + writeResult.error);
        }
      } else {
        return; // Canceled
      }
    } catch (err) {
      console.warn('Electron IPC failed, falling back to web methods', err);
    }
  }

  // 3. Modern Web File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [{
          description: 'Borrachos Lock File',
          accept: { 'application/json': ['.lock'] },
        }],
      });
      const writable = await handle.createWritable();
      await writable.write(contentToSave);
      await writable.close();
      showToast('✅ Archivo guardado correctamente');
      return;
    } catch (err) {
      if (err.name === 'AbortError') return;
      console.warn('File System Access API failed, falling back to legacy download', err);
    }
  }

  // 4. Legacy fallback (Old method)
  const blob = new Blob([contentToSave], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  showToast('✅ Descarga iniciada');
}

function importIdeas(e) {
  const file = e.target.files[0];
  if (!file) return;
  handleImport(file);
}

function handleImport(file) {
  const reader = new FileReader();
  reader.onload = (event) => {
    try {
      const imported = JSON.parse(event.target.result);
      processImport(imported);
    } catch (err) {
      alert('Error al importar el archivo.');
    }
  };
  reader.readAsText(file);
}

async function processImport(imported) {
  let finalData = imported;

  if (imported.salt && imported.iv && imported.ciphertext) {
    const password = prompt('Este archivo está cifrado. Introduce la contraseña:');
    if (!password) return;

    try {
      const salt = new Uint8Array(imported.salt);
      const iv = new Uint8Array(imported.iv);
      const ciphertext = new Uint8Array(imported.ciphertext);
      const key = await deriveKey(password, salt);

      const decrypted = await crypto.subtle.decrypt(
        { name: 'AES-GCM', iv: iv },
        key,
        ciphertext
      );

      const dec = new TextDecoder();
      finalData = JSON.parse(dec.decode(decrypted));
    } catch (err) {
      alert('Contraseña incorrecta o archivo corrupto.');
      return;
    }
  }

  if (Array.isArray(finalData)) {
    // Filtrar solo ideas con keepShared: true
    const sharedIdeas = finalData.filter(i => i.keepShared === true);
    
    if (sharedIdeas.length === 0) {
      alert('No hay ideas marcadas como "Mantener al importar" en este archivo.');
      return;
    }
    
    const newIdeas = sharedIdeas.filter(i => !ideas.find(ex => ex.id === i.id));
    
    if (newIdeas.length === 0) {
      alert('Todas las ideas compartidas ya existen en tu lista.');
      return;
    }
    
    if (confirm(`Se importarán ${newIdeas.length} idea(s) compartida(s).`)) {
      // Generar nuevos IDs para evitar conflictos
      const ideasWithNewIds = newIdeas.map(idea => ({
        ...idea,
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        timestamp: Date.now()
      }));
      ideas = [...ideas, ...ideasWithNewIds];
      localStorage.setItem('borrachos-ideas', JSON.stringify(ideas));
      // Sync to GitHub if logged in
      if (currentUser && githubClient) {
        githubClient.saveUserIdeas(currentUser, { ideas }).catch(err => console.error('GitHub sync error:', err));
      }
      renderIdeas();
    }
  } else {
    alert('El formato del archivo no es válido.');
  }
}

function saveIdea() {
  const id = document.getElementById('ideaId').value;
  const newIdea = {
    id: id || Date.now().toString(),
    name: document.getElementById('ideaTitle').value,
    description: document.getElementById('ideaDesc').value,
    category: document.getElementById('ideaCategory').value,
    status: document.getElementById('ideaStatus').value,
    date: document.getElementById('ideaDate').value,
    notify: document.getElementById('ideaNotify').value === 'true',
    keepShared: document.getElementById('ideaKeepShared') ? document.getElementById('ideaKeepShared').checked : false,
    timestamp: Date.now()
  };

  if (id) {
    ideas = ideas.map(i => i.id === id ? newIdea : i);
  } else {
    ideas.push(newIdea);
  }

  localStorage.setItem('borrachos-ideas', JSON.stringify(ideas));
  
  // Sync to GitHub if logged in
  if (currentUser && githubClient) {
    githubClient.saveUserIdeas(currentUser, { ideas }).catch(err => console.error('GitHub sync error:', err));
  }
  
  renderIdeas();

  if (newIdea.date && newIdea.notify) {
    scheduleNotification(newIdea);
  }

  closeModal();
}

function toggleStatus(id) {
  ideas = ideas.map(i => {
    if (i.id === id) {
      const current = (i.status === 'progress' || i.status === 'progreso') ? 'progress' : 'paused';
      return { ...i, status: current === 'progress' ? 'paused' : 'progress' };
    }
    return i;
  });
  localStorage.setItem('borrachos-ideas', JSON.stringify(ideas));
  
  // Sync to GitHub if logged in
  if (currentUser && githubClient) {
    githubClient.saveUserIdeas(currentUser, { ideas }).catch(err => console.error('GitHub sync error:', err));
  }
  
  renderIdeas();
}

function deleteIdea(id) {
  if (confirm('¿Seguro que quieres borrar esta idea?')) {
    ideas = ideas.filter(i => i.id !== id);
    localStorage.setItem('borrachos-ideas', JSON.stringify(ideas));
    
    // Sync to GitHub if logged in
    if (currentUser && githubClient) {
      githubClient.saveUserIdeas(currentUser, { ideas }).catch(err => console.error('GitHub sync error:', err));
    }
    
    renderIdeas();
  }
}

function renderIdeas() {
  const progressList = document.getElementById('progressList');
  const pausedList = document.getElementById('pausedList');
  const progressCount = document.getElementById('progressCount');
  const pausedCount = document.getElementById('pausedCount');

  progressList.innerHTML = '<div class="empty-state">No hay ideas en progreso</div>';
  pausedList.innerHTML = '<div class="empty-state">No hay ideas pausadas</div>';

  const filteredIdeas = ideas.filter(i => currentFilter === 'all' || i.category === currentFilter);

  const progIdeas = filteredIdeas.filter(i => i.status === 'progress' || i.status === 'progreso');
  const pausIdeas = filteredIdeas.filter(i => i.status === 'paused' || i.status === 'pausado');

  if (progIdeas.length > 0) progressList.innerHTML = '';
  if (pausIdeas.length > 0) pausedList.innerHTML = '';

  filteredIdeas.forEach(idea => {
    // Standardize status for rendering
    const statusClass = (idea.status === 'progress' || idea.status === 'progreso') ? 'progress' : 'paused';

    const card = document.createElement('div');
    card.className = `idea-card ${statusClass}`;

    let dateHtml = '';
    if (idea.date) {
      const d = new Date(idea.date);
      dateHtml = `<div class="event-time">📅 ${d.toLocaleDateString()} ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>`;
    }

    card.innerHTML = `
      <div class="category-badge">${idea.category}</div>
      <div class="card-title">${idea.name}</div>
      <div class="card-desc">${idea.description}</div>
      ${dateHtml}
      <div class="card-actions">
        <button class="btn-icon status-btn" title="${statusClass === 'progress' ? 'Pausar' : 'Reanudar'}">${statusClass === 'progress' ? '⏸️' : '▶️'}</button>
        <button class="btn-icon edit-btn" title="Editar">✏️</button>
        <button class="btn-icon btn-delete delete-btn" title="Borrar">🗑️</button>
      </div>
    `;

    card.querySelector('.edit-btn').onclick = () => openModal(idea);
    card.querySelector('.delete-btn').onclick = () => deleteIdea(idea.id);
    card.querySelector('.status-btn').onclick = () => toggleStatus(idea.id);

    if (statusClass === 'progress') {
      progressList.appendChild(card);
    } else {
      pausedList.appendChild(card);
    }
  });

  progressCount.textContent = progIdeas.length;
  pausedCount.textContent = pausIdeas.length;
}

async function scheduleNotification(idea) {
  if (!idea.date || !idea.notify) return;
  const fireDate = new Date(idea.date);
  if (fireDate <= new Date()) return;

  try {
    if (window.Capacitor && window.Capacitor.isNativePlatform()) {
      const { LocalNotifications } = await import('@capacitor/local-notifications');
      await LocalNotifications.schedule({
        notifications: [
          {
            title: 'Recordatorio: ' + idea.name,
            body: idea.description,
            id: Math.floor(Math.random() * 1000000),
            schedule: { at: fireDate },
            actionTypeId: "",
            extra: null
          }
        ]
      });
    } else if ('Notification' in window && Notification.permission === 'granted') {
      const delay = fireDate.getTime() - Date.now();
      setTimeout(() => {
        new Notification('Recordatorio: ' + idea.name, {
          body: idea.description,
          icon: '/palpueblo.png'
        });
      }, delay);
    }
  } catch (err) {
    console.error('Error scheduling notification', err);
  }
}

function showToast(message) {
  const container = document.getElementById('notificationContainer');
  if (!container) return;
  const toast = document.createElement('div');
  toast.className = 'notification-toast';
  toast.innerHTML = `
    <span class="notify-icon">🔔</span>
    <div class="notify-body">
      <div class="notify-header">Borrachos.docx</div>
      <div class="notify-msg">${message}</div>
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, 3000);
}

init();
