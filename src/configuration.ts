import { readFileSync, existsSync } from 'node:fs';
import * as yaml from 'js-yaml';
import { join } from 'node:path';
import * as _ from 'lodash';

const YAML_COMMON_CONFIG_PATH = join(__dirname, '../config/config.yml');
const YAML_ENV_CONFIG_PATH = join(
  __dirname,
  `../config/config.${process.env.NODE_ENV || 'development'}.yml`,
);

const loadConfig = (filePath: string): Record<string, any> => {
  if (!existsSync(filePath)) {
    throw new Error(`Configuration file not found: ${filePath}`);
  }

  try {
    const fileContent = readFileSync(filePath, 'utf8');
    const config = yaml.load(fileContent) as Record<string, any>;
    return config;
  } catch (error) {
    throw new Error(
      `Failed to load configuration from ${filePath}: ${error instanceof Error ? error.message : String(error)}`,
    );
  }
};

const commonConfig = loadConfig(YAML_COMMON_CONFIG_PATH);
const envConfig = loadConfig(YAML_ENV_CONFIG_PATH);

export default () => {
  return _.merge({}, commonConfig, envConfig);
};
