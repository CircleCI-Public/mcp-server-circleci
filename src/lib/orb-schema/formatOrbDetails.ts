// Output is wrapped with `outputTextTruncated`, which keeps the TAIL on
// overflow. Sections are written least-to-most-critical so that, if the
// response is truncated, the commands list and version pin (what the agent
// most needs) survive at the end.
import type {
  OrbDefinition,
  OrbExample,
  OrbParameter,
  OrbSchema,
} from './parseOrbSource.js';

const ORDER_NOTE = '';

function formatParameter(param: OrbParameter): string {
  const required = param.required ? 'required' : 'optional';
  const defaultPart = param.required
    ? ''
    : `, default: ${JSON.stringify(param.default ?? null)}`;
  const desc = param.description
    ? `\n    ${param.description.replace(/\n+/g, ' ').trim()}`
    : '';
  return `  - \`${param.name}\` (${param.type}, ${required}${defaultPart})${desc}`;
}

function formatDefinition(def: OrbDefinition): string {
  const lines: string[] = [`- \`${def.name}\``];
  if (def.description) {
    lines.push(`  ${def.description.replace(/\n+/g, ' ').trim()}`);
  }
  if (def.parameters.length > 0) {
    lines.push('  Parameters:');
    for (const p of def.parameters) lines.push(formatParameter(p));
  } else {
    lines.push('  (no parameters)');
  }
  return lines.join('\n');
}

function formatExample(ex: OrbExample): string {
  return ex.description
    ? `- \`${ex.name}\` — ${ex.description.replace(/\n+/g, ' ').trim()}`
    : `- \`${ex.name}\``;
}

function section(title: string, body: string): string {
  return `## ${title}\n\n${body}\n`;
}

export function formatOrbDetails({
  orbName,
  version,
  schema,
}: {
  orbName: string;
  version: string;
  schema: OrbSchema;
}): string {
  const parts: string[] = [];

  // Least critical first — survives tail-truncation least.
  if (schema.description) {
    parts.push(section('Orb Description', schema.description.trim()));
  }

  if (schema.examples.length > 0) {
    parts.push(section('Examples', schema.examples.map(formatExample).join('\n')));
  }

  if (schema.executors.length > 0) {
    parts.push(
      section('Executors', schema.executors.map(formatDefinition).join('\n\n')),
    );
  }

  if (schema.jobs.length > 0) {
    parts.push(section('Jobs', schema.jobs.map(formatDefinition).join('\n\n')));
  }

  if (schema.commands.length > 0) {
    parts.push(
      section('Commands', schema.commands.map(formatDefinition).join('\n\n')),
    );
  }

  // Most critical last — survives tail-truncation.
  parts.push(`## Use in config\n\nPin this version: \`${orbName}@${version}\``);

  return ORDER_NOTE + parts.join('\n');
}
