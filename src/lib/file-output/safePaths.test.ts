import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import fs from 'fs';
import os from 'os';
import path from 'path';

import {
  UnsafePathError,
  expandHomeShorthand,
  getAllowedOutputRoots,
  joinWithinDir,
  resolveSafeInputFile,
  resolveSafeOutputDir,
  safeFilenameSegment,
  safeWriteFileSync,
} from './safePaths.js';

describe('expandHomeShorthand', () => {
  it('expands a bare ~ and ~/ prefix to the home directory', () => {
    expect(expandHomeShorthand('~')).toBe(os.homedir());
    expect(expandHomeShorthand('~/Downloads')).toBe(
      path.join(os.homedir(), 'Downloads'),
    );
  });

  it('expands %USERPROFILE%', () => {
    expect(expandHomeShorthand('%USERPROFILE%\\Downloads')).toContain(
      process.env.USERPROFILE || os.homedir(),
    );
  });

  it('does not treat ~foo as a home reference', () => {
    expect(expandHomeShorthand('~foo')).toBe('~foo');
  });

  it('leaves ordinary paths untouched', () => {
    expect(expandHomeShorthand('/tmp/logs')).toBe('/tmp/logs');
  });
});

describe('getAllowedOutputRoots', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.MCP_FILE_OUTPUT_ROOTS;
    delete process.env.FILE_OUTPUT_DIRECTORY;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('does not include system directories by default', () => {
    const roots = getAllowedOutputRoots();
    expect(roots).not.toContain('/etc');
    expect(roots).not.toContain('/usr');
  });

  it('honours additional roots from MCP_FILE_OUTPUT_ROOTS', () => {
    const extra = path.join(os.tmpdir(), 'mcp-extra-root');
    process.env.MCP_FILE_OUTPUT_ROOTS = extra;
    expect(resolveSafeOutputDir(path.join(extra, 'nested'))).toBe(
      path.join(extra, 'nested'),
    );
  });

  it('honours FILE_OUTPUT_DIRECTORY as a root', () => {
    process.env.FILE_OUTPUT_DIRECTORY = path.join(os.tmpdir(), 'mcp-file-out');
    expect(() =>
      resolveSafeOutputDir(path.join(os.tmpdir(), 'mcp-file-out', 'sub')),
    ).not.toThrow();
  });

  it('judges the descent against the most specific configured root', () => {
    // A hidden directory is normally rejected, but an operator who names it
    // explicitly gets to use it — the check runs relative to that root.
    const hidden = path.join(os.tmpdir(), '.mcp-explicit-root');

    expect(() => resolveSafeOutputDir(path.join(hidden, 'out'))).toThrow(
      UnsafePathError,
    );

    process.env.MCP_FILE_OUTPUT_ROOTS = hidden;
    expect(() => resolveSafeOutputDir(path.join(hidden, 'out'))).not.toThrow();
  });
});

