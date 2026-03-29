// import { createProxyMiddleware } from "http-proxy-middleware";

// export const proxy = (targetUrl: string) => {
//   if (!targetUrl) {
//     throw new Error('Proxy target URL is required');
//   }

//   return createProxyMiddleware({
//     target: targetUrl,
//     changeOrigin: true,
//     pathRewrite: (path, req) => path.replace(/^\/api/, ''), // optional: strip /api prefix
//   });
// };

// import { createProxyMiddleware } from "http-proxy-middleware";

// export const proxy = (targetUrl: string) => {
//   if (!targetUrl) {
//     throw new Error("Proxy target URL is required");
//   }

//   return createProxyMiddleware({
//     target: targetUrl,
//     changeOrigin: true,
//     pathRewrite: (path, req) => {
//       return path.replace(/^\/[^/]+/, "");
//     },
//     logLevel: "debug",
//     onProxyReq: (proxyReq, req, res) => {
//       console.log(
//         `Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
//       );
//     },
//   });
// };

import { createProxyMiddleware } from "http-proxy-middleware";

export const proxy = (targetUrl: string) => {
  if (!targetUrl) throw new Error("Proxy target URL is required");

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const prefix = req.baseUrl; 
      return path.replace(new RegExp(`^${prefix}`), "") || "/";
    },
    logLevel: "debug",
    onProxyReq: (proxyReq, req, res) => {
      console.log(
        `Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      );
    },
  });
};
