export type SandboxLanguage = "javascript" | "python" | "java" | "c" | "cpp";

export const codeTemplates: Record<SandboxLanguage, string> = {
  javascript: `// Use readLine() to read each line of input
// Use readLines() to get all lines as an array
// __INPUT__ contains the full raw input string

const line = readLine();       // reads first line
console.log(line);             // print output with console.log`,

  python: `# Use input() to read each line of input
# Use sys.stdin.read() for all input at once
import sys

line = input()         # reads first line
print(line)            # print output with print()`,

  java: `import java.util.Scanner;

public class Solution {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // Read input with sc.nextLine(), sc.nextInt(), sc.nextLong() etc.
        String line = sc.nextLine();
        System.out.println(line);
    }
}`,

  c: `#include <stdio.h>
#include <string.h>

int main() {
    // Read input with scanf(), fgets(), getchar() etc.
    char line[1024];
    fgets(line, sizeof(line), stdin);
    // Remove trailing newline if present
    line[strcspn(line, "\\n")] = '\\0';
    printf("%s\\n", line);
    return 0;
}`,

  cpp: `#include <bits/stdc++.h>
using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Read input with cin, getline() etc.
    string line;
    getline(cin, line);
    cout << line << endl;
    return 0;
}`
};

export const languageOptions: Array<{
  label: string;
  value: SandboxLanguage;
  icon: string;
}> = [
  { label: "JavaScript", value: "javascript", icon: "JS" },
  { label: "Python",     value: "python",     icon: "PY" },
  { label: "Java",       value: "java",       icon: "JV" },
  { label: "C",          value: "c",          icon: "C"  },
  { label: "C++",        value: "cpp",        icon: "C+" }
];

export function getMonacoLanguage(language: SandboxLanguage): string {
  const map: Record<SandboxLanguage, string> = {
    javascript: "javascript",
    python:     "python",
    java:       "java",
    c:          "c",
    cpp:        "cpp"
  };
  return map[language] ?? "plaintext";
}
