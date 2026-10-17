# Artificial Levels: frontend

Interfaz web para describir un nivel con tus palabras y jugarlo en el navegador.

- **Backend:** [AI_level](https://github.com/ghosstbabby12/AI_level), desplegado en Render.
- **Despliegue:** Netlify. `netlify.toml` reenvía `/api/*` al backend, así el navegador ve un solo dominio y la cookie de sesión funciona.

## Archivos

- `index.html`: estructura y estilos (modo claro y oscuro).
- `app.js`: sesión, tema y llamadas a la API.
- `game.js`: motor del juego en canvas.

## Desarrollo local

Clona los dos repositorios uno al lado del otro y arranca el backend sirviendo esta carpeta:

```bash
cd AI_level
FRONTEND_DIR=../AI_level-frontend npm run dev
```

Abre http://localhost:3000.
