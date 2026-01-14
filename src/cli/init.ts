import * as fs from "fs/promises"
import * as os from "os"
import * as path from "path"

type Config = { $schema?: string; plugin?: string[] }

const CONFIG_DIR = path.join(os.homedir(), ".config", "opencode")
const CONFIG_PATH = path.join(CONFIG_DIR, "opencode.json")
const SCHEMA = "https://opencode.ai/config.json"

export async function init() {
  await fs.mkdir(CONFIG_DIR, { recursive: true })
  const config = await loadOrCreateConfig()
  config.plugin = config.plugin || []
  if (!config.plugin.includes("oh-my-mango")) config.plugin.push("oh-my-mango")
  await fs.writeFile(CONFIG_PATH, JSON.stringify(config, null, 2))
  console.log("oh-my-mango plugin registered in ~/.config/opencode/opencode.json")
}

async function loadOrCreateConfig(): Promise<Config> {
  try {
    return JSON.parse(await fs.readFile(CONFIG_PATH, "utf-8"))
  } catch {
    return { $schema: SCHEMA }
  }
}
