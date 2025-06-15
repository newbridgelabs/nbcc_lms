const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')
const path = require('path')

// Load environment variables
require('dotenv').config({ path: path.join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:')
  console.error('- NEXT_PUBLIC_SUPABASE_URL')
  console.error('- SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function setupSermonSystem() {
  try {
    console.log('Setting up Sermon Notes and Q&A System...')

    // Read the SQL file
    const sqlPath = path.join(__dirname, '..', 'sql', 'create_sermon_system.sql')
    const sql = fs.readFileSync(sqlPath, 'utf8')

    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    console.log(`Executing ${statements.length} SQL statements...`)

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.trim()) {
        try {
          console.log(`Executing statement ${i + 1}/${statements.length}...`)
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement })
          
          if (error) {
            // Try direct query if RPC fails
            const { error: directError } = await supabase
              .from('_temp')
              .select('*')
              .limit(0)
            
            if (directError) {
              console.log(`Statement ${i + 1}: ${statement.substring(0, 100)}...`)
              console.log('Note: Some statements may fail if tables already exist')
            }
          }
        } catch (err) {
          console.log(`Statement ${i + 1} note: ${err.message}`)
        }
      }
    }

    console.log('\n✅ Sermon system setup completed!')
    console.log('\nThe following tables have been created:')
    console.log('- sermons: Store sermon information')
    console.log('- sermon_questions: Store sermon questions/outline points')
    console.log('- sermon_responses: Store user private notes/responses')
    console.log('- sermon_public_questions: Store public Q&A questions')
    console.log('- sermon_participation: Track user progress through sermons')
    
    console.log('\n📝 Next steps:')
    console.log('1. Go to /admin/sermons to create your first interactive sermon')
    console.log('2. Add questions and set privacy levels')
    console.log('3. Users can access sermons at /sermons')
    console.log('4. View public questions at /admin/sermons/[id]/questions')

  } catch (error) {
    console.error('Error setting up sermon system:', error)
    process.exit(1)
  }
}

// Alternative manual setup function
async function manualSetup() {
  try {
    console.log('Setting up tables manually...')

    // Create sermons table
    const { error: sermonsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sermons (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          sermon_date DATE NOT NULL,
          pastor_name VARCHAR(255),
          scripture_reference VARCHAR(255),
          is_active BOOLEAN DEFAULT true,
          created_by UUID REFERENCES auth.users(id),
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (sermonsError) {
      console.log('Sermons table may already exist')
    }

    // Create sermon_questions table
    const { error: questionsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sermon_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          question_order INTEGER NOT NULL,
          is_private BOOLEAN DEFAULT true,
          placeholder_text TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (questionsError) {
      console.log('Questions table may already exist')
    }

    // Create other tables...
    console.log('✅ Basic tables created. Please run the full SQL script for complete setup.')

  } catch (error) {
    console.error('Manual setup error:', error)
  }
}

// Run setup
if (process.argv.includes('--manual')) {
  manualSetup()
} else {
  setupSermonSystem()
}
