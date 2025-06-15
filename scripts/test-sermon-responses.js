const { createClient } = require('@supabase/supabase-js')
require('dotenv').config({ path: require('path').join(__dirname, '..', '.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testSermonResponses() {
  try {
    console.log('Testing sermon response functionality...')

    // Test 1: Check if tables exist and have data
    console.log('\n1. Checking sermon tables...')
    
    const { data: sermons, error: sermonsError } = await supabase
      .from('sermons')
      .select('*')
      .limit(5)

    if (sermonsError) {
      console.error('❌ Error fetching sermons:', sermonsError)
      return
    }

    console.log(`✅ Found ${sermons.length} sermons`)
    if (sermons.length > 0) {
      console.log('Sample sermon:', sermons[0].title)
    }

    // Test 2: Check sermon questions
    console.log('\n2. Checking sermon questions...')
    
    const { data: questions, error: questionsError } = await supabase
      .from('sermon_questions')
      .select('*')
      .limit(5)

    if (questionsError) {
      console.error('❌ Error fetching questions:', questionsError)
      return
    }

    console.log(`✅ Found ${questions.length} questions`)
    if (questions.length > 0) {
      console.log('Sample question:', questions[0].question_text)
    }

    // Test 3: Check users table structure
    console.log('\n3. Checking users table...')
    
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, is_admin, role')
      .limit(3)

    if (usersError) {
      console.error('❌ Error fetching users:', usersError)
      return
    }

    console.log(`✅ Found ${users.length} users`)
    users.forEach(user => {
      console.log(`- ${user.email}: admin=${user.is_admin}, role=${user.role}`)
    })

    // Test 4: Test sermon responses table
    console.log('\n4. Testing sermon responses...')
    
    const { data: responses, error: responsesError } = await supabase
      .from('sermon_responses')
      .select('*')
      .limit(5)

    if (responsesError) {
      console.error('❌ Error fetching responses:', responsesError)
    } else {
      console.log(`✅ Found ${responses.length} existing responses`)
    }

    // Test 5: Check RLS policies
    console.log('\n5. Checking RLS policies...')
    
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql_query: `
          SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
          FROM pg_policies 
          WHERE tablename IN ('sermons', 'sermon_questions', 'sermon_responses')
          ORDER BY tablename, policyname;
        `
      })

    if (policiesError) {
      console.log('⚠️  Could not fetch RLS policies (this is normal if exec_sql function doesn\'t exist)')
    } else {
      console.log('✅ RLS policies found')
    }

    console.log('\n🎉 Test completed successfully!')
    console.log('\nNext steps:')
    console.log('1. Make sure you\'ve run the updated SQL script in Supabase')
    console.log('2. Check that your user account has proper permissions')
    console.log('3. Test the application in the browser')

  } catch (error) {
    console.error('❌ Test failed:', error)
  }
}

testSermonResponses()
