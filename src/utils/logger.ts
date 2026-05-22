const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 } as const;
type LogLevel = keyof typeof LEVELS;

function getConfiguredLevel(): LogLevel {
  const level = process.env.LOG_LEVEL?.toLowerCase() as LogLevel;
  return level && level in LEVELS ? level : 'info';
}

function serializeContext(context: unknown): unknown {
  if (context instanceof Error) {
    return {
      name: context.name,
      message: context.message,
      stack: context.stack,
    };
  }

  if (context && typeof context === 'object') {
    return Object.fromEntries(
      Object.entries(context).map(([key, value]) => [
        key,
        value instanceof Error ? serializeContext(value) : value,
      ])
    );
  }

  return context;
}

function log(level: LogLevel, message: string, context?: unknown): void {
  if (LEVELS[level] < LEVELS[getConfiguredLevel()]) return;

  const timestamp = new Date().toISOString();
  const prefix = `${timestamp} [${level.toUpperCase()}]`;

  // ALL output to stderr (stdout = MCP protocol)
  if (context !== undefined) {
    console.error(`${prefix} ${message} ${JSON.stringify(serializeContext(context))}`);
  } else {
    console.error(`${prefix} ${message}`);
  }
}

export const logger = {
  debug: (msg: string, ctx?: unknown) => log('debug', msg, ctx),
  info: (msg: string, ctx?: unknown) => log('info', msg, ctx),
  warn: (msg: string, ctx?: unknown) => log('warn', msg, ctx),
  error: (msg: string, ctx?: unknown) => log('error', msg, ctx),
};
