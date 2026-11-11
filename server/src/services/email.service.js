import nodemailer from 'nodemailer'
import { config } from '../config/env.js'
import logger from '../utils/logger.js'

let transporter = null

export const getTransporter = async () => {
  if (transporter) return transporter

  if (config.smtpHost && config.smtpUser) {
    transporter = nodemailer.createTransport({
      host: config.smtpHost,
      port: config.smtpPort,
      secure: config.smtpPort === 465,
      auth: {
        user: config.smtpUser,
        pass: config.smtpPass,
      },
    })
  } else {
    // Development fallback: ethereal or mock transporter
    transporter = nodemailer.createTransport({
      streamTransport: true,
      newline: 'unix',
      buffer: true,
    })
  }

  return transporter
}

export const setTransporter = (mockTransporter) => {
  transporter = mockTransporter
}

export const sendBookingConfirmationEmail = async (booking, recipientEmail) => {
  if (!recipientEmail) {
    logger.warn('No recipient email provided for booking confirmation')
    return
  }

  try {
    const transport = await getTransporter()
    const tripUrl = `${config.clientUrl}/trips/${booking.id}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background-color: #3b82f6; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Booking Confirmed!</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
          <p style="font-size: 16px;">Hello <strong>${booking.name}</strong>,</p>
          <p>Your trip has been booked successfully. Here is your trip summary:</p>
          
          <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Booking Reference:</strong> <span style="color: #2563eb; font-weight: bold;">${booking.reference}</span></p>
            <p style="margin: 8px 0;"><strong>Route:</strong> ${booking.startLocation} &rarr; ${booking.endLocation}</p>
            <p style="margin: 8px 0;"><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate}</p>
            <p style="margin: 8px 0;"><strong>Guests:</strong> ${booking.adults} Adults, ${booking.children} Children, ${booking.infants} Infants</p>
            <p style="margin: 8px 0;"><strong>Total Price:</strong> ₹${booking.priceTotal} ${booking.currency}</p>
            <p style="margin: 8px 0;"><strong>Status:</strong> ${booking.status}</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${tripUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View My Trip Details
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Thank you for traveling with Travel Trip. If you have any questions, please reply to this email.
          </p>
        </div>
      </div>
    `

    const info = await transport.sendMail({
      from: config.mailFrom,
      to: recipientEmail,
      subject: `Trip Confirmed: ${booking.reference} (${booking.startLocation} to ${booking.endLocation})`,
      html,
    })

    logger.info({ messageId: info.messageId, recipient: recipientEmail, reference: booking.reference }, 'Confirmation email sent successfully')
    return info
  } catch (err) {
    logger.error({ err, reference: booking.reference }, 'Failed to send confirmation email (non-blocking)')
  }
}

export const sendBookingCancellationEmail = async (booking, recipientEmail) => {
  if (!recipientEmail) {
    logger.warn('No recipient email provided for booking cancellation')
    return
  }

  try {
    const transport = await getTransporter()
    const tripUrl = `${config.clientUrl}/trips/${booking.id}`

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1e293b;">
        <div style="background-color: #ef4444; padding: 24px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Booking Cancelled</h1>
        </div>
        <div style="padding: 24px; border: 1px solid #e2e8f0; border-top: none; border-radius: 0 0 8px 8px; background: #ffffff;">
          <p style="font-size: 16px;">Hello <strong>${booking.name}</strong>,</p>
          <p>Your booking <strong>${booking.reference}</strong> has been cancelled.</p>
          
          <div style="background: #f8fafc; border-radius: 6px; padding: 16px; margin: 20px 0;">
            <p style="margin: 8px 0;"><strong>Booking Reference:</strong> ${booking.reference}</p>
            <p style="margin: 8px 0;"><strong>Route:</strong> ${booking.startLocation} &rarr; ${booking.endLocation}</p>
            <p style="margin: 8px 0;"><strong>Dates:</strong> ${booking.startDate} to ${booking.endDate}</p>
            <p style="margin: 8px 0;"><strong>Status:</strong> CANCELLED</p>
          </div>

          <div style="text-align: center; margin: 28px 0;">
            <a href="${tripUrl}" style="background-color: #64748b; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">
              View Booking Details
            </a>
          </div>

          <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 12px; color: #64748b; text-align: center;">
            Travel Trip Customer Support
          </p>
        </div>
      </div>
    `

    const info = await transport.sendMail({
      from: config.mailFrom,
      to: recipientEmail,
      subject: `Booking Cancelled: ${booking.reference}`,
      html,
    })

    logger.info({ messageId: info.messageId, recipient: recipientEmail, reference: booking.reference }, 'Cancellation email sent successfully')
    return info
  } catch (err) {
    logger.error({ err, reference: booking.reference }, 'Failed to send cancellation email (non-blocking)')
  }
}
