import twilio from 'twilio';

// Twilio configuration from environment variables
const accountSid = process.env.TWILIO_ACCOUNT_SID || '';
const authToken = process.env.TWILIO_AUTH_TOKEN || '';
const fromNumber = process.env.TWILIO_PHONE_NUMBER || '';

const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

export interface SMSTemplate {
  type: 'booking_confirmation' | 'booking_reminder' | 'dvi_ready' | 'invoice_ready' | 'service_reminder' | 'magic_link';
  variables: Record<string, string>;
}

const templates: Record<SMSTemplate['type'], string> = {
  booking_confirmation: 'Hi {customerName}! Your booking at {shopName} is confirmed for {date} at {time}. Service: {service}. Reply CANCEL to cancel.',
  booking_reminder: 'Reminder: Your appointment at {shopName} is tomorrow at {time} for {service}. See you then!',
  dvi_ready: 'Hi {customerName}, your vehicle inspection is ready to view. Approve repairs here: {link}',
  invoice_ready: 'Your invoice #{invoiceNumber} for ${amount} is ready. View and pay: {link}',
  service_reminder: 'Hi {customerName}, your {vehicleRego} is due for {serviceType} on {dueDate}. Book now: {link}',
  magic_link: 'Your Gearbox login link: {link}. This link expires in 15 minutes.',
};

function renderTemplate(template: string, variables: Record<string, string>): string {
  let rendered = template;
  for (const [key, value] of Object.entries(variables)) {
    rendered = rendered.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return rendered;
}

export async function sendSMS(
  to: string,
  template: SMSTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!client) {
    console.warn('Twilio not configured. SMS would be sent to:', to);
    return { success: false, error: 'Twilio not configured' };
  }

  try {
    const body = renderTemplate(templates[template.type], template.variables);
    
    // Ensure phone number is in E.164 format
    const formattedTo = to.startsWith('+') ? to : `+${to}`;
    
    const message = await client.messages.create({
      body,
      from: fromNumber,
      to: formattedTo,
    });

    console.log(`✅ SMS sent to ${to}: ${message.sid}`);
    return { success: true, messageId: message.sid };
  } catch (error: any) {
    console.error('❌ Failed to send SMS:', error.message);
    return { success: false, error: error.message };
  }
}

// Batch SMS sending with rate limiting
export async function sendBatchSMS(
  messages: Array<{ to: string; template: SMSTemplate }>
): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
  const results = [];
  
  for (const msg of messages) {
    const result = await sendSMS(msg.to, msg.template);
    results.push({ to: msg.to, ...result });
    
    // Rate limiting: 1 message per second (Twilio free tier limit)
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  return results;
}
