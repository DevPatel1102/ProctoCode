import { cookies } from "next/headers";
import type { Metadata } from "next";

import { SessionProvider } from "@/components/providers/session-provider";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  SESSION_CODE_COOKIE_NAME,
  SESSION_ID_COOKIE_NAME
} from "@/lib/session";

import "./globals.css";

export const metadata: Metadata = {
  title: "Ghost-Proof",
  description: "Web-based proctoring and interview sandbox"
};

type RootLayoutProps = {
  children: React.ReactNode;
};

export default async function RootLayout({ children }: RootLayoutProps) {
  const cookieStore = await cookies();
  const sessionId = cookieStore.get(SESSION_ID_COOKIE_NAME)?.value;
  const sessionCode = cookieStore.get(SESSION_CODE_COOKIE_NAME)?.value;
  const initialSession =
    sessionId && sessionCode ? { sessionId, sessionCode } : null;

  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <body>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var theme = localStorage.getItem('gp_theme');
                  if (theme === 'light' || theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', theme);
                  }
                } catch (error) {}
              })();
            `
          }}
        />
        <SessionProvider initialSession={initialSession}>
          <ThemeToggle />
          {children}
        </SessionProvider>
      </body>
    </html>
  );
}
