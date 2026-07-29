import fs from "fs";
import path from "path";
import axios from "axios";
import { config } from "./config";

// Replays every sample order in ./sample-orders against a running local
// webshop-sync instance, so the whole pipeline can be demoed end to end
// without a real webshop.
async function main() {
  const dir = path.join(__dirname, "..", "sample-orders");
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".json"));

  for (const file of files) {
    const order = JSON.parse(fs.readFileSync(path.join(dir, file), "utf-8"));
    try {
      const res = await axios.post(`http://localhost:${config.port}/webshop-order`, order);
      console.log(`${file}: ${res.status}`, res.data);
    } catch (err: any) {
      console.log(`${file}: ${err.response?.status}`, err.response?.data ?? err.message);
    }
  }
}

main();
