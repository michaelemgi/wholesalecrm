import { NextRequest } from "next/server";
import { checkRateLimit, rateLimitResponse, logRequest } from "@/lib/api-utils";

export function withRateLimit(handler: (req: NextRequest, ctx?: any) => Promise<Response>, maxRequests = 60) {
  return async (req: NextRequest, ctx?: any) => {
    const ip = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "anonymous";
    if (!checkRateLimit(ip, maxRequests)) {
      return rateLimitResponse();
    }
    logRequest(req);
    return handler(req, ctx);
  };
}
