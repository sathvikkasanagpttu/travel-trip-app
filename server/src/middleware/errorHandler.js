import { ZodError } from 'zod'

export const errorHandler = (err, req, res, next) => {
  // If headers already sent, delegate to default express handler
  if (res.headersSent) {
    return next(err)
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const fields = {}
    err.errors.forEach(issue => {
      const field = issue.path.join('.')
      fields[field] = issue.message
    })

    return res.status(400).json({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Invalid input data',
        fields,
      },
    })
  }

  // Handle custom AppError
  const statusCode = err.statusCode || 500
  const code = err.code || 'INTERNAL_SERVER_ERROR'
  const message = err.message || 'An unexpected error occurred'

  if (statusCode >= 500) {
    console.error('[ServerError]', err)
  }

  res.status(statusCode).json({
    error: {
      code,
      message,
      fields: err.fields || undefined,
    },
  })
}

export class AppError extends Error {
  constructor(message, statusCode = 400, code = 'BAD_REQUEST', fields = undefined) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.fields = fields
  }
}
