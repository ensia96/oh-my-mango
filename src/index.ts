import type { Plugin } from "@opencode-ai/plugin"

const plugin: Plugin = async ({ client }) => {
  await client.app.log({ body: { level: "info", message: "oh-my-mango initialized", service: "oh-my-mango" } })
  return {}
}

export default plugin
