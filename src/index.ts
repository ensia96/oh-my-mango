import type { Plugin } from "@opencode-ai/plugin"

const plugin: Plugin = async () => {
  console.log("[oh-my-mango] initialized")
  return {
    config: async (config) => {
      config.agent = {
        ...config.agent,
        mango: {
          prompt: "",
          description: "oh-my-mango 기본 에이전트",
          mode: "primary",
        },
      }
      ;(config as { default_agent?: string }).default_agent = "mango"
    },
  }
}

export default plugin
