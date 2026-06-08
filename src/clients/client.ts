import { requireCircleCIToken } from '../lib/auth/resolveToken.js';
import { CircleCIPrivateClients } from './circleci-private/index.js';
import { CircleCIClients } from './circleci/index.js';

export function getCircleCIClient() {
  return new CircleCIClients({
    token: requireCircleCIToken(),
  });
}

export function getCircleCIPrivateClient() {
  return new CircleCIPrivateClients({
    token: requireCircleCIToken(),
  });
}
