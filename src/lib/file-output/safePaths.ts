import fs from 'fs';
import os from 'os';
import path from 'path';

/**
 * Thrown when a caller-supplied path escapes the directories this server is
 * permitted to touch. Callers convert this into an MCP error response rather
 * than letting it surface as an unhandled tool failure.
 */
export class UnsafePathError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'UnsafePathError';
  }
}

/**
 * Directory names a caller may never descend into below an allowed root.
 * Hidden (dot-prefixed) segments are rejected separately, which covers
 * `.ssh`, `.aws`, `.gnupg`, `.config`, `.kube`, `.git` and friends in one rule.
 */
const DENIED_SEGMENTS = new Set([
  'node_modules',
  'launchagents',
  'launchdaemons',
]);

/**
 * Directories that are never readable or writable, whatever the allowed roots
 * happen to be. This is the floor of the policy: it holds even when the server
 * is launched with a working directory high in the tree (a GUI MCP client or a
 * systemd unit with no WorkingDirectory gives the process a cwd of `/`), which
 * would otherwise make every containment check trivially pass.
 */
function systemDenyList(): string[] {
  if (process.platform === 'win32') {
    return [
      process.env.SystemRoot || 'C:\\Windows',
      process.env.ProgramFiles || 'C:\\Program Files',
      process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)',
      process.env.ProgramData || 'C:\\ProgramData',
    ];
  }
  return [
    '/etc',
    '/usr',
    '/bin',
    '/sbin',
    '/lib',
    '/lib64',
    '/boot',
    '/dev',
    '/proc',
    '/sys',
    '/run',
    '/root',
    // Deliberately not all of /var: the macOS temp dir lives under
    // /var/folders, and /var/lib holds legitimate CI workspaces.
    '/var/root',
    '/var/db',
    '/var/log',
    '/var/spool',
    '/System',
    '/Library',
    '/Applications',
  ];
}

const MAX_FILENAME_SEGMENT = 64;

function parseEnvList(env: string | undefined): string[] {
  return env
    ? env
        .split(',')
        .map((entry) => entry.trim())
        .filter(Boolean)
    : [];
}

/**
 * Expands the `~` and `%USERPROFILE%` shorthands that the tool descriptions
 * tell clients to use. Expansion runs before validation so that the expanded
 * result is what gets containment-checked.
 */
export function expandHomeShorthand(target: string): string {
  if (target === '~' || target.startsWith('~/') || target.startsWith('~\\')) {
    return path.join(os.homedir(), target.slice(1));
  }
  if (target.includes('%USERPROFILE%')) {
    return target.replace(
      '%USERPROFILE%',
      process.env.USERPROFILE || os.homedir(),
    );
  }
  return target;
}

