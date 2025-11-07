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

export const NINApprovedEmail = () => (
  <Html>
    <Head />
    <Preview>NIN Verification Approved - AdsExchange</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>NIN Verification Approved ✓</Heading>
        <Text style={text}>
          Congratulations! Your NIN verification has been approved.
        </Text>
        <Text style={text}>
          Your account is now fully verified and you can access all features on AdsExchange.
        </Text>
        <Text style={text}>
          Thank you for completing the verification process!
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

export default NINApprovedEmail;
