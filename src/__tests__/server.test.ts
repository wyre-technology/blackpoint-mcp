import { describe, it, expect } from 'vitest';
import { createMcpServer } from '../server.js';

describe('Blackpoint MCP Server', () => {
  it('should create server instance', () => {
    const server = createMcpServer();
    expect(server).toBeDefined();
    expect(typeof server).toBe('object');
  });

  it('should be callable', () => {
    // Basic test that the server can be created without throwing
    expect(() => createMcpServer()).not.toThrow();
  });
});