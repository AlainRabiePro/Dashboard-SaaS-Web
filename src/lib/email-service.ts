/**
 * Service d'envoi d'emails pour les invitations et notifications
 */

/**
 * Envoie un email d'invitation via Resend
 */
export async function sendInvitationEmailViaResend(
  email: string,
  senderName: string,
  invitationLink: string
): Promise<boolean> {
  try {
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (!resendApiKey) {
      console.warn('[EMAIL] RESEND_API_KEY not configured. Email template prepared but not sent.');
      return false;
    }

    const { subject, html, text } = getInvitationEmailTemplate(senderName, invitationLink);

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
  senderName: string,
  invitationLink: string
): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = `${senderName} vous invite à rejoindre SaasFlow`;

  const html = `
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <style>
      body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
      .container { max-width: 600px; margin: 0 auto; padding: 20px; }
      .header { text-align: center; margin-bottom: 30px; }
      .content { color: #333; line-height: 1.6; }
      .button { display: inline-block; background: #0ea5e9; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin: 20px 0; }
      .footer { color: #888; font-size: 12px; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <div class="header">
        <h1>Vous êtes invité à SaasFlow</h1>
      </div>
      
      <div class="content">
        <p>Bonjour,</p>
        
        <p><strong>${senderName}</strong> vous a invité à rejoindre <strong>SaasFlow</strong>, une plateforme de gestion de sites web moderne.</p>
        
        <p>Cliquez sur le bouton ci-dessous pour accepter l'invitation et créer votre compte :</p>
        
        <div style="text-align: center;">
          <a href="${invitationLink}" class="button">Accepter l'invitation</a>
        </div>
        
        <p>Ou copiez ce lien dans votre navigateur :</p>
        <p style="word-break: break-all; font-size: 12px; color: #666;">${invitationLink}</p>
        
        <p>Cette invitation expire dans 24 heures.</p>
        
        <p>Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.</p>
      </div>
      
      <div class="footer">
        <p>© 2026 SaasFlow. Tous droits réservés.</p>
      </div>
    </div>
  </body>
</html>
  `;

  const text = `
Vous êtes invité à SaasFlow

Bonjour,

${senderName} vous a invité à rejoindre SaasFlow, une plateforme de gestion de sites web moderne.

Cliquez sur le lien ci-dessous pour accepter l'invitation et créer votre compte :

${invitationLink}

Cette invitation expire dans 24 heures.

Si vous n'avez pas demandé cette invitation, vous pouvez ignorer cet email.

© 2026 SaasFlow. Tous droits réservés.
  `;

  return { subject, html, text };
}
