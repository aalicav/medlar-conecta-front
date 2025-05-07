import type React from "react"
import { redirect } from "next/navigation"
import { cookies } from "next/headers"

export default async function Layout({ children }: { children: React.ReactNode }) {
  // Check if user is authenticated on the server
  const cookieStore = await cookies()
  const token = cookieStore.get("token")?.value

  if (!token) {
    redirect("/login")
  }

  return <>{children}</>
}
