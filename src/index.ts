import type { Plugin } from "@opencode-ai/plugin";
import {
  AnalyzeMango,
  BuildMango,
  IssueMango,
  Mango,
  PrMango,
  ResearchMango,
} from "./agents";
import { find_content, find_file, find_recent } from "./tools/find";
import {
  commit,
  create_branch,
  create_issue,
  create_pr,
} from "./tools/git";
import {
  remind_find,
  remind_info,
  remind_list,
  remind_read,
  remind_search,
} from "./tools/remind";

const plugin: Plugin = async () => {
  console.log("[oh-my-mango] initialized");

  return {
    config: async (config) => {
      config.agent = {
        ...config.agent,
        ...Object.fromEntries(
          [
            new Mango(),
            new AnalyzeMango(),
            new BuildMango(),
            new IssueMango(),
            new PrMango(),
            new ResearchMango(),
          ].map((agent) => [agent.name, agent.config]),
        ),
      };
      (config as { default_agent?: string }).default_agent = "mango";
    },
    tool: {
      commit,
      create_branch,
      create_issue,
      create_pr,
      find_content,
      find_file,
      find_recent,
      remind_find,
      remind_info,
      remind_list,
      remind_read,
      remind_search,
    },
  };
};

export default plugin;
