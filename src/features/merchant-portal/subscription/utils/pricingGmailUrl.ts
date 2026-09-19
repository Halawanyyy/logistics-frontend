export type BuildPricingGmailUrlInput = {
  recipient: string
  planName: string
  merchantName?: string
  merchantEmail?: string
}

export function buildPricingGmailUrl({
  recipient,
  planName,
  merchantName,
  merchantEmail,
}: BuildPricingGmailUrlInput): string {
  const subject = `Pricing inquiry - ${planName}`

  const body = [
    'Hello,',
    '',
    `I am interested in the ${planName} pricing plan.`,
    merchantName ? `Merchant: ${merchantName}` : null,
    merchantEmail ? `Account email: ${merchantEmail}` : null,
    '',
    'Please contact me with more information about pricing and onboarding.',
  ]
    .filter(Boolean)
    .join('\n')

  const params = new URLSearchParams({
    view: 'cm',
    fs: '1',
    to: recipient,
    su: subject,
    body,
  })

  return `https://mail.google.com/mail/?${params.toString()}`
}
