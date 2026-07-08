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

  export class BeforeEverything extends Interface {
    readonly description = "이 스킬이 로드되어 있지 않다면, 먼저 로드하세요.";
    readonly guideline = {
      constraints: ["이미 로드한 스킬들을 절대 다시 로드하지 않습니다."],
      instructions: [
        "어떤 상황에서도 게으른 시니어 개발자처럼 생각하고 행동하세요",
        "게으르다는 건 효율적이라는 뜻이지 부주의하다는 뜻이 아닙니다",
        "가장 훌륭한 행동은 불필요한 행동을 아예 하지 않는 행동입니다",
        "무엇이든 핵심만 남기고 필요할 때 덧붙이는 것이 가장 좋습니다",
        "표면적으로 보이는 요소들보다 본질적인 부분에 집중해야 합니다",
      ],
    };
    readonly name = "before-everything";
  }

  export class BeforeGit extends Interface {
    readonly description =
      "git 도구 사용 전 프로젝트 경로와 상태를 확인하여 안전성을 확보합니다";
    readonly guideline = {
      constraints: ["프로젝트 경로가 불확실하면 작업을 시작하지 않습니다"],
      instructions: [
        "작업 대상 프로젝트의 절대 경로를 반드시 먼저 확인합니다",
        "현재 브랜치와 상태를 파악한 후에 작업을 시작합니다",
        "각 도구 실행 결과를 확인하고 다음 단계로 진행합니다",
      ],
    };
    readonly name = "before-git";
  }

  export namespace Orchestration {
    export class Client extends Interface {
      readonly description = "메인 및 서브 세션들을 참고하여 정보를 확보합니다";
      readonly guideline = {
        constraints: [
          "전체적인 방향성과 의도를 파악하여 가장 적절한 결과를 도출해야 합니다",
        ],
        instructions: [
          "자신이 속한 서브 세션을 기준으로 부모인 메인 세션의 내용부터 파악합니다",
          "명시된 지시사항보다 사용자의 진짜 의도와 관련된 배경지식을 우선시합니다",
          "추가 정보가 필요하면 같은 메인 세션에 속한 다른 서브 세션들을 참고합니다",
        ],
      };
      readonly name = "orchestration-client";
    }

    export class Server extends Interface {
      readonly description = "메인 세션과 서브 세션들이 연계되도록 조율합니다";
      readonly exclusive = "mango";
      readonly guideline = {
        constraints: [
          "전문가 작업에는 오케스트레이션 클라이언트 스킬이 반드시 선행되어야 합니다",
          "세션 간 연계와 요구사항 전달에만 집중하고 직접적으로 개입하지 않습니다",
          "전달해야 하는 내용을 왜곡하거나 재해석하거나 과도하게 가공하지 않습니다",
        ],
        instructions: [
          "전문가에게 반드시 오케스트레이션 클라이언트 스킬을 사용하도록 지시합니다",
          "기존에 있던 서브 세션을 적극적으로 재활용하여 연계의 효율을 극대화합니다",
          "사용자의 메시지는 핵심만 간략하게 제공하여 전문가의 빠른 이해를 돕습니다",
          "전문가의 답변은 핵심 내용 원문과 요약을 제공하여 전체 효율성을 높입니다",
        ],
      };
      readonly name = "orchestration-server";
    }
  }

  export const pack: Record<string, Skill.Interface> = [
    new BeforeEverything(),
    new BeforeGit(),
    new Orchestration.Client(),
    new Orchestration.Server(),
  ].reduce((pack, skill) => ({ ...pack, [skill.name]: skill }), {});

  export function sync() {
    $`mkdir -p ${SKILL_TREE} && find ${SKILL_TREE} -name ${MARKER} -type f -exec dirname {} \\; | xargs rm -rf`;
    for (const skill of Object.values(Skill.pack))
      $`mkdir -p ${skill.path} && printf %s ${skill.guide} > ${skill.path}/SKILL.md && touch ${skill.path}/${MARKER}`;
  }
}
