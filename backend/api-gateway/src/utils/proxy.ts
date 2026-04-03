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
      if ((req as any).user) {
        proxyReq.setHeader("x-user-id", (req as any).user.id);
        proxyReq.setHeader("x-user-role", (req as any).user.role);
      }
      console.log(
        `Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      );
    },
  });
};
