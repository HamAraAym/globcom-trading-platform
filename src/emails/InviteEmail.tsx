import { Html, Button, Text, Container, Section } from "@react-email/components";

export default function InviteEmail({ inviteLink, role }: { inviteLink: string; role: string }) {
  return (
    <Html>
      <Container style={{ fontFamily: "sans-serif", padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
        <Text style={{ fontSize: "24px", fontWeight: "bold", color: "#111" }}>
          Welcome to GlobCom ERP
        </Text>
        <Text style={{ fontSize: "16px", color: "#333", lineHeight: "1.5" }}>
          You have been invited to join the enterprise platform as a <strong>{role.replace('_', ' ')}</strong>.
        </Text>
        <Section style={{ marginTop: "32px", marginBottom: "32px" }}>
          <Button 
            href={inviteLink}
            style={{ 
              padding: "12px 24px", 
              backgroundColor: "#000", 
              color: "#fff", 
              borderRadius: "6px", 
              textDecoration: "none",
              fontWeight: "bold"
            }}
          >
            Accept Invitation & Setup Account
          </Button>
        </Section>
        <Text style={{ color: "#666", fontSize: "14px", lineHeight: "1.5" }}>
          This secure link will expire in 48 hours. If you did not expect this invitation, you can safely ignore this email.
        </Text>
      </Container>
    </Html>
  );
}