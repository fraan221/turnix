import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
} from "@react-email/components";
import * as React from "react";
import { getBaseUrl } from "@/lib/get-base-url";

interface ResetPasswordEmailProps {
  userName?: string | null;
  resetLink?: string;
}

const baseUrl = getBaseUrl();

export const ResetPasswordEmail = ({
  userName,
  resetLink,
}: ResetPasswordEmailProps) => (
  <Html>
    <Head />
    <Preview>Restablecé tu contraseña de Turnix - Expira en 1 hora</Preview>
    <Body style={main}>
      <Container style={container}>
        <Section style={logoSection}>
          <Img
            src={`${baseUrl}/logo.png`}
            width="48"
            height="48"
            alt="Turnix"
            style={logo}
          />
        </Section>

        <Section style={heroSection}>
          <Text style={securityBadge}>🔐 Seguridad</Text>
          <Heading style={heading}>Restablecé tu contraseña</Heading>
          {userName && <Text style={heroText}>Hola, {userName}</Text>}
        </Section>

        <Section style={contentSection}>
          <Text style={paragraph}>
            Recibimos una solicitud para restablecer tu contraseña en Turnix.
          </Text>

          <Text style={paragraph}>
            Hacé clic en el botón de abajo para crear una nueva contraseña:
          </Text>

          <Section style={buttonContainer}>
            <Button style={button} href={resetLink}>
              Restablecer Contraseña
            </Button>
          </Section>

          <Section style={infoBox}>
            <Text style={infoIcon}>⏰</Text>
            <Text style={infoText}>
              <strong>Este enlace expira en 1 hora</strong> por razones de
              seguridad
            </Text>
          </Section>

          <Hr style={divider} />

          <Section style={warningBox}>
            <Text style={warningTitle}>⚠️ ¿No solicitaste este cambio?</Text>
            <Text style={warningText}>
              Si no fuiste vos quien solicitó restablecer la contraseña, podés
              ignorar este correo de forma segura. Tu contraseña actual seguirá
              siendo válida.
            </Text>
            <Text style={warningText}>
              Por tu seguridad, te recomendamos{" "}
              <Link href={`${baseUrl}/dashboard/help`} style={inlineLink}>
                contactar a soporte
              </Link>{" "}
              si no reconocés esta actividad.
            </Text>
          </Section>

          <Hr style={divider} />

          <Text style={helpText}>
            <strong>¿Tenés problemas con el enlace?</strong>
          </Text>
          <Text style={paragraph}>
            Si el botón no funciona, copiá y pegá este enlace en tu navegador:
          </Text>
          <Section style={linkBox}>
            <Link href={resetLink} style={rawLink}>
              {resetLink}
            </Link>
          </Section>
        </Section>

        <Section style={footer}>
          <Text style={footerText}>
            El equipo de Turnix
            <br />
            La herramienta de gestión para barberos
          </Text>
          <Text style={footerLinks}>
            <Link href="https://turnix.app" style={footerLink}>
              turnix.app
            </Link>
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
);

export default ResetPasswordEmail;

const main = {
  backgroundColor: "#f4f4f5",
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Ubuntu, sans-serif',
  padding: "20px 0",
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  maxWidth: "600px",
  borderRadius: "12px",
  overflow: "hidden",
  border: "1px solid #e4e4e7",
};

const logoSection = {
  padding: "32px 24px 0",
  textAlign: "center" as const,
};

const logo = {
  margin: "0 auto",
  display: "block",
};

const heroSection = {
  padding: "24px 24px 32px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
};

const securityBadge = {
  display: "inline-block",
  fontSize: "13px",
  lineHeight: "20px",
  fontWeight: "600",
  color: "#18181b",
  backgroundColor: "#fef3c7",
  padding: "4px 12px",
  borderRadius: "12px",
  margin: "0 0 16px",
  border: "1px solid #fde68a",
};

const heading = {
  fontSize: "28px",
  lineHeight: "36px",
  fontWeight: "700",
  margin: "0 0 12px",
  color: "#18181b",
};

const heroText = {
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0",
  color: "#71717a",
};

const contentSection = {
  padding: "32px 24px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 16px",
  color: "#3f3f46",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#18181b",
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 32px",
  lineHeight: "1",
};

const infoBox = {
  backgroundColor: "#f0f9ff",
  border: "1px solid #bae6fd",
  borderRadius: "8px",
  padding: "16px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const infoIcon = {
  fontSize: "24px",
  lineHeight: "1",
  margin: "0 0 8px",
};

const infoText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  color: "#0c4a6e",
};

const warningBox = {
  backgroundColor: "#fef2f2",
  border: "1px solid #fecaca",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
};

const warningTitle = {
  fontSize: "15px",
  lineHeight: "24px",
  fontWeight: "600",
  margin: "0 0 12px",
  color: "#991b1b",
};

const warningText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px",
  color: "#7f1d1d",
};

const divider = {
  borderColor: "#e4e4e7",
  margin: "32px 0",
};

const helpText = {
  fontSize: "15px",
  lineHeight: "24px",
  margin: "0 0 8px",
  color: "#18181b",
};

const linkBox = {
  backgroundColor: "#fafafa",
  border: "1px solid #e4e4e7",
  borderRadius: "6px",
  padding: "12px",
  margin: "12px 0 24px",
  wordBreak: "break-all" as const,
};

const rawLink = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#3f3f46",
  textDecoration: "none",
};

const inlineLink = {
  color: "#18181b",
  textDecoration: "underline",
  fontWeight: "500",
};

const footer = {
  padding: "24px",
  textAlign: "center" as const,
  backgroundColor: "#fafafa",
  borderTop: "1px solid #e4e4e7",
};

const footerText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 12px",
  color: "#71717a",
};

const footerLinks = {
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  color: "#a1a1aa",
};

const footerLink = {
  color: "#71717a",
  textDecoration: "none",
  fontWeight: "500",
};
