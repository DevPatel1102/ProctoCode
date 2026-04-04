import dotenv from "dotenv";

dotenv.config();

function getRequiredEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

function getOptionalEnv(name: string, fallback?: string) {
  const value = process.env[name] ?? fallback;
  return value && value.length > 0 ? value : undefined;
}

export const env = {
  port: Number(getRequiredEnv("PORT", "5000")),
  clientOrigin: getRequiredEnv("CLIENT_ORIGIN", "http://localhost:3000"),
  mongodbUri: getRequiredEnv("MONGODB_URI", "mongodb://127.0.0.1:27017/ghost-proof"),
  jwtSecret: getRequiredEnv("JWT_SECRET", "change-this-in-production"),
  jwtExpiresIn: getRequiredEnv("JWT_EXPIRES_IN", "7d"),
  smtpHost: getOptionalEnv("SMTP_HOST"),
  smtpPort: Number(getOptionalEnv("SMTP_PORT", "587")),
  smtpSecure: getOptionalEnv("SMTP_SECURE", "false") === "true",
  smtpUser: getOptionalEnv("SMTP_USER"),
  smtpPass: getOptionalEnv("SMTP_PASS"),
  smtpFrom: getOptionalEnv("SMTP_FROM")
};
