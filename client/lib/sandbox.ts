export type SandboxLanguage = "javascript" | "python";

export const codeTemplates: Record<SandboxLanguage, string> = {
  javascript: `function greet(name) {
  return "Hello, " + name + "!";
}

console.log(greet("Ghost-Proof"));`,
  python: `def greet(name):
    return f"Hello, {name}!"

print(greet("Ghost-Proof"))`
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
