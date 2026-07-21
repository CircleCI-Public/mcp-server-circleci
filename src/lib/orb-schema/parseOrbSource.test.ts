import { describe, it, expect } from 'vitest';
import { parseOrbSource, OrbSourceParseError } from './parseOrbSource.js';

const SAMPLE_ORB = `version: 2.1
description: A sample orb for testing.
commands:
  notify:
    description: Send a notification.
    parameters:
      channel:
        type: string
        default: "#general"
        description: The channel to post to.
      message:
        type: string
        description: The message body.
      mentions:
        type: string
        default: ""
jobs:
  send:
    parameters:
      event:
        type: enum
        enum: ["pass", "fail"]
        default: "pass"
    steps:
      - notify:
          channel: $CHANNEL
executors:
  default:
    docker:
      - image: cimg/base:stable
examples:
  basic_usage:
    description: A minimal example.
    usage:
      version: 2.1
`;

describe('parseOrbSource', () => {
  it('extracts commands, jobs, executors, and examples', () => {
    const schema = parseOrbSource(SAMPLE_ORB);

    expect(schema.description).toBe('A sample orb for testing.');
    expect(schema.commands).toHaveLength(1);
    expect(schema.jobs).toHaveLength(1);
    expect(schema.executors).toHaveLength(1);
    expect(schema.examples).toHaveLength(1);
  });

  it('flags parameters without a default as required', () => {
    const schema = parseOrbSource(SAMPLE_ORB);
    const notify = schema.commands.find((c) => c.name === 'notify');
    expect(notify).toBeDefined();
    const channel = notify!.parameters.find((p) => p.name === 'channel');
    const message = notify!.parameters.find((p) => p.name === 'message');
    expect(channel?.required).toBe(false);
    expect(channel?.default).toBe('#general');
    expect(message?.required).toBe(true);
    expect(message?.default).toBeUndefined();
  });

  it('treats empty string default as a real default (still optional)', () => {
    const schema = parseOrbSource(SAMPLE_ORB);
    const mentions = schema.commands[0].parameters.find(
      (p) => p.name === 'mentions',
    );
    expect(mentions?.required).toBe(false);
    expect(mentions?.default).toBe('');
  });

  it('handles missing sections without throwing', () => {
    const schema = parseOrbSource('version: 2.1\n');
    expect(schema.commands).toEqual([]);
    expect(schema.jobs).toEqual([]);
    expect(schema.executors).toEqual([]);
    expect(schema.examples).toEqual([]);
  });

  it('skips non-object entries in command sections instead of throwing', () => {
    const weird = `version: 2.1
commands:
  good:
    parameters:
      x:
        type: string
  bad: "this is a string not an object"
  alsoBad: 42
`;
    const schema = parseOrbSource(weird);
    expect(schema.commands.map((c) => c.name)).toEqual(['good']);
  });

  it('throws OrbSourceParseError on malformed YAML', () => {
    const malformed = 'version: 2.1\ncommands:\n  notify:\n    - parameters: [unclosed';
    expect(() => parseOrbSource(malformed)).toThrow(OrbSourceParseError);
  });

  it('throws OrbSourceParseError when top-level is not an object', () => {
    expect(() => parseOrbSource('just a string')).toThrow(OrbSourceParseError);
    expect(() => parseOrbSource('')).toThrow(OrbSourceParseError);
  });

  it('coerces non-standard parameter type values to string', () => {
    const yamlText = `version: 2.1
commands:
  weird:
    parameters:
      missingType:
        default: foo
      numericType:
        type: 42
        default: foo
`;
    const schema = parseOrbSource(yamlText);
    const params = schema.commands[0].parameters;
    expect(params.find((p) => p.name === 'missingType')?.type).toBe('unknown');
    expect(params.find((p) => p.name === 'numericType')?.type).toBe('42');
  });
});
