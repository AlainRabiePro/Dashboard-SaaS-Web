import { NextRequest, NextResponse } from 'next/server';
import { getInvitationEmailTemplate } from '@/lib/email-service';

/**
 * POST /api/email/send-invitation
 * Envoie un email d'invitation de collaborateur
 */
export async function POST(request: NextRequest) {
  try {
    const { email, senderName, senderEmail, invitationLink } = await request.json();

    if (!email || !senderName || !invitationLink) {
      return NextResponse.json(
        { error: 'Missing required fields: email, senderName, invitationLink' },
        { status: 400 }
      );
    }

    // Obtenir le template
    const { subject, html, text } = getInvitationEmailTemplate(senderName, invitationLink);

    // Utiliser Resend API si disponible
    const resendApiKey = process.env.RESEND_API_KEY;
    
    if (resendApiKey) {
      return await sendViaResend(resendApiKey, email, subject, html, text);
    }

    // Fallback: envoyer via un endpoint email générique (ou Nodemailer)
    console.warn('[EMAIL] Aucun provider configuré. Email ne sera pas envoyé.');
    console.log('[EMAIL] Template préparé:', {
      to: email,
      subject,
      htmlLength: html.length,
      textLength: text.length,
    });

    return NextResponse.json({
      success: true,
      message: 'Email template prepared (no provider configured)',
    });
  } catch (error: any) {
    console.error('[EMAIL] Error sending invitation:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}

/**
 * Envoie via Resend (https://resend.com/)
 */
async function sendViaResend(
  apiKey: string,
  email: string,
  subject: string,
  html: string,
  text: string
): Promise<NextResponse> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'invitations@saasflow.app',
        to: email,
        subject,
        html,
        text,
        reply_to: 'support@saasflow.app',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('[RESEND] Error:', error);
      return NextResponse.json(
        { error: 'Failed to send email via Resend' },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[RESEND] Email sent successfully:', data.id);

    return NextResponse.json({
      success: true,
      message: 'Email sent successfully',
      messageId: data.id,
    });
  } catch (error: any) {
    console.error('[RESEND] Exception:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to send email' },
      { status: 500 }
    );
  }
}
