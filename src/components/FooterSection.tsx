import Link from "next/link";

const FooterSection = () => {
  return (
    <footer className="w-full py-6 dark:bg-background border-t border-gray-800">
      <div className="container px-4 md:px-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-400 text-sm">
            © 2024 DebateMUN Society. All rights reserved.
          </p>
          <nav className="flex gap-4 mt-4 md:mt-0">
            <Link
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
              href="#"
            >
              Terms of Service
            </Link>
            <Link
              className="text-sm text-gray-400 hover:text-blue-400 transition-colors"
              href="#"
            >
              Privacy Policy
            </Link>
          </nav>
        </div>
      </div>
    </footer>
  );
};

export default FooterSection;
