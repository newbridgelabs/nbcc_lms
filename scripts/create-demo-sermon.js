// Demo script to create a sample sermon for testing
// Run this after setting up the database

const demoSermon = {
  title: "Walking in Faith: Trusting God's Plan",
  description: "Exploring how we can trust God's plan even when we can't see the full picture. Based on Proverbs 3:5-6.",
  sermon_date: new Date().toISOString().split('T')[0], // Today's date
  pastor_name: "Pastor John Smith",
  scripture_reference: "Proverbs 3:5-6, Romans 8:28",
  questions: [
    {
      question_text: "What does it mean to 'trust in the Lord with all your heart'? How can we practically apply this in our daily lives?",
      is_private: true,
      placeholder_text: "Think about areas in your life where you struggle to trust God completely..."
    },
    {
      question_text: "Reflect on a time when you couldn't see God's plan but later understood His purpose. How did that experience strengthen your faith?",
      is_private: true,
      placeholder_text: "Share a personal testimony or reflection..."
    },
    {
      question_text: "What are some practical ways we can 'lean not on our own understanding' in today's world?",
      is_private: true,
      placeholder_text: "Consider specific situations where we rely too much on our own wisdom..."
    },
    {
      question_text: "How can we encourage others who are struggling to trust God's timing?",
      is_private: true,
      placeholder_text: "Think about biblical examples and personal experiences..."
    },
    {
      question_text: "What steps can you take this week to surrender an area of your life more fully to God?",
      is_private: true,
      placeholder_text: "Be specific about actionable steps you can take..."
    }
  ]
}

console.log('Demo Sermon Data:')
console.log(JSON.stringify(demoSermon, null, 2))
console.log('\nTo create this sermon:')
console.log('1. Go to /admin/sermons')
console.log('2. Click "Create New Sermon"')
console.log('3. Copy the data above into the form')
console.log('4. Save the sermon')
console.log('5. Test by going to /sermons')

// Instructions for manual creation
console.log('\n=== MANUAL CREATION STEPS ===')
console.log('Title: Walking in Faith: Trusting God\'s Plan')
console.log('Description: Exploring how we can trust God\'s plan even when we can\'t see the full picture. Based on Proverbs 3:5-6.')
console.log('Date: Today\'s date')
console.log('Pastor: Pastor John Smith')
console.log('Scripture: Proverbs 3:5-6, Romans 8:28')
console.log('\nQuestions (all set to Private Notes):')
demoSermon.questions.forEach((q, i) => {
  console.log(`\n${i + 1}. ${q.question_text}`)
  console.log(`   Placeholder: ${q.placeholder_text}`)
})

module.exports = demoSermon
