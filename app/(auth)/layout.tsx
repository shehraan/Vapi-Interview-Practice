import { ReactNode } from "react";
import { redirect } from "next/navigation";

import { isAuthenticated } from "@/lib/actions/auth.action";

export default async function AuthLayout({
  children,
}: { children: ReactNode }) {
  const isUserAuthenticated = await isAuthenticated();
  if (isUserAuthenticated) {
    redirect("/");
  }

  return <div className="auth-layout">{children}</div>;
}