import sgMail from '@sendgrid/mail';

// SendGrid configuration
const apiKey = process.env.SENDGRID_API_KEY || '';
const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'noreply@gearbox.app';
const fromName = process.env.SENDGRID_FROM_NAME || 'Gearbox Fintech';

if (apiKey) {
  sgMail.setApiKey(apiKey);
}

export interface EmailTemplate {
  type: 'booking_confirmation' | 'booking_reminder' | 'dvi_ready' | 'invoice_ready' | 'service_reminder' | 'magic_link';
  variables: Record<string, string>;
}

interface EmailContent {
  subject: string;
  html: string;
  text: string;
}

function getEmailContent(template: EmailTemplate): EmailContent {
  const { type, variables } = template;
  
  switch (type) {
    case 'booking_confirmation':
      return {
        subject: `Booking Confirmed - ${variables.shopName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Booking Confirmed ✓</h2>
            <p>Hi ${variables.customerName},</p>
            <p>Your booking at <strong>${variables.shopName}</strong> has been confirmed.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Date:</strong> ${variables.date}</p>
              <p style="margin: 5px 0;"><strong>Time:</strong> ${variables.time}</p>
              <p style="margin: 5px 0;"><strong>Service:</strong> ${variables.service}</p>
              ${variables.vehicleRego ? `<p style="margin: 5px 0;"><strong>Vehicle:</strong> ${variables.vehicleRego}</p>` : ''}
            </div>
            <p>We'll send you a reminder the day before your appointment.</p>
            <p>See you soon!<br>${variables.shopName}</p>
          </div>
        `,
        text: `Hi ${variables.customerName},\n\nYour booking at ${variables.shopName} has been confirmed.\n\nDate: ${variables.date}\nTime: ${variables.time}\nService: ${variables.service}\n\nSee you soon!\n${variables.shopName}`,
      };
      
    case 'booking_reminder':
      return {
        subject: `Reminder: Appointment Tomorrow at ${variables.time}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Appointment Reminder</h2>
            <p>Hi ${variables.customerName},</p>
            <p>This is a friendly reminder that your appointment at <strong>${variables.shopName}</strong> is tomorrow.</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 5px 0;"><strong>Tomorrow at ${variables.time}</strong></p>
              <p style="margin: 5px 0;">Service: ${variables.service}</p>
            </div>
            <p>If you need to reschedule, please call us at ${variables.shopPhone || 'the shop'}.</p>
            <p>Looking forward to seeing you!<br>${variables.shopName}</p>
          </div>
        `,
        text: `Hi ${variables.customerName},\n\nReminder: Your appointment at ${variables.shopName} is tomorrow at ${variables.time} for ${variables.service}.\n\nSee you then!\n${variables.shopName}`,
      };
      
    case 'dvi_ready':
      return {
        subject: `Vehicle Inspection Ready - ${variables.vehicleRego}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Your Vehicle Inspection is Ready</h2>
            <p>Hi ${variables.customerName},</p>
            <p>We've completed the digital inspection of your vehicle <strong>${variables.vehicleRego}</strong>.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p>Our technician has identified some items that may need attention. You can view photos and videos of the inspection online.</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.link}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View Inspection & Approve Repairs</a>
            </div>
            <p>If you have any questions, please don't hesitate to call us.</p>
            <p>Best regards,<br>${variables.shopName}</p>
          </div>
        `,
        text: `Hi ${variables.customerName},\n\nYour vehicle inspection for ${variables.vehicleRego} is ready to view.\n\nView and approve repairs here: ${variables.link}\n\nBest regards,\n${variables.shopName}`,
      };
      
    case 'invoice_ready':
      return {
        subject: `Invoice #${variables.invoiceNumber} - ${variables.amount}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Invoice Ready</h2>
            <p>Hi ${variables.customerName},</p>
            <p>Your invoice is ready for payment.</p>
            <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
              <p style="margin: 5px 0;"><strong>Invoice Number:</strong> ${variables.invoiceNumber}</p>
              <p style="margin: 5px 0;"><strong>Amount:</strong> ${variables.amount}</p>
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${variables.dueDate}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.link}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">View & Pay Invoice</a>
            </div>
            <p>Thank you for your business!</p>
            <p>Best regards,<br>${variables.shopName}</p>
          </div>
        `,
        text: `Hi ${variables.customerName},\n\nYour invoice #${variables.invoiceNumber} for ${variables.amount} is ready.\n\nView and pay: ${variables.link}\n\nThank you!\n${variables.shopName}`,
      };
      
    case 'service_reminder':
      return {
        subject: `Service Reminder - ${variables.vehicleRego} ${variables.serviceType} Due`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #f59e0b;">Service Reminder</h2>
            <p>Hi ${variables.customerName},</p>
            <p>Your vehicle <strong>${variables.vehicleRego}</strong> is due for ${variables.serviceType}.</p>
            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #f59e0b;">
              <p style="margin: 5px 0;"><strong>Due Date:</strong> ${variables.dueDate}</p>
              <p style="margin: 5px 0;"><strong>Service Type:</strong> ${variables.serviceType}</p>
            </div>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.link}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Book Appointment</a>
            </div>
            <p>Book now to avoid any inconvenience!</p>
            <p>Best regards,<br>${variables.shopName}</p>
          </div>
        `,
        text: `Hi ${variables.customerName},\n\nYour ${variables.vehicleRego} is due for ${variables.serviceType} on ${variables.dueDate}.\n\nBook now: ${variables.link}\n\nBest regards,\n${variables.shopName}`,
      };
      
    case 'magic_link':
      return {
        subject: `Login to ${variables.shopName} Customer Portal`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Customer Portal Login</h2>
            <p>Hi ${variables.customerName},</p>
            <p>Click the button below to securely log in to your customer portal.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${variables.link}" style="background: #2563eb; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: bold;">Login to Portal</a>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This link will expire in 15 minutes for security reasons.</p>
            <p style="color: #6b7280; font-size: 14px;">If you didn't request this login, you can safely ignore this email.</p>
          </div>
        `,
        text: `Hi ${variables.customerName},\n\nClick here to log in to your customer portal: ${variables.link}\n\nThis link expires in 15 minutes.`,
      };
      
    default:
      throw new Error(`Unknown email template type: ${type}`);
  }
}

export async function sendEmail(
  to: string,
  template: EmailTemplate
): Promise<{ success: boolean; messageId?: string; error?: string }> {
  if (!apiKey) {
    console.warn('SendGrid not configured. Email would be sent to:', to);
    return { success: false, error: 'SendGrid not configured' };
  }

  try {
    const content = getEmailContent(template);
    
    const msg = {
      to,
      from: {
        email: fromEmail,
        name: fromName,
      },
      subject: content.subject,
      text: content.text,
      html: content.html,
    };

    const [response] = await sgMail.send(msg);
    
    console.log(`✅ Email sent to ${to}: ${response.headers['x-message-id']}`);
    return { success: true, messageId: response.headers['x-message-id'] as string };
  } catch (error: any) {
    console.error('❌ Failed to send email:', error.message);
    return { success: false, error: error.message };
  }
}

// Batch email sending
export async function sendBatchEmail(
  messages: Array<{ to: string; template: EmailTemplate }>
): Promise<Array<{ to: string; success: boolean; messageId?: string; error?: string }>> {
  const results = [];
  
  for (const msg of messages) {
    const result = await sendEmail(msg.to, msg.template);
    results.push({ to: msg.to, ...result });
  }
  
  return results;
}
