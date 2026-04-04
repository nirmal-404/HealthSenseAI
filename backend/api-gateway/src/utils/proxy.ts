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
    onProxyReq: (proxyReq, req: any, res) => {
      if (req.user) {
        proxyReq.setHeader("x-user-id", req.user.id);
        proxyReq.setHeader("x-user-role", req.user.role);
      }

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
      console.log(
        `Proxying ${req.method} ${req.originalUrl} -> ${proxyReq.protocol}//${proxyReq.host}${proxyReq.path}`,
      );
    },
  });
};
