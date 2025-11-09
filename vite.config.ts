import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) {
            return;
          }

          if (id.includes('@react-three/drei')) {
            return 'drei';
          }

          if (id.includes('@react-three/fiber')) {
            return 'fiber';
          }

          if (id.includes('three/examples')) {
            return 'three-examples';
          }

          if (id.includes('three/src/math') || id.includes('three/src/utils')) {
            return 'three-math';
          }

          if (id.includes('three/src/core') || id.includes('three/src/animation')) {
            return 'three-core';
          }

          if (id.includes('three/src/objects') || id.includes('three/src/geometries') || id.includes('three/src/materials')) {
            return 'three-objects';
          }

          if (id.includes('three/src/renderers')) {
            return 'three-renderers';
          }

          if (id.includes('three-stdlib')) {
            return 'three-stdlib';
          }

          if (id.includes('three/addons')) {
            return 'three-examples';
          }

          if (id.includes('three')) {
            return 'three-vendor';
          }

          if (id.includes('@mui') || id.includes('@emotion')) {
            return 'mui';
          }

          if (id.includes('react-dom') || id.includes('react')) {
            return 'react';
          }
        },
      },
    },
  },
  server: {
    port: 3000,
  },
})