describe('resolveSafeOutputDir', () => {
  it('accepts a directory inside the temp dir', () => {
    const target = path.join(os.tmpdir(), 'circleci-mcp-test');
    expect(resolveSafeOutputDir(target)).toBe(path.resolve(target));
  });

  it('accepts the current working directory', () => {
    expect(resolveSafeOutputDir(process.cwd())).toBe(process.cwd());
  });

  it('returns the path the caller asked for, not the symlink-resolved form', () => {
    // /tmp is a symlink to /private/tmp on macOS; callers should still get /tmp.
    const target = path.join('/tmp', 'circleci-mcp-test');
    if (process.platform === 'win32') return;
    expect(resolveSafeOutputDir(target)).toBe(target);
  });

  // The disclosed vulnerability: outputDir was passed straight to
  // mkdirSync/writeFileSync with no containment at all.
  it.each([
    ['an absolute system path', '/etc'],
    ['a traversal escape', '/tmp/../etc'],
    ['deep relative traversal', '../../../../../../../../etc'],
    ['a system library path', '/Library/LaunchDaemons'],
  ])('rejects %s', (_label, outputDir) => {
    expect(() => resolveSafeOutputDir(outputDir)).toThrow(UnsafePathError);
  });

  it.each([
    ['ssh keys', '.ssh'],
    ['aws credentials', '.aws'],
    ['gpg keys', '.gnupg'],
    ['user config', '.config'],
  ])('rejects the hidden %s directory under home', (_label, dir) => {
    expect(() => resolveSafeOutputDir(path.join(os.homedir(), dir))).toThrow(
      UnsafePathError,
    );
  });

  it('rejects macOS launch-agent directories under home', () => {
    expect(() =>
      resolveSafeOutputDir(path.join(os.homedir(), 'Library', 'LaunchAgents')),
    ).toThrow(UnsafePathError);
  });

  it('rejects node_modules', () => {
    expect(() =>
      resolveSafeOutputDir(path.join(os.tmpdir(), 'node_modules', 'evil')),
    ).toThrow(UnsafePathError);
  });

  it('rejects a hidden directory reached via ~ expansion', () => {
    expect(() => resolveSafeOutputDir('~/.ssh')).toThrow(UnsafePathError);
  });

  it.each([
    ['an empty string', ''],
    ['whitespace only', '   '],
    ['a null byte', '/tmp/evil\0/etc'],
    ['a non-string', 42],
  ])('rejects %s', (_label, outputDir) => {
    expect(() => resolveSafeOutputDir(outputDir as never)).toThrow(
      UnsafePathError,
    );
  });

  it('reports a system directory as such', () => {
    expect(() => resolveSafeOutputDir('/etc')).toThrow(
      /Refusing to write inside the system directory/,
    );
  });

  it('points at MCP_FILE_OUTPUT_ROOTS for a path that is merely outside the roots', () => {
    expect(() => resolveSafeOutputDir('/opt/not-a-configured-root')).toThrow(
      /Refusing to write outside the permitted directories.*MCP_FILE_OUTPUT_ROOTS/s,
    );
  });

  it('does not echo the permitted roots back to the caller', () => {
    // The roots reveal the OS username, checkout location and temp layout.
    try {
      resolveSafeOutputDir('/opt/not-a-configured-root');
      throw new Error('expected a rejection');
    } catch (error) {
      expect((error as Error).message).not.toContain(os.homedir());
    }
  });

  describe('symlink escapes', () => {
    let sandbox: string;

    beforeEach(() => {
      sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-symlink-'));
    });

    afterEach(() => {
      fs.rmSync(sandbox, { recursive: true, force: true });
    });

    it('rejects a symlink that points outside the permitted roots', () => {
      const link = path.join(sandbox, 'escape');
      fs.symlinkSync('/etc', link, 'dir');
      expect(() => resolveSafeOutputDir(link)).toThrow(UnsafePathError);
    });

    it('rejects a path that traverses through an escaping symlink', () => {
      const link = path.join(sandbox, 'escape');
      fs.symlinkSync('/', link, 'dir');
      expect(() => resolveSafeOutputDir(path.join(link, 'etc'))).toThrow(
        UnsafePathError,
      );
    });

    it('still allows a symlink that stays inside the permitted roots', () => {
      const real = path.join(sandbox, 'real');
      const link = path.join(sandbox, 'link');
      fs.mkdirSync(real);
      fs.symlinkSync(real, link, 'dir');
      expect(() => resolveSafeOutputDir(link)).not.toThrow();
    });

    // A dangling symlink cannot be canonicalised, which must not be mistaken
    // for "this directory does not exist yet" — that let an escape through.
    it('rejects a dangling symlink that points outside the permitted roots', () => {
      const link = path.join(sandbox, 'dangling');
      fs.symlinkSync('/etc/does-not-exist', link, 'dir');
      expect(() => resolveSafeOutputDir(link)).toThrow(UnsafePathError);
    });

    it('rejects a path underneath a dangling symlink', () => {
      const link = path.join(sandbox, 'dangling');
      fs.symlinkSync('/etc/does-not-exist', link, 'dir');
      expect(() => resolveSafeOutputDir(path.join(link, 'sub'))).toThrow(
        UnsafePathError,
      );
    });
  });

  // A shallow working directory (a GUI MCP client or a systemd unit with no
  // WorkingDirectory gives the process cwd '/') must not widen the allow-list.
  describe('degenerate working directory', () => {
    const originalCwd = process.cwd();

    afterEach(() => {
      process.chdir(originalCwd);
    });

    it('does not treat the filesystem root as a permitted root', () => {
      process.chdir('/');
      expect(getAllowedOutputRoots()).not.toContain('/');
    });

    it.each([
      ['/etc/cron.d'],
      ['/usr/local/bin'],
      ['/var/root'],
      ['/Library/LaunchDaemons'],
    ])('still refuses %s when cwd is /', (target) => {
      process.chdir('/');
      expect(() => resolveSafeOutputDir(target)).toThrow(UnsafePathError);
    });

    it('still refuses to read /etc/passwd when cwd is /', () => {
      process.chdir('/');
      expect(() => resolveSafeInputFile('/etc/passwd')).toThrow(UnsafePathError);
    });

    it('does not treat the directory holding all home directories as a root', () => {
      process.chdir(path.dirname(os.homedir()));
      expect(getAllowedOutputRoots()).not.toContain(
        path.dirname(os.homedir()),
      );
    });
  });

  // MCP_FILE_OUTPUT_ROOTS must not be usable to re-open a system directory.
  describe('system directories are an absolute floor', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    it.each([['/etc'], ['/usr/local'], ['/Library']])(
      'ignores %s configured as an explicit root',
      (root) => {
        process.env.MCP_FILE_OUTPUT_ROOTS = root;
        expect(() => resolveSafeOutputDir(path.join(root, 'sub'))).toThrow(
          UnsafePathError,
        );
      },
    );

    it('ignores a filesystem root configured as an explicit root', () => {
      process.env.MCP_FILE_OUTPUT_ROOTS = '/';
      expect(() => resolveSafeOutputDir('/etc/cron.d')).toThrow(UnsafePathError);
    });
  });
});

