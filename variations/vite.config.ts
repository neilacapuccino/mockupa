import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// the 6-button page (page/App.tsx)
export default defineConfig({
  plugins: [react()],
  server: { port: 5180 },   // PulseDesk uses 5173, so this page uses 5180
  // if you ever run "npm i" inside one of the frontends, it gets its own copy of React.
  // dedupe makes this page still use ONE React (two copies would break the hooks)
  resolve: { dedupe: ['react', 'react-dom'] },
})
