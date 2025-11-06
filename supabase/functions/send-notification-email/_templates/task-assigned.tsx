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

interface TaskAssignedEmailProps {
  promoterName: string
  campaignTitle: string
  payout: string
  taskUrl: string
}

export const TaskAssignedEmail = ({
  promoterName,
  campaignTitle,
  payout,
  taskUrl,
}: TaskAssignedEmailProps) => (
  <Html>
    <Head />
    <Preview>New task assigned: {campaignTitle}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Task Assigned!</Heading>
        <Text style={text}>Hi {promoterName},</Text>
        <Text style={text}>
          You've successfully claimed a new task: <strong>{campaignTitle}</strong>
        </Text>
        <Text style={text}>
          Payout: <strong>{payout}</strong>
        </Text>
        <Link
          href={taskUrl}
          target="_blank"
          style={buttonLink}
        >
          View Task Details
        </Link>
        <Text style={text}>
          Complete the task requirements and submit your proof to earn your payout.
        </Text>
        <Text style={footer}>
          AdConnect - Your Ad Promotion Platform
        </Text>
      </Container>
    </Body>
  </Html>
)

export default TaskAssignedEmail

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

const buttonLink = {
  display: 'inline-block',
  marginTop: '16px',
  marginBottom: '16px',
  padding: '12px 24px',
  backgroundColor: '#0ea5e9',
  color: '#ffffff',
  textDecoration: 'none',
  borderRadius: '6px',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
  fontSize: '14px',
}
