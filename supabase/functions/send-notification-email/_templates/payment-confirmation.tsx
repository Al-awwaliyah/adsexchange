import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
} from 'https://esm.sh/@react-email/components@0.0.22'
import * as React from 'https://esm.sh/react@18.3.1'

interface PaymentConfirmationEmailProps {
  userName: string
  amount: string
  transactionType: string
  dashboardUrl: string
}

export const PaymentConfirmationEmail = ({
  userName,
  amount,
  transactionType,
  dashboardUrl,
}: PaymentConfirmationEmailProps) => (
  <Html>
    <Head />
    <Preview>Payment confirmation - {amount}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Payment Confirmed 💰</Heading>
        <Text style={text}>Hi {userName},</Text>
        <Text style={text}>
          Your {transactionType} of <strong>{amount}</strong> has been processed successfully.
        </Text>
        <Link
          href={dashboardUrl}
          target="_blank"
          style={{
            ...link,
            display: 'inline-block',
            marginTop: '16px',
            marginBottom: '16px',
            padding: '12px 24px',
            backgroundColor: '#0ea5e9',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
          }}
        >
          View Transaction History
        </Link>
        <Text style={text}>
          Thank you for using AdConnect!
        </Text>
        <Text style={footer}>
          AdConnect - Your Ad Promotion Platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default PaymentConfirmationEmail

const main = {
  backgroundColor: '#ffffff',
}

const container = {
  paddingLeft: '12px',
  paddingRight: '12px',
  margin: '0 auto',
}

const h1 = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
}

const link = {
  color: '#0ea5e9',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  textDecoration: 'underline',
}

const text = {
  color: '#333',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
  margin: '24px 0',
}

const footer = {
  color: '#898989',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '12px',
  lineHeight: '22px',
  marginTop: '12px',
  marginBottom: '24px',
}
