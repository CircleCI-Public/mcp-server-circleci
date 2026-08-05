/**
 * Startup guard for the remote HTTP transport.
 *
 * The `Host`/`Origin` checks in `originValidation.ts` are a DNS-rebinding
 * mitigation: they stop a *browser* on a victim's machine from being pointed at
 * a loopback-bound server by attacker-controlled DNS. They are deliberately not
 * authentication — `Host` is chosen by the caller, and a non-browser peer (raw
 * socket, curl, `mcp-remote`) can send any value it likes. Authentication is
 * `REQUIRE_REQUEST_TOKEN`, which makes every request carry its own CircleCI PAT.
 *
 * That leaves one combination that is unsafe no matter what the rebinding guard
 * does: request auth disabled (`REQUIRE_REQUEST_TOKEN=false`, the shared-token
 * mode) *and* a listener on a non-loopback interface. Any peer that can route to
 * the port then acts with the server's `CIRCLECI_TOKEN` — an org PAT — without
 * presenting a credential. We refuse to start in that configuration unless the
 * operator explicitly acknowledges it.
 */

const ACK_ENV_VAR = 'MCP_ALLOW_UNAUTHENTICATED_NETWORK_ACCESS';

/**
 * Whether a bind address reaches loopback only. Anything else — including the
 * `0.0.0.0` / `::` wildcards and any specific routable address — is treated as
 * network-exposed.
 */
export function isLoopbackBindHost(bindHost: string | undefined): boolean {
  const host = bindHost?.trim().toLowerCase().replace(/^\[/, '').replace(/\]$/, '');
  if (!host) return false; // empty/unset means "all interfaces"
  if (host === 'localhost' || host === '::1') return true;
  // The whole of 127.0.0.0/8 is loopback, as are its IPv4-mapped IPv6 forms.
  return /^(?:::ffff:)?127\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(host);
}

/** Operator opt-in to serving a network interface with request auth disabled. */
export function isUnauthenticatedNetworkAccessAcknowledged(): boolean {
  return process.env[ACK_ENV_VAR] === 'true';
}

export type ExposureVerdict =
  | { safe: true; warning?: string }
  | { safe: false; reason: string };

/**
 * Decide whether a remote listener may start. Pure — every input is explicit so
 * the policy can be tested without touching the environment or opening a port.
 */
export function evaluateRemoteExposure({
  bindHost,
  tokenRequired,
  acknowledged,
}: {
  bindHost: string | undefined;
  tokenRequired: boolean;
  acknowledged: boolean;
}): ExposureVerdict {
  // Every request carries its own PAT, so a network-facing bind is fine.
  if (tokenRequired) return { safe: true };

  const loopbackOnly = isLoopbackBindHost(bindHost);

  if (loopbackOnly) {
    return {
      safe: true,
      warning:
        'Request authentication is disabled (REQUIRE_REQUEST_TOKEN=false). ' +
        `Listening on loopback (${bindHost}), so only processes on this host can ` +
        "reach /mcp — but any of them can act with the server's CIRCLECI_TOKEN " +
        'without presenting a credential.',
    };
  }

  if (!acknowledged) {
    return {
      safe: false,
      reason:
        'Refusing to start: request authentication is disabled ' +
        `(REQUIRE_REQUEST_TOKEN=false) while binding ${bindHost}, which is ` +
        'reachable from the network. Any host that can route to this port could ' +
        "then run CircleCI pipelines with the server's CIRCLECI_TOKEN without " +
        'presenting a credential. The Host/Origin check does not prevent this — ' +
        'it only mitigates DNS rebinding by browsers, and a non-browser client ' +
        'can send any Host it likes.\n' +
        'Choose one:\n' +
        '  1. Require per-request tokens (recommended): REQUIRE_REQUEST_TOKEN=true\n' +
        '  2. Restrict to loopback: MCP_BIND_HOST=127.0.0.1 ' +
        '(note: incompatible with Docker -p port mapping)\n' +
        `  3. If this port really is only reachable from a trusted network, set ${ACK_ENV_VAR}=true ` +
        'to accept the risk.',
    };
  }

  return {
    safe: true,
    warning:
      'Request authentication is disabled (REQUIRE_REQUEST_TOKEN=false) and ' +
      `${ACK_ENV_VAR}=true, so /mcp is served on ${bindHost} with no ` +
      "credential required. Every peer that can reach this port acts as the " +
      "server's CIRCLECI_TOKEN identity, including running arbitrary pipeline " +
      'config. Ensure this port is not reachable from untrusted networks.',
  };
}

/**
 * Apply the verdict: throw to abort startup, or emit the warning. Startup
 * errors from the transport propagate to the top-level handler in index.ts,
 * which logs and exits non-zero.
 */
export function assertSafeRemoteExposure(bindHost: string, tokenRequired: boolean): void {
  const verdict = evaluateRemoteExposure({
    bindHost,
    tokenRequired,
    acknowledged: isUnauthenticatedNetworkAccessAcknowledged(),
  });

  if (!verdict.safe) {
    throw new Error(verdict.reason);
  }
  if (verdict.warning) {
    console.error(`WARNING: ${verdict.warning}`);
  }
}
