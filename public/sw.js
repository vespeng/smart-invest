// 空的 service worker，用于消除 sw.js 404 错误
// 立即注销自身
self.addEventListener('install', () => self.skipWaiting());
self.addEventListener('activate', () => self.clients.claim());
self.addEventListener('fetch', () => {});
