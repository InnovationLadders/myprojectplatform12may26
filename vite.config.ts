import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

// Vite copies public/ normally, but some files have spaces in their names
// which cause EAGAIN errors on certain systems. This plugin removes those
// problematic files after the build completes — they are unused duplicates.
function removeSpacedFilesPlugin() {
  return {
    name: 'remove-spaced-public-files',
    closeBundle() {
      const outDir = path.resolve(__dirname, 'dist');

      function removeSpacedFiles(dir: string) {
        if (!fs.existsSync(dir)) return;
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        for (const entry of entries) {
          const fullPath = path.join(dir, entry.name);
          if (entry.isDirectory()) {
            removeSpacedFiles(fullPath);
          } else if (entry.name.includes(' ')) {
            try {
              fs.unlinkSync(fullPath);
            } catch {
              // ignore
            }
          }
        }
      }

      removeSpacedFiles(outDir);
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), removeSpacedFilesPlugin()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: true,
    rollupOptions: {
      output: {
        manualChunks: {
          react: ['react', 'react-dom', 'react-router-dom'],
          firebase: ['firebase/app', 'firebase/auth', 'firebase/firestore', 'firebase/storage'],
          ui: ['framer-motion', 'lucide-react'],
        }
      }
    }
  },
});