function isSymbolicLink(target: string): boolean {
  try {
    return fs.lstatSync(target).isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Resolves symlinks as far down `target` as actually exists on disk, so that a
 * symlinked ancestor cannot be used to hop outside an allowed root. Segments
 * that do not exist yet are appended back verbatim — they will be created, not
 * followed.
 *
 * A component that exists but cannot be canonicalised (a dangling symlink, or
 * one that fails with EACCES/ELOOP) is refused rather than assumed to be a
 * not-yet-created directory: assuming the latter is how a symlink pointing at
 * a non-existent system path slips through the containment check.
 */
function realpathBestEffort(target: string): string {
  const resolved = path.resolve(target);
  const pending: string[] = [];
  let current = resolved;

  for (;;) {
    try {
      const real = fs.realpathSync(current);
      // Guard against a non-string result (e.g. a stubbed fs in tests): fall
      // back to pure path arithmetic rather than producing a bogus path.
      if (typeof real === 'string' && real) {
        return pending.length ? path.join(real, ...[...pending].reverse()) : real;
      }
      return resolved;
    } catch {
      if (isSymbolicLink(current)) {
        throw new UnsafePathError(
          `Refusing to follow the symlink "${current}", which cannot be resolved to a real location.`,
        );
      }
      const parent = path.dirname(current);
      if (parent === current) {
        // Walked to the filesystem root without finding anything that exists.
        return resolved;
      }
      pending.push(path.basename(current));
      current = parent;
    }
  }
}

function isInside(parent: string, child: string): boolean {
  if (parent === child) return true;
  const relative = path.relative(parent, child);
  return (
    relative !== '' &&
    !relative.startsWith('..') &&
    !path.isAbsolute(relative)
  );
}

function canonicalizeRoot(root: string): string {
  try {
    return realpathBestEffort(path.resolve(root));
  } catch {
    // An unresolvable configured root simply does not grant access.
    return path.resolve(root);
  }
}

/**
 * A root so broad that it would defeat the containment check: the filesystem
 * root itself, or the directory that holds every user's home directory.
 */
function isDegenerateRoot(root: string): boolean {
  return root === path.parse(root).root || root === path.dirname(os.homedir());
}

/**
 * The directories this server is allowed to read from and write to.
 *
 * The defaults cover the locations the tool descriptions instruct clients to
 * pass (the project/workspace root, the home directory, a temp directory).
 * Deployments whose checkout lives elsewhere — `/workspace` in a container,
 * `/srv`, a secondary volume — must name it in `MCP_FILE_OUTPUT_ROOTS`.
 */
export function getAllowedOutputRoots(): string[] {
  const roots = [process.cwd(), os.homedir(), os.tmpdir()];

  // os.tmpdir() is $TMPDIR, which on macOS is /var/folders/... rather than
  // /tmp. Allow the conventional temp dir too; it is world-writable anyway.
  if (process.platform !== 'win32') {
    roots.push('/tmp');
  }

  if (process.env.FILE_OUTPUT_DIRECTORY) {
    // FILE_OUTPUT_DIRECTORY already means "where this server may write files".
    roots.push(expandHomeShorthand(process.env.FILE_OUTPUT_DIRECTORY));
  }
  roots.push(
    ...parseEnvList(process.env.MCP_FILE_OUTPUT_ROOTS).map(expandHomeShorthand),
  );

  const denied = systemDenyList().map(canonicalizeRoot);

  return [...new Set(roots.map(canonicalizeRoot))].filter(
    (root) =>
      !isDegenerateRoot(root) &&
      !denied.some((deny) => isInside(deny, root)),
  );
}

/**
 * Containment check. The *canonical* (symlink-resolved) form of the target is
 * what gets validated, so a symlinked ancestor cannot be used to hop out of an
 * allowed root.
 */
function assertWithinAllowedRoots({
  supplied,
  resolved,
  action,
}: {
  supplied: string;
  resolved: string;
  action: 'read' | 'write';
}): void {
  const canonical = realpathBestEffort(resolved);

  // Absolute floor first: system directories are refused no matter which root
  // would otherwise match.
  const deniedRoot = systemDenyList()
    .map(canonicalizeRoot)
    .find((deny) => isInside(deny, canonical));
  if (deniedRoot) {
    throw new UnsafePathError(
      `Refusing to ${action} inside the system directory "${deniedRoot}".`,
    );
  }

  const roots = getAllowedOutputRoots();

  // Match against the most specific (longest) permitted root. If an operator
  // explicitly allows a directory that happens to sit below another root, the
  // descent is judged relative to the directory they actually named.
  const root = roots
    .filter((candidate) => isInside(candidate, canonical))
    .sort((a, b) => b.length - a.length)[0];

  if (!root) {
    throw new UnsafePathError(
      `Refusing to ${action} outside the permitted directories. ` +
        `"${supplied}" is not inside the working directory, the home directory or a temp directory. ` +
        `Set MCP_FILE_OUTPUT_ROOTS to allow additional locations.`,
    );
  }

  const blocked = path
    .relative(root, canonical)
    .split(path.sep)
    .filter(Boolean)
    .find(
      (segment) =>
        segment.startsWith('.') || DENIED_SEGMENTS.has(segment.toLowerCase()),
    );

  if (blocked) {
    throw new UnsafePathError(
      `Refusing to ${action} inside "${blocked}". ` +
        `Hidden directories, node_modules and launch-agent directories are not valid file locations.`,
    );
  }
}

function normalizeSuppliedPath(supplied: unknown, label: string): string {
  if (typeof supplied !== 'string' || !supplied.trim()) {
    throw new UnsafePathError(`${label} must be a non-empty string.`);
  }
  if (supplied.includes('\0')) {
    throw new UnsafePathError(`${label} must not contain null bytes.`);
  }
  return supplied.trim();
}

function resolveSafePath({
  supplied,
  label,
  action,
}: {
  supplied: unknown;
  label: string;
  action: 'read' | 'write';
}): string {
  const normalized = normalizeSuppliedPath(supplied, label);
  const resolved = path.resolve(expandHomeShorthand(normalized));

  assertWithinAllowedRoots({ supplied: normalized, resolved, action });
  return resolved;
}

/**
 * Validates a caller-supplied output directory and returns its resolved
 * absolute path. Throws `UnsafePathError` if it escapes the permitted roots.
 */
export function resolveSafeOutputDir(outputDir: unknown): string {
  return resolveSafePath({
    supplied: outputDir,
    label: 'outputDir',
    action: 'write',
  });
}

/**
 * Validates a caller-supplied path to a file that is about to be read. Throws
 * `UnsafePathError` if it escapes the permitted roots. Existence is not checked
 * here — the subsequent read reports that, which keeps this from becoming a
 * file-existence oracle for paths outside the permitted roots.
 */
export function resolveSafeInputFile(filePath: unknown): string {
  return resolveSafePath({
    supplied: filePath,
    label: 'csvFilePath',
    action: 'read',
  });
}

/**
 * Reduces a caller-supplied value to a single safe filename segment: path
 * separators become underscores and leading dots are stripped, so the result
 * can never traverse directories or create a hidden file.
 */
export function safeFilenameSegment(value: unknown, fallback: string): string {
  const cleaned = (typeof value === 'string' ? value : '')
    .replace(/[^A-Za-z0-9._-]/g, '_')
    .replace(/^[._]+/, '')
    .slice(0, MAX_FILENAME_SEGMENT);

  return cleaned || fallback;
}

/**
 * Joins `filename` onto `dir`, asserting the result is a direct child of
 * `dir`. This is the last line of defence: even if a filename component slips
 * through sanitisation, the write cannot be aimed at another directory.
 */
export function joinWithinDir(dir: string, filename: string): string {
  const resolvedDir = path.resolve(dir);
  const target = path.resolve(resolvedDir, filename);

  if (!isInside(resolvedDir, target) || path.dirname(target) !== resolvedDir) {
    throw new UnsafePathError(
      `Refusing to write "${filename}" outside "${resolvedDir}".`,
    );
  }

  return target;
}

/**
 * Write flags that refuse to follow a symlink at the final path component.
 * Validating the directory cannot cover this: the output filenames are derived
 * from caller input and the temp directory is world-writable, so another local
 * process can pre-plant a symlink at the exact name we are about to write and
 * redirect the write to an arbitrary file. `O_NOFOLLOW` makes the open fail
 * with ELOOP instead. `O_NOFOLLOW` does not exist on Windows.
 */
const NOFOLLOW_WRITE_FLAG =
  fs.constants.O_WRONLY |
  fs.constants.O_CREAT |
  fs.constants.O_TRUNC |
  (fs.constants.O_NOFOLLOW ?? 0);

/**
 * Writes a file inside an already-validated directory, refusing to follow a
 * symlink at the destination.
 */
export function safeWriteFileSync(
  filePath: string,
  data: string | Buffer,
): void {
  try {
    fs.writeFileSync(filePath, data, {
      // Node's internal stringToFlags() passes a numeric flag straight through
      // to open(2); @types/node only declares the string form, hence the cast.
      flag: NOFOLLOW_WRITE_FLAG as unknown as string,
    });
  } catch (error: any) {
    if (error?.code === 'ELOOP') {
      throw new UnsafePathError(
        `Refusing to write through the symlink at "${filePath}".`,
      );
    }
    throw error;
  }
}
