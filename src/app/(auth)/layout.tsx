import type { ReactNode } from "react";

export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="gradient-bg flex min-h-screen flex-col items-center justify-center px-4 py-10">
      {children}
    </main>
  );
}
