"use client";

import { useEffect } from "react";
import { Dlt_white as WhiteLogo } from "../../public/assets/logos/dlt_white";
import { Dlt_black as BlackLogo } from "../../public/assets/logos/dlt_black";
import { useRecoilState } from "recoil";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "next-themes";
import { mounted } from "@/atoms/mounted";
import Link from "next/link";

export default function SiteHeader() {
  const [mount, setMount] = useRecoilState(mounted);

  useEffect(() => {
    setMount(true);
  }, [setMount]);
  const { resolvedTheme } = useTheme();
  if (!mounted) return null;
  console.log("Resolving Themhjes", resolvedTheme);
  return (
    <nav
      className={`fixed top-5 border-2 border-gray-400 left-0 right-0 z-50 mx-5 backdrop-blur-lg rounded-xl  `}
    >
      <div className=" px-2 py-2">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            {resolvedTheme == "dark" ? (
              <WhiteLogo className="w-40 h-10" />
            ) : (
              <BlackLogo className="w-40 h-10" />
            )}
          </div>

          <div className="ml-auto gap-4 md:gap-6 ">
            <div className="flex justify-center items-center gap-4">
              <Link
                className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
                href="/dashboard"
              >
                Dashboard
              </Link>

              <Link
                className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
                href="/pricing"
              >
                Pricing
              </Link>
              <Link
                className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
                href="/about"
              >
                About
              </Link>
              <Link
                className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
                href="/contact"
              >
                Contact
              </Link>
              <Link
                className="text-sm font-medium text-primary hover:underline transition-colors duration-200"
                href="/auth/signup"
              >
                Get Started
              </Link>
            </div>
          </div>

          {/* <div className="flex items-center space-x-4">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" alt="User" />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </div> */}
        </div>
      </div>
    </nav>
  );
}
