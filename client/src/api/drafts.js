import apiClient from './axios'

export const getDraft = async () => {
  const response = await apiClient.get('/drafts/me')
  return response.data
}

export const saveDraft = async (draftData) => {
  const response = await apiClient.put('/drafts/me', draftData)
  return response.data
}

export const deleteDraft = async () => {
  const response = await apiClient.delete('/drafts/me')
  return response.data
}
