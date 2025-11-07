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

interface NINRejectedEmailProps {
  reason: string;
}

export const NINRejectedEmail = ({ reason }: NINRejectedEmailProps) => (
  <Html>
    <Head />
    <Preview>NIN Verification Rejected - AdsExchange</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>NIN Verification Rejected</Heading>
        <Text style={text}>
          Unfortunately, your NIN verification has been rejected.
        </Text>
        <Text style={text}>
          <strong>Reason:</strong> {reason}
        </Text>
        <Text style={text}>
          Please review the reason above and submit a new verification request with the correct information.
        </Text>
        <Text style={text}>
          If you have any questions, please contact our support team.
        </Text>
      </Container>
    </Body>
  </Html>
);

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

export default NINRejectedEmail;
