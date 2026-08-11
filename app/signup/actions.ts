"use server"
import { signIn } from "@/auth"

export async function signUpWithGitHub() {
  await signIn("github", { redirectTo: "/dashboard" })
}
