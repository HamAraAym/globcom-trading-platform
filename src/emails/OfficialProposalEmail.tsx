import { Html, Body, Head, Heading, Hr, Container, Preview, Section, Text, Link } from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';

interface EmailTemplateProps {
  buyerName: string;
  senderName: string;
  senderRole: string;
  title: string;
  dispatchType: string;
  customMessage: string;
  openingText: string;
  displayPrice: string;
  quantity: string;
  unit: string;
  location: string;
  specs: string;
  attachedDocsCount: number;
}

export default function OfficialProposalEmail({ 
  buyerName, senderName, senderRole, title, dispatchType, 
  customMessage, openingText, displayPrice, quantity, unit, 
  location, specs, attachedDocsCount 
}: EmailTemplateProps) {
  return (
    <Html>
      <Head />
      <Preview>Official {dispatchType} from GlobCom International FZE</Preview>
      <Tailwind>
        <Body className="bg-slate-50 my-auto mx-auto font-sans px-2">
          <Container className="border border-slate-200 rounded-xl my-[40px] mx-auto p-0 max-w-[600px] bg-white overflow-hidden shadow-sm">
            
            {/* Header */}
            <Section className="bg-slate-900 px-8 py-6 border-b-4 border-indigo-500 text-left">
              <Heading className="text-white text-[24px] font-black tracking-tight m-0 p-0">GLOBCOM</Heading>
              <Text className="text-indigo-400 text-[10px] uppercase tracking-[0.2em] font-bold m-0 mt-1">International FZE</Text>
            </Section>

            {/* Body */}
            <Section className="px-8 py-6">
              <Text className="text-slate-800 text-[15px] font-medium m-0 mb-6">Dear {buyerName},</Text>

              {customMessage && (
                <Section className="mb-6 p-4 bg-slate-50 border-l-4 border-slate-300 rounded-r-lg">
                  <Text className="text-slate-700 text-[14px] italic font-medium m-0 whitespace-pre-wrap">"{customMessage}"</Text>
                </Section>
              )}

              <Text className="text-slate-700 text-[15px] leading-[24px] m-0 mb-6">{openingText}</Text>

              {/* Product Details Card */}
              <Section className="border border-slate-200 rounded-lg overflow-hidden mb-6">
                <div className="bg-indigo-600 h-1 w-full"></div>
                <div className="p-5">
                  <Heading className="text-slate-900 text-[18px] font-bold m-0 mb-4">{title}</Heading>
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ fontSize: '14px' }}>
                    <tr>
                      <td style={{ paddingBottom: '8px', color: '#64748b' }}><strong>Price:</strong> <span style={{ color: '#059669' }}>{displayPrice}</span></td>
                      <td style={{ paddingBottom: '8px', color: '#64748b' }}><strong>Volume:</strong> <span style={{ color: '#0f172a' }}>{quantity} {unit}</span></td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ color: '#64748b' }}><strong>Timeline/Location:</strong> <span style={{ color: '#0f172a' }}>{location}</span></td>
                    </tr>
                  </table>
                </div>
              </Section>

              {specs && (
                <Text className="text-slate-600 text-[14px] leading-[24px] whitespace-pre-wrap m-0 mb-6">{specs}</Text>
              )}

              {attachedDocsCount > 0 && (
                <Section className="mt-8 p-5 bg-slate-50 border border-slate-200 rounded-lg">
                  <Text className="text-slate-600 text-[12px] font-bold uppercase tracking-wider m-0 mb-2">Attached Official Documents</Text>
                  <Text className="text-slate-500 text-[12px] m-0">Please find {attachedDocsCount} official {dispatchType} PDF(s) attached securely to this email.</Text>
                </Section>
              )}
            </Section>

            {/* Footer / Signature */}
            <Section className="bg-slate-50 px-8 py-6 border-t border-slate-200">
              <Text className="text-slate-900 text-[14px] font-bold m-0 mb-1">{senderName}</Text>
              <Text className="text-slate-500 text-[11px] font-bold uppercase tracking-widest m-0 mb-4">{senderRole.replace("_", " ")}</Text>
              
              <Hr className="border-t border-slate-200 my-4" />
              
              <Text className="text-slate-500 text-[10px] leading-[16px] m-0">
                <strong>GLOBCOM INTERNATIONAL FZE</strong><br />
                P1-ELOB, Office No. E-10F-05<br />
                Hamriyah Free Zone, Sharjah (UAE), P.O. 50096<br />
                +971 50 5587858 | <Link href="mailto:sales@globcomfze.com" className="text-indigo-600 underline">sales@globcomfze.com</Link>
              </Text>
            </Section>

          </Container>
          <Text className="text-slate-400 text-[10px] text-center mt-6">
            This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed.
          </Text>
        </Body>
      </Tailwind>
    </Html>
  );
}