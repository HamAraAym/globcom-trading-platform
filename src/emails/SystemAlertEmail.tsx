import {
  Html,
  Head,
  Body,
  Container,
  Section,
  Text,
  Button,
  Img,
  Tailwind,
} from "@react-email/components";

interface SystemAlertEmailProps {
  userName: string;
  title: string;
  message: string;
  link?: string;
  companyName?: string;
}

export default function SystemAlertEmail({
  userName = "Team Member",
  title = "New System Alert",
  message = "You have a new notification waiting for you in the workspace.",
  link,
  companyName = "GlobCom International",
}: SystemAlertEmailProps) {
  return (
    <Tailwind>
      <Html>
        <Head />
        <Body className="bg-slate-50 font-sans">
          <Container className="mx-auto py-10 px-4 max-w-[600px]">
            {/* Header */}
            <Section className="bg-slate-950 p-6 rounded-t-xl text-center">
              <Text className="text-white text-xl font-bold tracking-tight m-0">
                {companyName} Workspace
              </Text>
            </Section>

            {/* Body */}
            <Section className="bg-white border-x border-b border-slate-200 p-8 rounded-b-xl shadow-sm">
              <Text className="text-slate-500 text-sm font-medium mb-4">
                Hello {userName},
              </Text>
              
              <Text className="text-slate-900 text-lg font-bold mb-2">
                {title}
              </Text>
              
              <Text className="text-slate-600 text-base leading-relaxed mb-6">
                {message}
              </Text>

              {link && (
                <Section className="text-center mt-8 mb-4">
                  <Button
                    href={link}
                    className="bg-indigo-600 text-white px-6 py-3 rounded-lg font-bold text-sm text-center block w-full sm:inline-block sm:w-auto"
                  >
                    View in Workspace
                  </Button>
                </Section>
              )}

              <Text className="text-slate-400 text-xs mt-8 text-center border-t border-slate-100 pt-6">
                This is an automated operational alert. Please do not reply directly to this email.
              </Text>
            </Section>
          </Container>
        </Body>
      </Html>
    </Tailwind>
  );
}