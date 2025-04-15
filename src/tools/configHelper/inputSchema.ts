import { z } from 'zod';

export const configHelperInputSchema = z.object({
  configFile: z
    .string()
    .describe(
      'The contents of the circleci config file. This should be the contents of the circleci config file, not the path to the file. Typically located at .circleci/config.yml',
    ),
});
