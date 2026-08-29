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

interface WelcomeBarberEmailProps {
  name?: string | null;
  connectionCode: string;
}

const baseUrl = getBaseUrl();

export const WelcomeBarberEmail = ({
  name,
  connectionCode,
}: WelcomeBarberEmailProps) => (
  <Html>
    <Head />
    <Preview>
      ¡Bienvenido a Turnix! Tu código de conexión: {connectionCode}
    </Preview>
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
          <Heading style={heading}>
            ¡Bienvenido a Turnix{name ? `, ${name}` : ""}! 🎉
          </Heading>
          <Text style={heroText}>
            Tu cuenta de barbero fue creada con éxito
          </Text>
        </Section>

        <Section style={contentSection}>
          <Text style={paragraph}>
            Para empezar a recibir turnos, necesitás conectarte con la barbería
            donde trabajás. Compartí tu código de conexión con el dueño para que
            te agregue a su equipo.
          </Text>

          {/* Connection Code Card */}
          <Section style={codeCard}>
            <Text style={codeLabel}>Tu código de conexión</Text>
            <Text style={codeValue}>{connectionCode}</Text>
            <Text style={codeHint}>
              Compartí este código con el dueño de la barbería
            </Text>
          </Section>

          {/* Steps Cards */}
          <Section style={cardContainer}>
            <Section style={card}>
              <Text style={cardIcon}>🔗</Text>
              <Text style={cardTitle}>Compartí tu código</Text>
              <Text style={cardText}>
                Dáselo al dueño de la barbería para que te agregue a su equipo
              </Text>
            </Section>

            <Section style={card}>
              <Text style={cardIcon}>✂️</Text>
              <Text style={cardTitle}>Unite al equipo</Text>
              <Text style={cardText}>
                El dueño te agrega desde su panel con tu código de conexión
              </Text>
            </Section>

            <Section style={card}>
              <Text style={cardIcon}>📅</Text>
              <Text style={cardTitle}>Empezá a recibir turnos</Text>
              <Text style={cardText}>
                Tus clientes van a poder reservar turnos con vos directamente
              </Text>
            </Section>
          </Section>

          <Section style={buttonContainer}>
            <Button style={button} href={`${baseUrl}/login`}>
              Iniciar Sesión
            </Button>
          </Section>

          <Hr style={divider} />

          <Text style={helpText}>
            <strong>¿Necesitás ayuda para empezar?</strong>
          </Text>
          <Text style={paragraph}>
            Nuestro equipo está disponible para ayudarte. Contactanos desde el
            panel o visitá nuestro{" "}
            <Link href={`${baseUrl}/dashboard/help`} style={inlineLink}>
              Centro de Ayuda
            </Link>
            .
          </Text>
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

export default WelcomeBarberEmail;

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

const codeCard = {
  backgroundColor: "#18181b",
  borderRadius: "12px",
  padding: "24px",
  margin: "24px 0",
  textAlign: "center" as const,
};

const codeLabel = {
  fontSize: "13px",
  lineHeight: "20px",
  fontWeight: "600",
  margin: "0 0 8px",
  color: "#a1a1aa",
  textTransform: "uppercase" as const,
  letterSpacing: "0.05em",
};

const codeValue = {
  fontSize: "36px",
  lineHeight: "1",
  fontWeight: "700",
  margin: "0 0 12px",
  color: "#ffffff",
  letterSpacing: "0.15em",
  fontFamily: "monospace",
};

const codeHint = {
  fontSize: "13px",
  lineHeight: "20px",
  margin: "0",
  color: "#71717a",
};

const cardContainer = {
  margin: "24px 0",
};

const card = {
  backgroundColor: "#fafafa",
  borderRadius: "8px",
  padding: "20px",
  marginBottom: "12px",
  border: "1px solid #f4f4f5",
};

const cardIcon = {
  fontSize: "28px",
  lineHeight: "1",
  margin: "0 0 12px",
};

const cardTitle = {
  fontSize: "16px",
  lineHeight: "24px",
  fontWeight: "600",
  margin: "0 0 8px",
  color: "#18181b",
};

const cardText = {
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0",
  color: "#71717a",
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
