import { _, $ } from "./utility";

export namespace Skill {
  const MARKER = ".oh-my-mango";
  const SKILL_TREE = `${process.env.HOME}/.config/opencode/skills`;

  export type Guideline = { constraints: string[]; instructions: string[] };

  export abstract class Interface {
    abstract readonly description: string;
    readonly exclusive?: string;
    abstract readonly guideline: Guideline;
    abstract readonly name: string;

    get constraints(): string {
      return [
        "# 제약 조건",
        this.guideline.constraints
          .map((constraint) => `- ${constraint}`)
          .join("\n"),
      ].join("\n\n");
    }

    get frontmatter(): string {
      return [
        "---",
        `name: ${this.name}`,
        `description: ${[this.exclusive && `${this.exclusive} 전용 스킬입니다.`, this.description].filter(Boolean).join(" ")}`,
        "---",
      ].join("\n");
    }

    get guide(): string {
      return [this.frontmatter, this.instructions, this.constraints].join(
        "\n\n",
      );
    }

    get instructions(): string {
      return [
        "# 지침",
        this.guideline.instructions
          .map((instruction, index) => `${index + 1}. ${instruction}`)
          .join("\n"),
      ].join("\n\n");
    }

    get path(): string {
      return `${SKILL_TREE}/${this.name}`;
    }
  }

  export class BeforeGit extends Interface {
    readonly description =
      "git 도구 사용 전 프로젝트 경로와 상태를 확인하여 안전성을 확보합니다";
    readonly guideline = {
      constraints: [
        "프로젝트 경로가 불확실하면 작업을 시작하지 않습니다",
      ],
      instructions: [
        "작업 대상 프로젝트의 절대 경로를 반드시 먼저 확인합니다",
        "현재 브랜치와 상태를 파악한 후에 작업을 시작합니다",
        "각 도구 실행 결과를 확인하고 다음 단계로 진행합니다",
      ],
    };
    readonly name = "before-git";
  }

  export const pack: Record<string, Skill.Interface> = [
    new BeforeGit(),
  ].reduce((pack, skill) => ({ ...pack, [skill.name]: skill }), {});

  export function sync() {
    $`mkdir -p ${SKILL_TREE} && find ${SKILL_TREE} -name ${MARKER} -type f -exec dirname {} \\; | xargs rm -rf`;
    for (const skill of Object.values(Skill.pack))
      $`mkdir -p ${skill.path} && printf %s ${skill.guide} > ${skill.path}/SKILL.md && touch ${skill.path}/${MARKER}`;
  }
}
