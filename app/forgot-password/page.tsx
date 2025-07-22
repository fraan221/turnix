import { ForgotPasswordForm } from "@/components/ForgotPasswordForm";

export default function ForgotPasswordPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-24">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">
          ¿Olvidaste tu Contraseña?
        </h1>
        <p className="mb-8 text-center text-gray-600">
          No te preocupes. Introduce tu email y te enviaremos un enlace para
          resetear tu contraseña.
        </p>
        <ForgotPasswordForm />
      </div>
    </div>
  );
}
