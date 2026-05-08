import { 
  Html, Body, Head, Heading, Hr, Container, Preview, 
  Section, Text, Link, Img, Button 
} from '@react-email/components';
import { Tailwind } from '@react-email/tailwind';
import * as React from "react";

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
  dealLink: string; // NEW: The secure client portal link
}

export default function OfficialProposalEmail({ 
  buyerName, senderName, senderRole, title, dispatchType, 
  customMessage, openingText, displayPrice, quantity, unit, 
  location, specs, attachedDocsCount, dealLink 
}: EmailTemplateProps) {
  const previewText = `Official ${dispatchType} from GlobCom: ${title}`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Tailwind>
        <Body className="bg-slate-100 my-auto mx-auto font-sans px-2 py-8">
          <Container className="border border-slate-200 rounded-2xl mx-auto p-0 max-w-[600px] bg-white overflow-hidden shadow-xl">
            
            {/* 1. CORPORATE HEADER */}
            <Section className="bg-slate-900 px-8 py-8 text-center border-b-4 border-indigo-500">
              {/* NOTE: Replace this placeholder with your actual hosted logo URL later */}
              <Img
                src="https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Check_green_icon.svg/1200px-Check_green_icon.svg.png" 
                width="40"
                height="40"
                alt="GlobCom Logo Placeholder"
                className="mx-auto mb-4 invert opacity-90"
              />
              <Heading className="text-white text-[24px] font-black tracking-widest m-0 p-0 uppercase">
                GLOBCOM
              </Heading>
              <Text className="text-indigo-400 text-[10px] uppercase tracking-[0.3em] font-bold m-0 mt-1">
                International FZE
              </Text>
            </Section>

            {/* 2. MAIN BODY */}
            <Section className="px-8 py-8">
              <Text className="text-slate-800 text-[16px] leading-[24px] font-medium m-0 mb-6">
                Dear {buyerName},
              </Text>

              {customMessage && (
                <Section className="mb-6 p-4 bg-indigo-50 border-l-4 border-indigo-500 rounded-r-lg">
                  <Text className="text-indigo-900 text-[14px] italic font-medium m-0 whitespace-pre-wrap">
                    "{customMessage}"
                  </Text>
                </Section>
              )}

              <Text className="text-slate-700 text-[15px] leading-[24px] m-0 mb-8">
                {openingText}
              </Text>

              {/* 3. DEAL SUMMARY BOX */}
              <Section className="border border-slate-200 rounded-xl overflow-hidden mb-8 bg-slate-50">
                <div className="bg-indigo-600 h-1 w-full"></div>
                <div className="p-6">
                  <Text className="text-indigo-600 text-[10px] font-black uppercase tracking-widest m-0 mb-2">
                    Commodity Summary
                  </Text>
                  <Heading className="text-slate-900 text-[20px] font-bold m-0 mb-5 leading-tight">
                    {title}
                  </Heading>
                  
                  <table width="100%" cellPadding="0" cellSpacing="0" style={{ fontSize: '14px' }}>
                    <tr>
                      <td style={{ paddingBottom: '12px', color: '#64748b' }}>
                        <strong>Target Price:</strong> <span style={{ color: '#059669', fontWeight: 'bold' }}>{displayPrice}</span>
                      </td>
                      <td style={{ paddingBottom: '12px', color: '#64748b' }}>
                        <strong>Volume:</strong> <span style={{ color: '#0f172a', fontWeight: 'bold' }}>{quantity} {unit}</span>
                      </td>
                    </tr>
                    <tr>
                      <td colSpan={2} style={{ paddingBottom: '12px', color: '#64748b' }}>
                        <strong>Logistics:</strong> <span style={{ color: '#0f172a' }}>{location}</span>
                      </td>
                    </tr>
                  </table>
                  
                  {specs && (
                    <Text className="text-slate-600 text-[13px] leading-[20px] whitespace-pre-wrap m-0 mt-2 pt-4 border-t border-slate-200">
                      {specs}
                    </Text>
                  )}
                </div>
              </Section>

              {/* 4. CALL TO ACTION BUTTON (SECURE PORTAL) */}
              <Section className="text-center mb-8">
                <Button
                  href={dealLink}
                  className="bg-indigo-600 text-white font-bold px-8 py-4 rounded-xl text-[16px] shadow-md hover:bg-indigo-700 w-full sm:w-auto"
                >
                  Review Official Proposal
                </Button>
                <Text className="text-slate-500 text-[12px] mt-4 mb-0">
                  Click the secure link above to view full technical specifications, trade logistics, and download {attachedDocsCount > 0 ? `the ${attachedDocsCount} attached official document(s)` : "the official documents"}.
                </Text>
              </Section>
            </Section>

            {/* 5. FOOTER & SIGNATURE */}
            <Section className="bg-slate-50 px-8 py-8 border-t border-slate-200">
              <Text className="text-slate-900 text-[16px] font-bold m-0 mb-1">{senderName}</Text>
              <Text className="text-slate-500 text-[12px] font-bold uppercase tracking-widest m-0 mb-6">{senderRole.replace("_", " ")}</Text>
              
              <Text className="text-slate-500 text-[11px] leading-[18px] m-0 mb-6">
                <strong>GLOBCOM INTERNATIONAL FZE</strong><br />
                P1-ELOB, Office No. E-10F-05<br />
                Hamriyah Free Zone, Sharjah (UAE), P.O. 50096<br />
                +971 50 5587858 | <Link href="mailto:sales@globcomfze.com" className="text-indigo-600 underline">sales@globcomfze.com</Link>
              </Text>

              <Hr className="border-t border-slate-200 my-6" />

              {/* 6. STRICT LEGAL DISCLAIMER */}
              <Text className="text-slate-400 text-[9px] leading-[14px] text-justify m-0">
                <strong>CONFIDENTIALITY NOTICE:</strong> This email and any attachments are confidential and intended solely for the use of the individual or entity to whom they are addressed. If you have received this email in error, please notify the sender immediately and delete this email from your system. 
                <br /><br />
                Prices, availability, and terms are subject to market fluctuations and prior sale. This email does not constitute a legally binding contract until a definitive agreement has been executed by authorized representatives of both parties.
                <br /><br />
                © {new Date().getFullYear()} GlobCom International FZE. All rights reserved.
              </Text>
            </Section>

          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
}