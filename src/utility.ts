import { execSync } from "node:child_process";

export function _(command: TemplateStringsArray, ...values: unknown[]) {
  return command.reduce(
    (command, segment, index) =>
      command +
      segment +
      (values.length > index
        ? `'${String(values[index] ?? "")
            .replace(/\x00/g, "")
            .replace(/'/g, "'\\''")}'`
        : ""),
    "",
  );
}

export function $(
  command: string | TemplateStringsArray,
  ...values: unknown[]
) {
  return execSync(
    typeof command === "object" && "raw" in command
      ? _(command, ...values)
      : command,
    { encoding: "utf-8" },
  ).trim();
}

$.pipe = (...parts: (string | false | null | undefined)[]) =>
  $(parts.filter(Boolean).join(" "));
