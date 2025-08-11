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
  createUser: resolve(__dirname, 'pages/createUser.html'),
  cardArea: resolve(__dirname, 'pages/cardArea.html'),
  emprestimos: resolve(__dirname, 'pages/emprestimos.html'),
  pix: resolve(__dirname, 'pages/pix.html'),
  produtos: resolve(__dirname, 'pages/produtos.html'),
  servicos: resolve(__dirname, 'pages/servicos.html'),
  transaction: resolve(__dirname, 'pages/transaction.html'),
}

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
