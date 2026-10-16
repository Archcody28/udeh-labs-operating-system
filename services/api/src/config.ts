/** Runtime configuration. Env-only secrets; placeholders live in .env.example. */
export interface ApiConfig {
  port: number;
  databaseUrl: string;
  nodeEnv: string;
  cookieSecure: boolean;
}

function required(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`missing required env ${name}`);
  return v;
}

export function loadConfig(): ApiConfig {
  const nodeEnv = process.env.NODE_ENV ?? "development";
  return {
    port: Number(process.env.PORT ?? "3001"),
    databaseUrl: required(
      "DATABASE_URL",
      "postgresql://udehlabs:udehlabs_dev@localhost:5432/udehlabs_dev"
    ),
    nodeEnv,
    cookieSecure: (process.env.COOKIE_SECURE ?? (nodeEnv === "production" ? "true" : "false")) === "true"
  };
}
