import {
  Html,
  Head,
  Preview,
  Body,
  Container,
  Section,
  Text,
  Button,
  Hr,
} from "@react-email/components";
import * as React from "react";

interface InviteEmailProps {
  inviteLink: string;
  role: string;
}

export default function InviteEmail({ inviteLink, role }: InviteEmailProps) {
  // Format "BUYER_REP" to "BUYER REP"
  const formattedRole = role.replace("_", " ");

  return (
    <Html>
      <Head />
      <Preview>You have been invited to join GlobCom ERP</Preview>
      <Body style={main}>
        <Container style={container}>
          {/* Header/Brand Section */}
          <Section style={header}>
            <Text style={logoText}>GlobCom ERP</Text>
          </Section>

          {/* Main Content */}
          <Section style={contentSection}>
            <Text style={heading}>Welcome to the team!</Text>
            <Text style={paragraph}>
              You have been invited to join the GlobCom enterprise platform. Your administrator has assigned you the role of <strong>{formattedRole}</strong>.
            </Text>
            <Text style={paragraph}>
              Click the button below to accept your invitation, securely configure your account password, and access your dashboard.
            </Text>

            <Section style={buttonContainer}>
              <Button style={button} href={inviteLink}>
                Accept Invitation & Setup Account
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Hr style={hr} />
          <Section style={footer}>
            <Text style={footerText}>
              This secure link will expire in 48 hours. If you did not expect this invitation or believe it was sent in error, you can safely ignore this email.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

// ==========================================
// INLINE STYLES (Ensures cross-client compatibility)
// ==========================================

const main = {
  backgroundColor: "#f4f4f5", // Light gray background outside the card
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  padding: "40px 0",
};

const container = {
  backgroundColor: "#ffffff",
  border: "1px solid #e4e4e7",
  borderRadius: "12px",
  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)",
  margin: "0 auto",
  padding: "0",
  maxWidth: "560px",
  overflow: "hidden", // Keeps the top header radius clean
};

const header = {
  backgroundColor: "#09090b", // Deep black/slate
  padding: "24px 32px",
  textAlign: "center" as const,
};

const logoText = {
  color: "#ffffff",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "0",
  letterSpacing: "0.5px",
};

const contentSection = {
  padding: "40px 32px",
};

const heading = {
  fontSize: "24px",
  fontWeight: "700",
  color: "#09090b",
  margin: "0 0 16px",
};

const paragraph = {
  fontSize: "15px",
  lineHeight: "24px",
  color: "#52525b",
  margin: "0 0 16px",
};

const buttonContainer = {
  textAlign: "center" as const,
  marginTop: "32px",
  marginBottom: "16px",
};

const button = {
  backgroundColor: "#2563eb", // Vibrant modern blue
  borderRadius: "8px",
  color: "#ffffff",
  fontSize: "15px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "14px 28px",
};

const hr = {
  borderColor: "#e4e4e7",
  margin: "0",
};

const footer = {
  padding: "24px 32px",
  backgroundColor: "#fafafa",
};

const footerText = {
  fontSize: "13px",
  lineHeight: "20px",
  color: "#a1a1aa",
  margin: "0",
  textAlign: "center" as const,
};