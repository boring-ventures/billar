import Image from "next/image";
import Link from "next/link";

interface Props {
  children: React.ReactNode;
}

export default function AuthLayout({ children }: Props) {
  return (
    <div className="container grid h-svh flex-col items-center justify-center bg-primary-foreground lg:max-w-none lg:px-0">
      <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[480px] lg:p-8">
        <div className="mb-4 flex items-center justify-center">
          <Link
            href="/"
            className="flex items-center hover:opacity-80 transition-opacity"
          >
            <Image
              src="/brand-assets/logo.svg"
              alt="BILLARPRO Logo"
              width={32}
              height={32}
              className="mr-3"
            />
            <h1 className="text-xl font-bold">BILLARPRO</h1>
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}
