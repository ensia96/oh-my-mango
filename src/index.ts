import type { Plugin } from "@opencode-ai/plugin";
import { Agent } from "./agent";
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
      config.agent = Agent.team;
      (config as { default_agent?: string }).default_agent = Agent.leader;
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
