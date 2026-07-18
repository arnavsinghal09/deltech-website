import Link from "next/link"
import { STRINGS } from "@/content/strings"
import { SignInForm } from "../_components/sign-in-form"
import { AuthStage } from "../_components/auth-stage"

export const metadata = { title: "Secretariat — " + STRINGS.brand.name }

export default function StaffSignInPage() {
  return (
    <AuthStage kind="staff">
      <p className="font-mono text-xs font-bold uppercase tracking-[0.2em] text-amber-700">Clearance / Staff</p>
      <h2 className="mt-5 max-w-[12ch] font-heading text-4xl leading-tight sm:text-5xl">Secretariat access.</h2>
      <p className="mt-3 max-w-md text-base leading-relaxed text-black/55">Use the email an admin approved. Password is fastest; magic link is the recovery door.</p>
      <div className="my-7 h-px bg-black/15" />
      <SignInForm defaultTab="password" />
      <p className="mt-7 border-t border-black/15 pt-5 text-sm text-black/55">
        Not staff? <Link href="/signin" className="font-bold text-amber-800 underline">Return to delegate access</Link>
      </p>
    </AuthStage>
  )
}
