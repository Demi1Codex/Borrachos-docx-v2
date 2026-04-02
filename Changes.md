# Changes.md - Registro de cambios del proyecto

## Formato de registro:
- Fecha
- Hora
- Nombre del archivo o carpeta
- Tipo de operación (creación, modificación, eliminación)
- Descripción de la operación

---

## Registro de cambios recientes

### 2026-04-02
- **src/github-client.js** - Modificación: Agregado Storage helper para persistencia cruzada (web usa localStorage, Android usa Capacitor Preferences)
- **src/user-manager.js** - Modificación: Actualizado para usar Storage.saveCredentials/getCredentials/clearCredentials en lugar de localStorage directo
- **src/main.js** - Modificación: Actualizado init() para usar userManager.getCurrentUser() y autoLogin() que now son async
- **@capacitor/preferences** - Creación: Nuevo plugin instalado para persistencia en Android
- **android/** - Modificación: Agregado plugin preferences, APK recompilada

### Notas para IAs futuras:
- El sistema de login ahora usa Storage helper que detecta plataforma nativa
- En Android usa Capacitor Preferences (persiste al cerrar app)
- En web usa localStorage (funciona igual que antes)
- No afectar esta lógica al hacer cambios en autenticación