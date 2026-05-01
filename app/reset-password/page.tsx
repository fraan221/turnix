import { Suspense } from "react";
import { ResetPasswordForm } from "@/components/ResetPasswordForm";

export default async function ResetPasswordPage(
  props: {
    searchParams: Promise<{ token?: string }>;
  }
) {
  const searchParams = await props.searchParams;
  const token = searchParams.token;

  if (!token) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-24">
        <div className="w-full max-w-md">
          <h1 className="mb-6 text-2xl font-bold text-center">
            Token no encontrado
          </h1>
          <p className="mb-8 text-center text-gray-600">
            El enlace para resetear la contraseña es inválido o ha expirado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-24">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-2xl font-bold text-center">
          Resetear Contraseña
        </h1>
        <p className="mb-8 text-center text-gray-600">
          Introduce tu nueva contraseña.
        </p>
        <Suspense fallback={<div>Cargando formulario...</div>}>
          <ResetPasswordForm token={token} />
        </Suspense>
      </div>
    </div>
  );
}
