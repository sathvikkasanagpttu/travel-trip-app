import prisma from '../db/prisma.js'

export const getDraft = async (userId) => {
  const draft = await prisma.draft.findUnique({
    where: { userId },
  })

  if (!draft) {
    return null
  }

  let payload = draft.payload
  try {
    payload = JSON.parse(draft.payload)
  } catch {
    // Keep as string if not valid JSON
  }

  return {
    id: draft.id,
    stepId: draft.stepId,
    payload,
    updatedAt: draft.updatedAt,
  }
}

export const saveDraft = async (userId, { stepId, payload }) => {
  const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload)

  const draft = await prisma.draft.upsert({
    where: { userId },
    update: {
      stepId: stepId || 'YOUR_DETAILS',
      payload: payloadString,
    },
    create: {
      userId,
      stepId: stepId || 'YOUR_DETAILS',
      payload: payloadString,
    },
  })

  let parsedPayload = draft.payload
  try {
    parsedPayload = JSON.parse(draft.payload)
  } catch {
    // Keep raw
  }

  return {
    id: draft.id,
    stepId: draft.stepId,
    payload: parsedPayload,
    updatedAt: draft.updatedAt,
  }
}

export const deleteDraft = async (userId) => {
  try {
    await prisma.draft.deleteMany({
      where: { userId },
    })
    return true
  } catch {
    return false
  }
}
