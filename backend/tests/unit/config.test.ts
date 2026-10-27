import { describe, expect, it } from 'vitest';
import { loadConfig } from '../../src/config.js';

describe('loadConfig', () => {
  it('usa el puerto 3000 y el origen de Vite por defecto', () => {
    expect(loadConfig({})).toEqual({ port: 3000, corsOrigins: ['http://localhost:5173'] });
  });

  it('lee el puerto y una lista de orígenes separada por comas', () => {
    const config = loadConfig({ PORT: '8080', CORS_ORIGINS: 'https://a.example, https://b.example,,' });

    expect(config).toEqual({ port: 8080, corsOrigins: ['https://a.example', 'https://b.example'] });
  });
});
