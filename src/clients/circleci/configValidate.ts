import { ConfigValidate } from '../schemas.js';
import { HTTPClient } from './httpClient.js';

export class ConfigValidateAPI {
  protected client: HTTPClient;

  constructor(httpClient: HTTPClient) {
    this.client = httpClient;
  }

  /**
   * Validate a config with the default values
   * @param params Configuration parameters
   * @param params.config The config to validate
   * @returns ConfigValidate
   * @throws Error if the config is invalid
   */
  async validateConfig({
    config,
  }: {
    config: string;
  }): Promise<ConfigValidate> {
    const rawResult = await this.client.post<unknown>(
      `/compile-config-with-defaults`,
      { config_yaml: config },
    );

    const parsedResult = ConfigValidate.safeParse(rawResult);

    if (!parsedResult.success) {
      throw new Error('Failed to parse config validate response');
    }

    return parsedResult.data;
  }
}
