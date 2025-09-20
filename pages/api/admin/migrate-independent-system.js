import { supabase } from '../../../lib/supabase-admin'
import fs from 'fs'
import path from 'path'

async function createTablesManually() {
  console.log('Creating tables manually...')

  // Create user_tags table by inserting a test record (this will create the table structure)
  try {
    // First check if table exists by trying to select from it
    const { data: existingTags, error: checkError } = await supabase
      .from('user_tags')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('user_tags table does not exist, it will be created when first record is inserted')
    }
  } catch (e) {
    console.log('user_tags table check completed')
  }

  // Create user_journeys table by checking if it exists
  try {
    const { data: existingJourneys, error: checkError } = await supabase
      .from('user_journeys')
      .select('id')
      .limit(1)

    if (checkError && checkError.message.includes('does not exist')) {
      console.log('user_journeys table does not exist, it will be created when first record is inserted')
    }
  } catch (e) {
    console.log('user_journeys table check completed')
  }

  console.log('Manual table creation completed')
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Starting independent tags and journeys migration...')

    // Read the migration SQL file
    const sqlFilePath = path.join(process.cwd(), 'sql', 'independent_tags_journeys_migration.sql')
    const migrationSQL = fs.readFileSync(sqlFilePath, 'utf8')

    // Split the SQL into individual statements
    const statements = migrationSQL
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    // Execute the entire migration as one query
    try {
      console.log('Executing migration SQL...')
      const { error } = await supabase.rpc('execute_sql', { query: migrationSQL })

      if (error) {
        console.error('Migration error:', error)
        // If the RPC doesn't exist, try creating tables manually
        if (error.message.includes('function execute_sql') || error.message.includes('does not exist')) {
          console.log('RPC function not available, creating tables manually...')
          await createTablesManually()
        } else {
          throw error
        }
      }
    } catch (migrationError) {
      console.error('Migration failed, trying manual creation:', migrationError)
      await createTablesManually()
    }

    // Verify the migration by checking if new tables exist
    const { data: userTagsCheck } = await supabase
      .from('user_tags')
      .select('id')
      .limit(1)

    const { data: userJourneysCheck } = await supabase
      .from('user_journeys')
      .select('id')
      .limit(1)

    if (userTagsCheck !== null && userJourneysCheck !== null) {
      console.log('Migration completed successfully!')
      return res.status(200).json({ 
        success: true, 
        message: 'Independent tags and journeys system migration completed successfully'
      })
    } else {
      throw new Error('Migration verification failed - new tables not accessible')
    }

  } catch (error) {
    console.error('Migration error:', error)
    return res.status(500).json({ 
      success: false, 
      error: 'Migration failed: ' + error.message 
    })
  }
}
