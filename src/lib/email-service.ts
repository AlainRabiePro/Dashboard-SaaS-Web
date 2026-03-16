/**
 * Service d'envoi d'emails pour les invitations et notifications
 */

/**
 * Envoie un email d'invitation via Resend
 */
export async function sendInvitationEmailViaResend(
  email: string,
  senderEmail: string,
  projectName: string,
  invitationLink: string
): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('[EMAIL] RESEND_API_KEY not configured. Email template prepared but not sent.');
      return false;
    }

    const { subject, html, text } = getInvitationEmailTemplate(senderEmail, projectName, invitationLink);

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'onboarding@resend.dev',
        to: email,
        subject,
        html,
        text,
        reply_to: 'support@saasflow.app',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[RESEND] Error sending email:', error);
      return false;
    }

    const data = await response.json();
    console.log('[RESEND] Invitation email sent successfully:', data.id);
    return true;
  } catch (error) {
    console.error('[RESEND] Exception sending email:', error);
    return false;
  }
}

/**
 * Format pour template d'email d'invitation
 */
export function getInvitationEmailTemplate(
  senderEmail: string,
  projectName: string,
  invitationLink: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const senderName = senderEmail.split('@')[0];
  const subject = `${senderName} vous invite à rejoindre "${projectName}" sur SaasFlow`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; line-height: 1.6; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9fafb; }
      .email-wrapper { background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
      .header { background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; padding: 40px 20px; text-align: center; }
      .header h1 { margin: 0; font-size: 28px; font-weight: bold; }
      .content { padding: 40px 20px; }
      .content p { margin: 15px 0; color: #333; }
      .project-name { font-weight: bold; color: #0ea5e9; }
      .button-container { text-align: center; margin: 30px 0; }
      .button { display: inline-block; background: #0ea5e9; color: white; padding: 14px 32px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 16px; }
      .button:hover { background: #0284c7; }
      .link-section { margin: 20px 0; padding: 15px; background-color: #f3f4f6; border-radius: 6px; }
      .link-label { font-size: 12px; color: #666; text-transform: uppercase; font-weight: bold; margin-bottom: 8px; }
      .link-value { word-break: break-all; font-size: 12px; color: #0ea5e9; font-family: monospace; }
      .footer { background-color: #f9fafb; padding: 20px; border-top: 1px solid #e5e7eb; color: #666; font-size: 12px; text-align: center; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="email-wrapper">
        <div class="header">
          <h1>✉️ Vous êtes invité!</h1>
        </div>
        
        <div class="content">
          <p>Bonjour,</p>
          
          <p><strong>${senderName}</strong> vous invite à rejoindre le projet <span class="project-name">"${projectName}"</span> sur SaasFlow.</p>
          
          <p>Rejoignez l'équipe en cliquant sur le bouton ci-dessous pour créer votre compte et commencer à collaborer :</p>
          
          <div class="button-container">
            <a href="${invitationLink}" class="button">Accepter l'invitation</a>
          </div>
          
          <p>Ou copiez ce lien dans votre navigateur :</p>
          
          <div class="link-section">
            <div class="link-label">Lien d'invitation</div>
            <div class="link-value">${invitationLink}</div>
          </div>
          
          <p style="color: #666; font-size: 14px;">
            <strong>À noter :</strong> Ce lien d'invitation peut être utilisé par plusieurs personnes et expirera une fois que la limite du plan d'abonnement sera atteinte.
          </p>
        </div>
        
        <div class="footer">
          <p>Vous avez reçu cet email car quelqu'un vous a invité à rejoindre un projet sur SaasFlow.</p>
          <p>© SaasFlow. Tous droits réservés.</p>
        </div>
      </div>
    </div>
  </body>
</html>
`;

  const text = `
Vous êtes invité!

Bonjour,

${senderName} vous invite à rejoindre le projet "${projectName}" sur SaasFlow.

Lien d'invitation:
${invitationLink}

Collez ce lien dans votre navigateur pour créer votre compte et rejoindre le projet.

À noter: Ce lien d'invitation peut être utilisé par plusieurs personnes et expirera une fois que la limite du plan d'abonnement sera atteinte.

© SaasFlow
`;

  return {
    subject,
    html,
    text,
  };
}
