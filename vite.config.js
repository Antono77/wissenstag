import { defineConfig } from 'vite';

// base './' sorgt für relative Pfade. So läuft die Seite auf GitHub Pages
// (auch in einem Unterordner wie /wissenstag/) und auf Netlify ohne Anpassung.
export default defineConfig({
  base: './',
  server: { port: 5173, open: false },
  preview: { port: 4173 },
  build: { outDir: 'dist', assetsInlineLimit: 0 },
});
