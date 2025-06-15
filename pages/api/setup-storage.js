import { ensureStorageBuckets } from '../../lib/storage-setup'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Setting up storage buckets...')
    
    const result = await ensureStorageBuckets()
    
    if (result.success) {
      return res.status(200).json({ 
        success: true, 
        message: 'Storage buckets setup completed' 
      })
    } else {
      return res.status(500).json({ 
        success: false, 
        error: result.error 
      })
    }
  } catch (error) {
    console.error('Storage setup API error:', error)
    return res.status(500).json({ 
      success: false, 
      error: error.message 
    })
  }
}
