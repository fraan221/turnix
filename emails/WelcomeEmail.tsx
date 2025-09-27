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
} from "@react-email/components";
import * as React from "react";
import { getBaseUrl } from "@/lib/get-base-url";

interface WelcomeEmailProps {
  name?: string | null;
}

const baseUrl = getBaseUrl();

export const WelcomeEmail = ({ name }: WelcomeEmailProps) => (
  <Html>
    <Head />
    <Preview>¡Bienvenido a Turnix! Gestiona tu barbería como un PRO.</Preview>
    <Body style={main}>
      <Container style={container}>
        <Img
          src={`${baseUrl}/logo.png`}
          width="40"
          height="40"
          alt="Logo de Turnix"
          style={logo}
        />
        <Heading style={heading}>¡Bienvenido a Turnix, {name}!</Heading>
        <Section>
          <Text style={paragraph}>
            ¡Estamos felices de tenerte a bordo! Has tomado el primer paso para
            optimizar la gestión de tu barbería, ahorrar tiempo y reducir las
            ausencias de clientes.
          </Text>
          <Text style={paragraph}>
            Ahora podés empezar a configurar tu perfil, cargar tus servicios y
            definir tus horarios para que tus clientes puedan empezar a agendar
            turnos online.
          </Text>
        </Section>
        <Section style={buttonContainer}>
          <Button style={button} href={`${baseUrl}/dashboard`}>
            Ir a mi Panel
          </Button>
        </Section>
        <Text style={paragraph}>
          Si tenés alguna pregunta o necesitás ayuda para empezar, no dudes en
          visitar nuestro Centro de Ayuda o contactar a soporte desde tu panel.
        </Text>
        <Text style={footer}>
          El equipo de Turnix
          <br />
          <Link href="https://turnix.app" style={link}>
            turnix.app
          </Link>
        </Text>
      </Container>
    </Body>
  </Html>
);

export default WelcomeEmail;

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
  borderRadius: "8px",
  border: "1px solid #eaeaea",
};

const logo = {
  margin: "0 auto",
};

const heading = {
  fontSize: "28px",
  fontWeight: "bold",
  marginTop: "32px",
  textAlign: "center" as const,
  color: "#1a202c",
};

const paragraph = {
  fontSize: "16px",
  lineHeight: "24px",
  textAlign: "left" as const,
  color: "#4a5568",
  padding: "0 20px",
};

const buttonContainer = {
  textAlign: "center" as const,
  margin: "32px 0",
};

const button = {
  backgroundColor: "#000000",
  borderRadius: "4px",
  color: "#fff",
  fontSize: "16px",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
  fontWeight: "bold",
};

const footer = {
  color: "#8898aa",
  fontSize: "12px",
  lineHeight: "16px",
  padding: "0 20px",
};

const link = {
  color: "#8898aa",
  textDecoration: "underline",
};
