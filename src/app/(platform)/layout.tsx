import PageWrapper from "@/components/PageWrapper";

export default function PlatformLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // The PageWrapper handles the Sidebar, TopBar, and Login screen logic
    <PageWrapper>
      {children}
    </PageWrapper>
  );
}