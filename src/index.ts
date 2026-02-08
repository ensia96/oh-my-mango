import type { Plugin } from "@opencode-ai/plugin";
import { Agent } from "./agent";
import { Tool } from "./tool";

const plugin: Plugin = async () => {
  console.log("[oh-my-mango] initialized");

  return {
    config: async (config) => {
      config.agent = Agent.team;
      (config as { default_agent?: string }).default_agent = Agent.leader;
    },
    tool: Tool.box,
  };
};

export default plugin;
