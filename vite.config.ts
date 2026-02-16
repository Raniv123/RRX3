import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  base: '/RRX3/',
  plugins: [react()],
  define: {
    'process.env': {}
  }
});
