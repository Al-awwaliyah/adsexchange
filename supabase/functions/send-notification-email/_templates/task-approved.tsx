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

interface TaskApprovedEmailProps {
  promoterName: string
  campaignTitle: string
  payout: string
  dashboardUrl: string
}

export const TaskApprovedEmail = ({
  promoterName,
  campaignTitle,
  payout,
  dashboardUrl,
}: TaskApprovedEmailProps) => (
  <Html>
    <Head />
    <Preview>Task approved: {campaignTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Task Approved! 🎉</Heading>
        <Text style={text}>Hi {promoterName},</Text>
        <Text style={text}>
          Great news! Your task submission for <strong>{campaignTitle}</strong> has been approved.
        </Text>
        <Text style={text}>
          Payout of <strong>{payout}</strong> has been credited to your wallet.
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
            backgroundColor: '#10b981',
            color: '#ffffff',
            textDecoration: 'none',
            borderRadius: '6px',
          }}
        >
          View Your Wallet
        </Link>
        <Text style={text}>
          Keep up the great work!
        </Text>
        <Text style={footer}>
          AdConnect - Your Ad Promotion Platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TaskApprovedEmail

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
  color: '#10b981',
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