describe('safeWriteFileSync', () => {
  let sandbox: string;

  beforeEach(() => {
    sandbox = fs.mkdtempSync(path.join(os.tmpdir(), 'mcp-write-'));
  });

  afterEach(() => {
    fs.rmSync(sandbox, { recursive: true, force: true });
  });

  it('writes a new file', () => {
    const target = path.join(sandbox, 'out.txt');
    safeWriteFileSync(target, 'hello');

    expect(fs.readFileSync(target, 'utf8')).toBe('hello');
  });

  it('overwrites an existing regular file', () => {
    const target = path.join(sandbox, 'out.txt');
    fs.writeFileSync(target, 'first');
    safeWriteFileSync(target, 'second');

    expect(fs.readFileSync(target, 'utf8')).toBe('second');
  });

  // The output filenames are derived from caller input and land in a
  // world-writable temp dir, so another local process can pre-plant a symlink
  // at the exact destination name. Validating only the directory misses this.
  it('refuses to write through a symlink planted at the destination', () => {
    const victim = path.join(sandbox, 'victim.txt');
    const target = path.join(sandbox, 'usage-data-job-attacker.csv');
    fs.writeFileSync(victim, 'original');
    fs.symlinkSync(victim, target);

    expect(() => safeWriteFileSync(target, 'PWNED')).toThrow(UnsafePathError);
    expect(fs.readFileSync(victim, 'utf8')).toBe('original');
  });

  it('refuses to write through a symlink pointing outside the sandbox', () => {
    const victim = path.join(os.homedir(), '.mcp-symlink-probe');
    const target = path.join(sandbox, 'circleci-build-logs-1.txt');
    fs.symlinkSync(victim, target);

    expect(() => safeWriteFileSync(target, 'PWNED')).toThrow(UnsafePathError);
    expect(fs.existsSync(victim)).toBe(false);
  });
});

describe('resolveSafeInputFile', () => {
  // Previously readAndParseCSV did readFileSync(path.resolve(csvFilePath)),
  // which allowed reading any file the process could open.
  it.each([
    ['the password file', '/etc/passwd'],
    ['an ssh private key', '~/.ssh/id_rsa'],
    ['shell history via traversal', '/tmp/../etc/shadow'],
  ])('refuses to read %s', (_label, filePath) => {
    expect(() => resolveSafeInputFile(filePath)).toThrow(UnsafePathError);
  });

  it('allows a file inside a permitted root', () => {
    const target = path.join(os.tmpdir(), 'usage.csv');
    expect(resolveSafeInputFile(target)).toBe(path.resolve(target));
  });

  it('allows a relative path resolved against the working directory', () => {
    expect(resolveSafeInputFile('usage.csv')).toBe(
      path.join(process.cwd(), 'usage.csv'),
    );
  });
});

describe('safeFilenameSegment', () => {
  it.each([
    ['/../../../../tmp/pwned', 'tmp_pwned'],
    ['x/../../../etc/cron.d/evil', 'x_.._.._.._etc_cron.d_evil'],
    ['..', 'fallback'],
    ['../..', 'fallback'],
    ['/', 'fallback'],
    ['.hidden', 'hidden'],
    ['', 'fallback'],
  ])('reduces %j to a single safe segment', (input, expected) => {
    const result = safeFilenameSegment(input, 'fallback');
    expect(result).toBe(expected);
    expect(result).not.toContain('/');
    expect(result).not.toContain('\\');
    expect(result.startsWith('.')).toBe(false);
  });

  it('preserves ordinary identifiers', () => {
    expect(safeFilenameSegment('2024-08-01', 'fallback')).toBe('2024-08-01');
    expect(safeFilenameSegment('abc-123-def', 'fallback')).toBe('abc-123-def');
  });

  it('caps the segment length', () => {
    expect(safeFilenameSegment('a'.repeat(500), 'fallback')).toHaveLength(64);
  });

  it('falls back for non-string input', () => {
    expect(safeFilenameSegment(undefined, 'fallback')).toBe('fallback');
    expect(safeFilenameSegment(null, 'fallback')).toBe('fallback');
  });
});

describe('joinWithinDir', () => {
  it('joins a plain filename', () => {
    expect(joinWithinDir('/tmp/out', 'logs.txt')).toBe('/tmp/out/logs.txt');
  });

  it.each([
    ['traversal', '../escape.txt'],
    ['deep traversal', '../../../../etc/evil.csv'],
    ['an absolute path', '/etc/evil.csv'],
    ['a nested subdirectory', 'sub/dir/evil.csv'],
  ])('rejects %s', (_label, filename) => {
    expect(() => joinWithinDir('/tmp/out', filename)).toThrow(UnsafePathError);
  });
});
