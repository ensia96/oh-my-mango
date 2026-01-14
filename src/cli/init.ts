import * as fs from "fs/promises"

type Config = { $schema?: string; plugin?: string[] }

const CONFIG_PATH = "./opencode.json"
const SCHEMA = "https://opencode.ai/config.json"

export async function init() {
  const config = await loadOrCreateConfig()
  config.plugin = config.plugin || []
  if (!config.plugin.includes("oh-my-mango")) config.plugin.push("oh-my-mango")
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
  console.log("oh-my-mango plugin registered in opencode.json")
}

async function loadOrCreateConfig(): Promise<Config> {
  try {
    return JSON.parse(await fs.readFile(CONFIG_PATH, "utf-8"))
  } catch {
    return { $schema: SCHEMA }
  }
}
