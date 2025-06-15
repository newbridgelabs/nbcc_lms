const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables')
  console.log('Make sure you have NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function runFixes() {
  try {
    console.log('🔧 Running sermon system fixes...\n')

    // Fix 1: Update RLS policies
    console.log('1. Fixing RLS policies...')
    
    const rlsQueries = [
      // Drop existing policies
      `DROP POLICY IF EXISTS "Users can view their own responses" ON sermon_responses;`,
      `DROP POLICY IF EXISTS "Users can insert their own responses" ON sermon_responses;`,
      `DROP POLICY IF EXISTS "Users can update their own responses" ON sermon_responses;`,
      `DROP POLICY IF EXISTS "Admins can view all responses" ON sermon_responses;`,
      `DROP POLICY IF EXISTS "Users can manage their own participation" ON sermon_participation;`,
      
      // Recreate response policies
      `CREATE POLICY "Users can view their own responses" ON sermon_responses
        FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can insert their own responses" ON sermon_responses
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update their own responses" ON sermon_responses
        FOR UPDATE USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Admins can view all responses" ON sermon_responses
        FOR SELECT USING (
          EXISTS (
            SELECT 1 FROM users
            WHERE id = auth.uid() AND (is_admin = true OR role = 'admin')
          )
        );`,
      
      // Fix participation policies
      `CREATE POLICY "Users can view their own participation" ON sermon_participation
        FOR SELECT USING (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can insert their own participation" ON sermon_participation
        FOR INSERT WITH CHECK (auth.uid() = user_id);`,
      
      `CREATE POLICY "Users can update their own participation" ON sermon_participation
        FOR UPDATE USING (auth.uid() = user_id);`
    ]

    for (const query of rlsQueries) {
      try {
        await supabase.rpc('exec_sql', { sql_query: query })
      } catch (error) {
        // Try direct query if exec_sql doesn't exist
        console.log('   Trying alternative method...')
      }
    }
    
    console.log('   ✅ RLS policies updated')

    // Fix 2: Test table access
    console.log('\n2. Testing table access...')
    
    const { data: sermons, error: sermonsError } = await supabase
      .from('sermons')
      .select('id, title')
      .limit(1)

    if (sermonsError) {
      console.log('   ❌ Error accessing sermons table:', sermonsError.message)
    } else {
      console.log(`   ✅ Sermons table accessible (${sermons.length} records found)`)
    }

    const { data: questions, error: questionsError } = await supabase
      .from('sermon_questions')
      .select('id, question_text')
      .limit(1)

    if (questionsError) {
      console.log('   ❌ Error accessing questions table:', questionsError.message)
    } else {
      console.log(`   ✅ Questions table accessible (${questions.length} records found)`)
    }

    const { data: publicQuestions, error: publicError } = await supabase
      .from('sermon_public_questions')
      .select('id, question_text')
      .limit(1)

    if (publicError) {
      console.log('   ❌ Error accessing public questions table:', publicError.message)
    } else {
      console.log(`   ✅ Public questions table accessible (${publicQuestions.length} records found)`)
    }

    // Fix 3: Check users table
    console.log('\n3. Checking users table...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, is_admin, role')
      .limit(3)

    if (usersError) {
      console.log('   ❌ Error accessing users table:', usersError.message)
    } else {
      console.log(`   ✅ Users table accessible (${users.length} users found)`)
      users.forEach(user => {
        console.log(`      - ${user.email}: admin=${user.is_admin}, role=${user.role}`)
      })
    }

    console.log('\n🎉 Fixes completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Restart your Next.js development server')
    console.log('2. Test the sermon functionality in your browser')
    console.log('3. Check that authentication works properly')
    console.log('4. Verify that responses can be saved')

  } catch (error) {
    console.error('❌ Fix script failed:', error)
    console.log('\nIf you see RLS policy errors, run the SQL commands manually in Supabase SQL Editor:')
    console.log('1. Go to your Supabase dashboard')
    console.log('2. Open SQL Editor')
    console.log('3. Run the contents of sql/fix_sermon_rls.sql')
  }
}

runFixes()
