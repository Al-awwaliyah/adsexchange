import React from "https://esm.sh/react@18.2.0";
import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Text,
  Preview,
} from "https://esm.sh/@react-email/components@0.0.22";

interface NINSubmittedEmailProps {
  firstName: string;
  lastName: string;
}

export const NINSubmittedEmail = ({ firstName, lastName }: NINSubmittedEmailProps) => {
  const fullName = `${firstName || ''} ${lastName || ''}`.trim();
  
  return (
    <Html>
      <Head />
      <Preview>NIN Verification Submitted - AdsExchange</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>NIN Verification Submitted</Heading>
          <Text style={text}>
            Hello {fullName || 'User'},
          </Text>
          <Text style={text}>
            Your NIN verification has been successfully submitted and is now pending review by our admin team.
          </Text>
          <Text style={text}>
            You will receive another email once your verification has been reviewed.
          </Text>
          <Text style={text}>
            Thank you for using AdsExchange!
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

const main = {
  backgroundColor: "#f6f9fc",
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px 0 48px",
  marginBottom: "64px",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  margin: "40px 0",
  padding: "0",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "26px",
};

export default NINSubmittedEmail;
