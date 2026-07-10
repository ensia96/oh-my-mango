import type { Plugin } from "@opencode-ai/plugin";
import { Agent } from "./agent";
import { Skill } from "./skill";
import { Tool } from "./tool";

const plugin: Plugin = async () => {
  console.log("[oh-my-mango] initialized");
  Skill.sync();

  return {
    config: async (config) => {
      Object.assign(config, { default_agent: Agent.leader });
      config.agent = Agent.team;
      config.permission = {
        bash: {
          "*gh issue create*": "ask",
          "*gh pr create*": "ask",
          "*gh pr merge*": "ask",
          "*gh repo*": "ask",
          "*git clean*": "ask",
          "*git commit*": "ask",
          "*git push*": "ask",
          "*git rebase*": "ask",
          "*git reset --hard*": "ask",
          "*rm *": "ask",
          "*sudo *": "ask",
        },
      };
    },
    tool: Tool.box,
  };
};

export default plugin;
