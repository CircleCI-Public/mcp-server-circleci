import type { Request } from 'express';

function parseEnvList(env: string | undefined): string[] {
  return env ? env.split(',').map(s => s.trim().toLowerCase()).filter(Boolean) : [];
}

export function getAllowedHosts(port: string | number): Set<string> {
  const loopback = ['localhost', '127.0.0.1', '[::1]', '::1'];
  const result = new Set(loopback.flatMap(h => [h, `${h}:${port}`]));
  for (const h of parseEnvList(process.env.MCP_ALLOWED_HOSTS)) result.add(h);
  return result;
}

export function getAllowedOrigins(port: string | number): Set<string> {
  const result = new Set(
    ['http', 'https'].flatMap(s =>
      ['localhost', '127.0.0.1'].flatMap(h => [`${s}://${h}`, `${s}://${h}:${port}`]),
    ),
  );
  for (const o of parseEnvList(process.env.MCP_ALLOWED_ORIGINS)) result.add(o);
  return result;
}

export function isHostAllowed(host: string | undefined, allowed: Set<string>): boolean {
  return !!host?.trim() && allowed.has(host.trim().toLowerCase());
}

export function isOriginAllowed(origin: string | undefined, allowed: Set<string>): boolean {
  // Non-browser clients (mcp-remote, curl) send no Origin — allow them.
  if (!origin?.trim()) return true;
  return allowed.has(origin.trim().toLowerCase());
}

export function validateRemoteRequest(req: Request, port: string | number): boolean {
  return (
    isHostAllowed(req.header('host'), getAllowedHosts(port)) &&
    isOriginAllowed(req.header('origin'), getAllowedOrigins(port))
  );
}
