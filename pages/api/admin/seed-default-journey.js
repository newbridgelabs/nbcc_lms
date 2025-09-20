import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Seeding default 5-day journey...')

    // First, check if the journey already exists
    const { data: existingJourney, error: checkError } = await supabase
      .from('journeys')
      .select('id')
      .eq('user_tag', 'newcomer')
      .eq('title', '5-Day Bible Study for Newcomers')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing journey:', checkError)
      return res.status(500).json({ error: 'Failed to check existing journey' })
    }

    let journeyId

    if (existingJourney) {
      journeyId = existingJourney.id
      console.log('Journey already exists, using existing ID:', journeyId)
    } else {
      // Create the journey
      const { data: newJourney, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          title: '5-Day Bible Study for Newcomers',
          description: 'A foundational 5-day journey through key Bible passages for new church members',
          user_tag: 'newcomer',
          is_active: true
        })
        .select()
        .single()

      if (journeyError) {
        console.error('Error creating journey:', journeyError)
        return res.status(500).json({ error: 'Failed to create journey' })
      }

      journeyId = newJourney.id
      console.log('Created new journey with ID:', journeyId)
    }

    // Define the 5 days
    const days = [
      {
        day_number: 1,
        title: "Day 1: God's Love",
        content: "Welcome to your journey of faith! Today we explore the foundational truth of God's love for you. God's love is unconditional, eternal, and transformative. It's not based on what you do, but on who you are - His beloved child.",
        scripture_reference: "John 3:16",
        reflection_questions: [
          "What does it mean to you that God loves you unconditionally?",
          "How have you experienced God's love in your life?"
        ]
      },
      {
        day_number: 2,
        title: "Day 2: Salvation",
        content: "Discover the gift of salvation and what it means for your life. Salvation is God's free gift to us through Jesus Christ. It's not something we earn, but something we receive by faith.",
        scripture_reference: "Romans 10:9-10",
        reflection_questions: [
          "What does salvation mean to you personally?",
          "How has accepting Jesus changed your perspective on life?"
        ]
      },
      {
        day_number: 3,
        title: "Day 3: New Life in Christ",
        content: "Learn about the transformation that comes with following Jesus. When we accept Christ, we become new creations. The old life passes away, and everything becomes new.",
        scripture_reference: "2 Corinthians 5:17",
        reflection_questions: [
          "What changes have you noticed since beginning your faith journey?",
          "What old things are you ready to leave behind?"
        ]
      },
      {
        day_number: 4,
        title: "Day 4: Community and Fellowship",
        content: "Understand the importance of Christian community and fellowship. God designed us to live in relationship with others. The church is our spiritual family where we grow together.",
        scripture_reference: "Hebrews 10:24-25",
        reflection_questions: [
          "Why is fellowship with other believers important to you?",
          "How can you contribute to your church community?"
        ]
      },
      {
        day_number: 5,
        title: "Day 5: Living Your Faith",
        content: "Discover how to live out your faith in daily life. Faith is not just what we believe, but how we live. It's about letting Christ's love flow through us to others.",
        scripture_reference: "James 2:17",
        reflection_questions: [
          "How will you live differently as a follower of Christ?",
          "What practical steps will you take to grow in your faith?"
        ]
      }
    ]

    // Insert or update the days
    for (const day of days) {
      const { error: dayError } = await supabase
        .from('journey_days')
        .upsert({
          journey_id: journeyId,
          ...day
        }, {
          onConflict: 'journey_id,day_number'
        })

      if (dayError) {
        console.error('Error inserting day:', dayError)
        return res.status(500).json({ error: `Failed to insert day ${day.day_number}` })
      }
    }

    console.log('Default journey seeded successfully')

    return res.status(200).json({
      success: true,
      message: 'Default 5-day journey created successfully',
      journeyId
    })

  } catch (error) {
    console.error('Error seeding default journey:', error)
    return res.status(500).json({ 
      error: 'Failed to seed default journey', 
      details: error.message 
    })
  }
}
