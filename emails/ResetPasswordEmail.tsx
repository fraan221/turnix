import * as React from "react";

interface ResetPasswordEmailProps {
  userName?: string;
  resetLink?: string;
}

export const ResetPasswordEmail: React.FC<
  Readonly<ResetPasswordEmailProps>
> = ({ userName, resetLink }) => (
  <div style={{ fontFamily: "Arial, sans-serif", lineHeight: "1.6" }}>
    <h1>Hola, {userName}!</h1>
    <p>
      Recibimos una solicitud para resetear tu contraseña en Turnix. Haz clic en
      el siguiente enlace para establecer una nueva contraseña:
    </p>
    <a
      href={resetLink}
      style={{
        backgroundColor: "#000",
        color: "#fff",
        padding: "10px 15px",
        textDecoration: "none",
        borderRadius: "5px",
        display: "inline-block",
      }}
    >
      Resetear Contraseña
    </a>
    <p>
      Si no solicitaste un reseteo de contraseña, puedes ignorar este email de
      forma segura.
    </p>
    <p>El enlace expirará en 1 hora.</p>
    <p>
      Saludos,
      <br />
      El equipo de Turnix
    </p>
  </div>
);
