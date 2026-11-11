# Artificial Levels: frontend

Interfaz web para describir un nivel con tus palabras y jugarlo en el navegador.

- **Backend:** [AI_level](https://github.com/ghosstbabby12/AI_level), desplegado en Render.
- **Despliegue:** Netlify. `netlify.toml` reenvía `/api/*` al backend, así el navegador ve un solo dominio y la cookie de sesión funciona.

## Estructura

El HTML, los estilos y la lógica están separados; la lógica usa módulos ES sin framework.

```
index.html          estructura de la página (sin estilos ni lógica)
styles/             CSS por componente: base/, layout/, components/, views/, create/, library/, play/, dialogs/
js/main.js          punto de entrada: importa los módulos y los inicia en orden
js/api/             la única capa que habla con el backend (fetch)
js/core/            utilidades: DOM, almacenamiento, estado compartido, tema inicial
js/ui/              tema, vistas, menús, avisos, ajustes
js/library/         ejemplos, Mis juegos, tarjetas, miniaturas, búsqueda
js/create/          generar, progreso, cupo, trabajos en segundo plano, tiempo real
js/play/            jugar, modo juego, ajustes editables, Game Over, victoria, compartir
js/editor/          editor de escenarios
js/profile/ js/auth/ js/app/   perfil, sesión y arranque
js/game/            motor del juego (canvas), sprites, texturas, modos y controles táctiles
```

## Desarrollo local

Clona los dos repositorios uno al lado del otro y arranca el backend sirviendo esta carpeta:

```bash
cd AI_level
FRONTEND_DIR=../AI_level-frontend npm run dev
```

Abre http://localhost:3000.
