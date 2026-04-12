# 💡 Borrachos.docx

**Tu gestor de ideas personal. Guarda todo en local, compártelo cifrado.**

Borrachos.docx es una aplicación web para organizar ideas, proyectos y tareas en un tablero Kanban con categorías, calendario, notificaciones y compartición segura.

![Theme](https://img.shields.io/badge/Theme-Dark%2FLight-1a1a2e)
![Privacy](https://img.shields.io/badge/Privacy-100%25%20Local-00d9a0)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## ✨ Características

### 📋 Tablero Kanban
- **Dos columnas:** En Progreso y Pausado
- **Arrastra y organiza** tus ideas entre estados
- **Categorías:** Personal, Trabajo, Diversión, Grupales
- **Filtra por categoría** con tabs animados

### 📅 Calendario Integrado
- Visualiza tus ideas con fecha/hora programada
- Recibe **notificaciones de escritorio** cuando llegue el momento
- Organiza tu tiempo de forma visual

### 🔐 Compartición Segura
- **Exporta ideas** como archivos `.lock`
- **Cifrado AES-GCM 256-bit** con contraseña
- **Importa** ideas compartidas fácilmente
- Comparte solo lo que quieras, cuando quieras

### 🎨 Personalización
- **Temas claro/oscuro** con un click
- **Paleta de colores** personalizable
- Diseño responsive para móvil y escritorio

### 💾 Privacidad Total
- **Sin cuenta:** 100% local, tus datos nunca salen de tu dispositivo
- **Con cuenta:** Sincronización opcional con tu repositorio GitHub privado
- Usa **LocalStorage** del navegador
- Sin cookies de seguimiento, sin análisis de terceros

---

## 🚀 Empezar

1. **Abre `index.html`** en tu navegador
2. **Crea tu primera idea** con el botón "+ Nueva Idea"
3. **Personaliza** el tema y color desde la barra superior
4. **¡Listo!** Tus ideas se guardan automáticamente

### Compartir una idea
1. Haz click en el botón **📤 Compartir** en una idea
2. Establece una **contraseña**
3. Descarga el archivo **`.lock`**
4. Envíalo a quien quieras (junto con la contraseña)

### Importar una idea
1. Click en **📂 Abrir Compartido**
2. Selecciona el archivo **`.lock`**
3. Ingresa la **contraseña**
4. La idea aparece en tu tablero

---

## 🎯 Tecnologías

| Tecnología | Uso |
|------------|-----|
| HTML5 | Estructura |
| CSS3 | Estilos, Variables CSS, Animaciones |
| JavaScript (ES6+) | Lógica de aplicación |
| Web Crypto API | Cifrado AES-GCM |
| LocalStorage | Almacenamiento local |
| Google Fonts | Tipografía (Inter) |

---

## 🎨 Diseño Visual

### Paleta de Colores
```
┌─────────────────────────────────────────┐
│  Primario:      #00FF3C (Verde neón)   │
│  Progreso:      #60A5FA (Azul)         │
│  Pausado:       #F87171 (Rojo)         │
│  Fondo oscuro:  #121212                │
│  Fondo claro:   #F5F5F5                │
└─────────────────────────────────────────┘
```

### Tipografía
- **Font:** Inter (Google Fonts)
- **Pesos:** 400, 500, 600, 700

### Características del Diseño
- Efecto glass/blur en el header
- Animaciones suaves de entrada
- Bordes redondeados (16px containers)
- Estados hover con elevación
- Soporte completo dark/light mode

---

## 📁 Estructura

```
Complexion/
├── index.html          # Página principal
├── privacy.html       # Política de privacidad
├── style.css          # Estilos globales
├── palpueblo.png      # Logo
├── main.js            # Lógica principal
├── github-client.js   # Integración GitHub
├── user-manager.js    # Gestión de usuarios
└── referencias/       # Recursos de referencia
```

---

## 🔒 Privacidad

**Sin cuenta:** Todas tus ideas se almacenan exclusivamente en tu navegador (LocalStorage). No enviamos nada a servidores.

**Con cuenta:** Tus ideas se sincronizan con tu cuenta de GitHub para acceso multiplataforma. Tu usuario y contraseña se guardan localmente para auto-login.

**Archivos .lock:** Puedes exportar ideas como archivos cifrados locales en cualquier momento.

Consulta la [Política de Privacidad](privacy.html) para más detalles.

---

## 📝 Licencia

MIT License - Libre para usar, modificar y distribuir.

---

<p align="center">
  Hecho con 💡 y localStorage
</p>
