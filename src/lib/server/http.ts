/**
 * Tiny Express-compat shim so existing API handlers can run on TanStack Start
 * server routes without rewriting every res.json call.
 */

export type ExpressLikeReq = {
  query: Record<string, string>;
  method: string;
  headers: Record<string, string>;
  url: string;
};

export type ExpressLikeRes = {
  headersSent: boolean;
  statusCode: number;
  body: unknown;
  status(code: number): ExpressLikeRes;
  json(data: unknown): ExpressLikeRes;
  send(data: unknown): ExpressLikeRes;
};

export function createExpressShim(): ExpressLikeRes {
  const res: ExpressLikeRes = {
    headersSent: false,
    statusCode: 200,
    body: null,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(data: unknown) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
    send(data: unknown) {
      this.body = data;
      this.headersSent = true;
      return this;
    },
  };
  return res;
}

const hits = new Map<string, number[]>();

export function rateLimitOk(key: string, max = 30, windowMs = 60_000): boolean {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  if (arr.length >= max) {
    hits.set(key, arr);
    return false;
  }
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) {
    const first = hits.keys().next().value;
    if (first) hits.delete(first);
  }
  return true;
}

function clientKey(request: Request): string {
  const xf = request.headers.get("x-forwarded-for");
  if (xf) return xf.split(",")[0]!.trim();
  return request.headers.get("x-real-ip") || "local";
}

export async function runApiHandler(
  handler: (req: ExpressLikeReq, res: ExpressLikeRes) => Promise<unknown>,
  request: Request,
  opts: { maxPerMinute?: number } = {}
): Promise<Response> {
  if (!rateLimitOk(clientKey(request), opts.maxPerMinute ?? 120)) {
    return Response.json({ error: "Too many requests" }, { status: 429 });
  }
  const url = new URL(request.url);
  const query: Record<string, string> = {};
  url.searchParams.forEach((v, k) => {
    query[k] = v;
  });
  const headers: Record<string, string> = {};
  request.headers.forEach((v, k) => {
    headers[k] = v;
  });
  const req: ExpressLikeReq = {
    query,
    method: request.method,
    headers,
    url: url.pathname + url.search,
  };
  const res = createExpressShim();
  try {
    await handler(req, res);
    const status = res.statusCode || 200;
    const body = res.body ?? {};
    return Response.json(body, { status });
  } catch (err) {
    console.error("[api]", err);
    return Response.json({ error: "Internal server error" }, { status: 500 });
  }
}
