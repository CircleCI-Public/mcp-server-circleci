import { v5 as uuidv5 } from 'uuid';

const CLASSIC_DEFINITION_ID_NAMESPACE = '490603c3-03cc-45b7-ab54-e54574e6d099';

export function generateClassicDefinitionId(projectId: string): string {
  return uuidv5(projectId, CLASSIC_DEFINITION_ID_NAMESPACE);
}
