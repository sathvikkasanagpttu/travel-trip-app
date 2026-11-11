import { Router } from 'express'
import { requireAuth } from '../middleware/auth.js'
import * as draftService from '../services/draft.service.js'

const router = Router()

// GET /api/v1/drafts/me
router.get('/me', requireAuth, async (req, res, next) => {
  try {
    const draft = await draftService.getDraft(req.user.id)
    res.status(200).json({
      success: true,
      draft,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/v1/drafts/me
router.put('/me', requireAuth, async (req, res, next) => {
  try {
    const { stepId, payload } = req.body
    const draft = await draftService.saveDraft(req.user.id, { stepId, payload })
    res.status(200).json({
      success: true,
      draft,
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/v1/drafts/me
router.delete('/me', requireAuth, async (req, res, next) => {
  try {
    await draftService.deleteDraft(req.user.id)
    res.status(200).json({
      success: true,
      message: 'Draft deleted',
    })
  } catch (err) {
    next(err)
  }
})

export default router
