export interface AppEnvironment {
  nodeEnv: 'development' | 'production' | 'test';
  port: number;
  webOrigin: string;
}
