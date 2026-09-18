import { NextRequest, NextResponse } from 'next/server'

/**
 * Q77: In-World Contact — "Send a Letter to Abdulrahman"
 * - Validates incoming letter payload.
 * - In production, can forward to serverless email webhook (Resend/Formspree/Postmark).
 * - Returns clean brutalist confirmation response.
 */

export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, subject, message } = body || {}

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Please provide your name.' },
        { status: 400 }
      )
    }

    if (
      !email ||
      typeof email !== 'string' ||
      !email.includes('@') ||
      !email.includes('.')
    ) {
      return NextResponse.json(
        { error: 'Please provide a valid return email address.' },
        { status: 400 }
      )
    }

    if (!message || typeof message !== 'string' || message.trim().length < 5) {
      return NextResponse.json(
        { error: 'Message must be at least 5 characters.' },
        { status: 400 }
      )
    }

    const letterRecord = {
      name: name.trim(),
      email: email.trim(),
      subject: (subject || 'Inquiry from BabWorld').trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    // Optional external webhook integration (Resend / Formspree) if configured
    if (process.env.CONTACT_WEBHOOK_URL) {
      try {
        await fetch(process.env.CONTACT_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(letterRecord),
        })
      } catch (err) {
        console.error('[Contact Webhook Error]', err)
      }
    }

    console.log('[Contact Letter Received]', {
      from: `${letterRecord.name} <${letterRecord.email}>`,
      subject: letterRecord.subject,
      length: letterRecord.message.length,
    })

    return NextResponse.json({
      success: true,
      message:
        "Letter sealed and placed on Abdulrahman's desk. Thank you for writing.",
    })
  } catch {
    return NextResponse.json(
      { error: 'Failed to deliver letter. Please try again.' },
      { status: 500 }
    )
  }
}
