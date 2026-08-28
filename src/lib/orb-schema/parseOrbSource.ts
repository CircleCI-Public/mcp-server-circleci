import { parse as parseYaml } from 'yaml';

export type OrbParameter = {
  name: string;
  type: string;
  default?: unknown;
  description?: string;
  required: boolean;
};

export type OrbDefinition = {
  name: string;
  description?: string;
  parameters: OrbParameter[];
};

export type OrbExample = {
  name: string;
  description?: string;
};

export type OrbSchema = {
  description?: string;
  commands: OrbDefinition[];
  jobs: OrbDefinition[];
  executors: OrbDefinition[];
  examples: OrbExample[];
};

export class OrbSourceParseError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'OrbSourceParseError';
  }
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function extractParameters(node: unknown): OrbParameter[] {
  if (!isPlainObject(node)) return [];
  return Object.entries(node).flatMap(([name, raw]) => {
    if (!isPlainObject(raw)) return [];
    const type =
      typeof raw.type === 'string' || typeof raw.type === 'number'
        ? String(raw.type)
        : 'unknown';
    const description =
      typeof raw.description === 'string' ? raw.description : undefined;
    const hasDefault = 'default' in raw;
    const param: OrbParameter = {
      name,
      type,
      description,
      required: !hasDefault,
    };
    if (hasDefault) param.default = raw.default;
    return [param];
  });
}

function extractDefinitions(node: unknown): OrbDefinition[] {
  if (!isPlainObject(node)) return [];
  return Object.entries(node).flatMap(([name, raw]) => {
    if (!isPlainObject(raw)) return [];
    const description =
      typeof raw.description === 'string' ? raw.description : undefined;
    return [
      {
        name,
        description,
        parameters: extractParameters(raw.parameters),
      },
    ];
  });
}

function extractExamples(node: unknown): OrbExample[] {
  if (!isPlainObject(node)) return [];
  return Object.entries(node).flatMap(([name, raw]) => {
    if (!isPlainObject(raw)) return [];
    const description =
      typeof raw.description === 'string' ? raw.description : undefined;
    return [{ name, description }];
  });
}

export function parseOrbSource(yamlText: string): OrbSchema {
  let doc: unknown;
  try {
    doc = parseYaml(yamlText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    throw new OrbSourceParseError(`Malformed orb YAML: ${msg}`);
  }

  if (!isPlainObject(doc)) {
    throw new OrbSourceParseError(
      'Orb source is not a valid YAML object at the top level',
    );
  }

  return {
    description: typeof doc.description === 'string' ? doc.description : undefined,
    commands: extractDefinitions(doc.commands),
    jobs: extractDefinitions(doc.jobs),
    executors: extractDefinitions(doc.executors),
    examples: extractExamples(doc.examples),
  };
}
