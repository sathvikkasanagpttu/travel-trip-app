import PDFDocument from 'pdfkit'

export const generateItineraryPdf = (booking, res) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' })

      doc.on('error', (err) => reject(err))
      res.on('finish', () => resolve())

      // Pipe document to express response
      doc.pipe(res)

      // Header Banner
      doc
        .rect(0, 0, doc.page.width, 100)
        .fill('#304766')

      doc
        .fillColor('#ffffff')
        .fontSize(24)
        .font('Helvetica-Bold')
        .text('Travel Trip', 50, 32)

      doc
        .fontSize(14)
        .font('Helvetica')
        .text('Booking Itinerary & Confirmation', 50, 62)

      // Reference Box
      doc
        .rect(doc.page.width - 220, 25, 170, 50)
        .fill('#2563eb')

      doc
        .fillColor('#dbeafe')
        .fontSize(9)
        .font('Helvetica')
        .text('BOOKING REFERENCE', doc.page.width - 210, 33)

      doc
        .fillColor('#ffffff')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(booking.reference, doc.page.width - 210, 48)

      doc.moveDown(3)

      // Section: Trip Overview
      const startY = 130
      doc.y = startY

      doc
        .fillColor('#1e293b')
        .fontSize(16)
        .font('Helvetica-Bold')
        .text('Trip Overview', 50, doc.y)

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .moveTo(50, doc.y + 6)
        .lineTo(doc.page.width - 50, doc.y + 6)
        .stroke()

      doc.y += 18

      const addRow = (label, value) => {
        const curY = doc.y
        doc
          .fillColor('#64748b')
          .fontSize(10)
          .font('Helvetica-Bold')
          .text(label.toUpperCase(), 50, curY, { width: 160 })

        doc
          .fillColor('#1e293b')
          .fontSize(11)
          .font('Helvetica')
          .text(String(value || 'N/A'), 220, curY, { width: 320 })

        doc.y = Math.max(doc.y, curY + 20)
      }

      addRow('Status', booking.status)
      addRow('Lead Traveler', booking.name)
      if (booking.user?.email) {
        addRow('Contact Email', booking.user.email)
      }
      addRow('Route', `${booking.startLocation}  →  ${booking.endLocation}`)
      addRow('Travel Dates', `${booking.startDate}  to  ${booking.endDate}`)
      addRow('Guest Breakdown', `${booking.adults} Adult(s), ${booking.children} Child(ren), ${booking.infants} Infant(s)`)
      addRow(
        'Travel Assistance',
        booking.assistanceNeeded
          ? `${booking.assistanceType || 'Wheelchair'}${booking.assistanceNotes ? ` - ${booking.assistanceNotes}` : ''}`
          : 'Not needed'
      )
      addRow('Total Amount', `INR ₹${Number(booking.priceTotal || 0).toLocaleString('en-IN')} (${booking.currency || 'INR'})`)

      doc.moveDown(1.5)

      // Section: Status History
      doc
        .fillColor('#1e293b')
        .fontSize(14)
        .font('Helvetica-Bold')
        .text('Status History', 50, doc.y)

      doc
        .strokeColor('#cbd5e1')
        .lineWidth(1)
        .moveTo(50, doc.y + 6)
        .lineTo(doc.page.width - 50, doc.y + 6)
        .stroke()

      doc.y += 16

      if (booking.statusEvents && booking.statusEvents.length > 0) {
        booking.statusEvents.forEach((ev) => {
          const timestamp = new Date(ev.createdAt).toLocaleString('en-US', {
            dateStyle: 'medium',
            timeStyle: 'short',
          })
          const text = `${timestamp} - [${ev.status}] ${ev.note || ''}`
          doc
            .fillColor('#334155')
            .fontSize(10)
            .font('Helvetica')
            .text(`• ${text}`, 60, doc.y, { width: 480 })
          doc.y += 14
        })
      } else {
        doc
          .fillColor('#64748b')
          .fontSize(10)
          .font('Helvetica-Oblique')
          .text('No status updates recorded.', 60, doc.y)
        doc.y += 16
      }

      // Generation Timestamp & Footer
      const generationTimestamp = new Date().toISOString()
      doc.y = doc.page.height - 80

      doc
        .strokeColor('#e2e8f0')
        .lineWidth(1)
        .moveTo(50, doc.y)
        .lineTo(doc.page.width - 50, doc.y)
        .stroke()

      doc.y += 10
      doc
        .fillColor('#64748b')
        .fontSize(9)
        .font('Helvetica')
        .text(`Generated on: ${generationTimestamp} | Travel Trip Booking System`, 50, doc.y, {
          align: 'center',
          width: doc.page.width - 100,
        })

      doc.end()
    } catch (err) {
      reject(err)
    }
  })
}
