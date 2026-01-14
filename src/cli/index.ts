import { init } from "./init.js"

export function run() {
  const [command] = process.argv.slice(2)
  switch (command) {
    case "init": return init()
    default: console.log("Usage: oh-my-mango <init>"); process.exit(1)
  }
}
