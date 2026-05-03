export type SandboxLanguage = "javascript" | "python";

export const codeTemplates: Record<SandboxLanguage, string> = {
  javascript: `function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("ProctoCode"));`,
  python: `def greet(name):
    return f"Hello, {name}!"

print(greet("ProctoCode"))`
};

export const languageOptions: Array<{
  label: string;
  value: SandboxLanguage;
}> = [
  { label: "JavaScript", value: "javascript" },
  { label: "Python", value: "python" }
];

export function getMonacoLanguage(language: SandboxLanguage) {
  return language === "python" ? "python" : "javascript";
}
