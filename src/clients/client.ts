import { CircleCIPrivateClients } from './circleci-private/index.js';
import { CircleCIClients } from './circleci/index.js';

export function getCircleCIClient() {
  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set');
  }

  return new CircleCIClients({
    token: process.env.CIRCLECI_TOKEN,
  });
}

export function getCircleCIPrivateClient() {
  if (!process.env.CIRCLECI_TOKEN) {
    throw new Error('CIRCLECI_TOKEN is not set');
  }

  return new CircleCIPrivateClients({
    token: process.env.CIRCLECI_TOKEN,
  });
}
