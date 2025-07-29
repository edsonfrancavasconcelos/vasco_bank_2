import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  server: {
  proxy: {
    '/cdn-cgi': {
      target: 'http://localhost:5173',
      changeOrigin: true,
      bypass: (req, res, options) => {
        return req.url;
      },
    },
  },
},
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'pages/index.html'),
        dashboard: resolve(__dirname, 'pages/dashboard.html'),
        login: resolve(__dirname, 'pages/login.html'),
        createAccount: resolve(__dirname, 'pages/create-account.html'),
        createCard: resolve(__dirname, 'pages/create-card.html'),
        productsService: resolve(__dirname, 'pages/products-service.html'),
        recoverAccess: resolve(__dirname, 'pages/recover-access.html'),
        pixArea: resolve(__dirname, 'pages/pix-area.html'),
        minhasChaves: resolve(__dirname, 'pages/minhas-chaves.html'),
        pagamentoPix: resolve(__dirname, 'pages/pagamento-pix.html'),
        programarPix: resolve(__dirname, 'pages/programar-pix.html'),
        registrarChavePix: resolve(__dirname, 'pages/registrar-chave-pix.html'),
        statement: resolve(__dirname, 'pages/statement.html'),
        transferencia: resolve(__dirname, 'pages/transferencia.html'),
      },
    },
  },
  publicDir: 'pages',
  resolve: {
    alias: {
      '/css': resolve(__dirname, 'pages/css'),
      '/img': resolve(__dirname, 'pages/img'),
      '/js': resolve(__dirname, 'pages/js'),
    },
  },
});
