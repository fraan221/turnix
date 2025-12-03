import Image from "next/image";
import Link from "next/link";
import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center gap-6 p-6 bg-muted min-h-svh md:p-10">
      <div className="flex flex-col w-full max-w-sm gap-6">
        <Link
          href="/"
          className="flex items-center self-center gap-2 font-semibold"
        >
          <Image
            src="/logo.png"
            alt="Logo de Turnix"
            width={32}
            height={32}
            className="rounded-md"
          />
          Turnix
        </Link>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
