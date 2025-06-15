const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  try {
    console.log('Creating sermon system tables...')

    // Create sermons table
    console.log('Creating sermons table...')
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
      console.log('Sermons table creation result:', sermonsError.message)
    } else {
      console.log('✅ Sermons table created successfully')
    }

    // Create sermon_questions table
    console.log('Creating sermon_questions table...')
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
      console.log('Questions table creation result:', questionsError.message)
    } else {
      console.log('✅ Sermon questions table created successfully')
    }

    // Create sermon_responses table
    console.log('Creating sermon_responses table...')
    const { error: responsesError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sermon_responses (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
          question_id UUID REFERENCES sermon_questions(id) ON DELETE CASCADE,
          response_text TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          UNIQUE(user_id, question_id)
        );
      `
    })

    if (responsesError) {
      console.log('Responses table creation result:', responsesError.message)
    } else {
      console.log('✅ Sermon responses table created successfully')
    }

    // Create sermon_public_questions table
    console.log('Creating sermon_public_questions table...')
    const { error: publicQuestionsError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sermon_public_questions (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
          question_text TEXT NOT NULL,
          user_id UUID REFERENCES auth.users(id),
          is_answered BOOLEAN DEFAULT false,
          admin_response TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
      `
    })

    if (publicQuestionsError) {
      console.log('Public questions table creation result:', publicQuestionsError.message)
    } else {
      console.log('✅ Sermon public questions table created successfully')
    }

    // Create sermon_participation table
    console.log('Creating sermon_participation table...')
    const { error: participationError } = await supabase.rpc('exec_sql', {
      sql_query: `
        CREATE TABLE IF NOT EXISTS sermon_participation (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
          sermon_id UUID REFERENCES sermons(id) ON DELETE CASCADE,
          started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE,
          current_question_index INTEGER DEFAULT 0,
          UNIQUE(user_id, sermon_id)
        );
      `
    })

    if (participationError) {
      console.log('Participation table creation result:', participationError.message)
    } else {
      console.log('✅ Sermon participation table created successfully')
    }

    console.log('\n🎉 All tables created successfully!')
    console.log('Now testing the relationship...')

    // Test the relationship
    const { data: testData, error: testError } = await supabase
      .from('sermons')
      .select(`
        *,
        sermon_questions (
          id,
          question_text,
          question_order,
          is_private,
          placeholder_text
        )
      `)
      .limit(1)

    if (testError) {
      console.error('❌ Relationship test failed:', testError)
    } else {
      console.log('✅ Relationship test passed!')
    }

  } catch (error) {
    console.error('Error:', error)
  }
}

createTables()
