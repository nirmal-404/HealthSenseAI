import { createProxyMiddleware } from "http-proxy-middleware";
import type { Request } from "express";

const forwardUserHeaders = (proxyReq: any, req: Request) => {
  const u = req as any;
  if (u.user) {
    proxyReq.setHeader("x-user-id", u.user.id);
    proxyReq.setHeader("x-user-role", u.user.role);
  }
};

const forwardBody = (proxyReq: any, req: any) => {
  if (
    req.body &&
    Object.keys(req.body).length > 0 &&
    req.method !== "GET"
  ) {
    const bodyData = JSON.stringify(req.body);
    proxyReq.setHeader("Content-Type", "application/json");
    proxyReq.setHeader("Content-Length", Buffer.byteLength(bodyData));
    proxyReq.write(bodyData);
  }
};

export const proxy = (targetUrl: string) => {
  if (!targetUrl) throw new Error("Proxy target URL is required");

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => {
      const prefix = (req as any).baseUrl;
      return path.replace(new RegExp(`^${prefix}`), "") || "/";
    },
    logLevel: "debug",
    onProxyReq: (proxyReq, req: any) => {
      forwardUserHeaders(proxyReq, req);
      forwardBody(proxyReq, req);
      console.log(
        `Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      );
    },
  });
};

/**
 * Proxies to a microservice with an explicit path rewrite (Express sub-path mount).
 */
export const proxyWithPathRewrite = (
  targetUrl: string,
  pathRewrite: (path: string, req: Request) => string,
) => {
  if (!targetUrl) throw new Error("Proxy target URL is required");

  return createProxyMiddleware({
    target: targetUrl,
    changeOrigin: true,
    pathRewrite: (path, req) => pathRewrite(path, req as Request),
    logLevel: "debug",
    onProxyReq: (proxyReq, req: any) => {
      forwardUserHeaders(proxyReq, req);
      forwardBody(proxyReq, req);
      console.log(
        `Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      );
    },
  });
};
