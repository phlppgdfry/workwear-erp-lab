import axios from "axios";
import { config } from "./config";

async function main() {
  const integrationKey = process.argv[2];
  if (!integrationKey) {
    throw new Error("Usage: npm run reprocess -- <integrationKey>");
  }
  if (!config.integrationApiKey) {
    throw new Error("INTEGRATION_API_KEY must be set in .env");
  }

  const response = await axios.post(
    `http://localhost:${config.port}/operations/${encodeURIComponent(integrationKey)}/reprocess`,
    undefined,
    { headers: { "x-api-key": config.integrationApiKey } }
  );
  console.log(JSON.stringify(response.data, null, 2));
}

main().catch((error: unknown) => {
  const message = axios.isAxiosError(error) ? error.response?.data ?? error.message : error instanceof Error ? error.message : "Unknown error";
  console.error("Reprocess failed:", message);
  process.exit(1);
});
