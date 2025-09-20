import { supabase } from '../../../lib/supabase-admin'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    console.log('Seeding 14-day booklet journey...')

    // First, check if the journey already exists
    const { data: existingJourney, error: checkError } = await supabase
      .from('journeys')
      .select('id')
      .eq('user_tag', 'newcomer')
      .eq('title', '14-Day Membership Booklet')
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 is "not found"
      console.error('Error checking existing journey:', checkError)
      return res.status(500).json({ error: 'Failed to check existing journey' })
    }

    let journeyId

    if (existingJourney) {
      journeyId = existingJourney.id
      console.log('14-day journey already exists, using existing ID:', journeyId)
    } else {
      // Create the journey
      const { data: newJourney, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          title: '14-Day Membership Booklet',
          description: 'A comprehensive 14-day study covering church membership, doctrine, and spiritual growth. Follows the 5-day Bible study for newcomers.',
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
      console.log('Created new 14-day journey with ID:', journeyId)
    }

    // Define the 14 days (3 Mondays + last week till Thursday)
    const days = [
      // Week 1 (Monday 1)
      {
        day_number: 1,
        title: "Day 1: Understanding Church Membership",
        content: "Welcome to your membership journey! Today we explore what it means to be a member of God's family and our local church community. Church membership is more than just joining an organization - it's about committing to a spiritual family.",
        scripture_reference: "1 Corinthians 12:12-27",
        reflection_questions: [
          "What does being part of the body of Christ mean to you?",
          "How do you see yourself contributing to our church family?"
        ]
      },
      {
        day_number: 2,
        title: "Day 2: Our Church's History and Vision",
        content: "Learn about our church's founding, mission, and vision for the future. Understanding where we've come from helps us appreciate where we're going together.",
        scripture_reference: "Jeremiah 29:11",
        reflection_questions: [
          "How does our church's mission align with your personal calling?",
          "What aspects of our vision excite you most?"
        ]
      },
      {
        day_number: 3,
        title: "Day 3: Core Beliefs and Doctrine",
        content: "Explore the fundamental beliefs that guide our church. These doctrines form the foundation of our faith and practice.",
        scripture_reference: "2 Timothy 3:16-17",
        reflection_questions: [
          "Which of our core beliefs resonates most strongly with you?",
          "How do these beliefs shape your daily life?"
        ]
      },
      {
        day_number: 4,
        title: "Day 4: The Importance of Baptism",
        content: "Understand the significance of baptism as a public declaration of faith and symbol of new life in Christ.",
        scripture_reference: "Romans 6:3-4",
        reflection_questions: [
          "What does baptism symbolize in your faith journey?",
          "If you haven't been baptized, what questions do you have about this step?"
        ]
      },
      {
        day_number: 5,
        title: "Day 5: Communion and Its Meaning",
        content: "Discover the sacred practice of communion and its role in remembering Christ's sacrifice and our unity as believers.",
        scripture_reference: "1 Corinthians 11:23-26",
        reflection_questions: [
          "How does participating in communion deepen your faith?",
          "What does it mean to you to share this meal with fellow believers?"
        ]
      },
      {
        day_number: 6,
        title: "Day 6: Prayer and Spiritual Disciplines",
        content: "Learn about the importance of prayer, Bible study, and other spiritual disciplines in growing your faith.",
        scripture_reference: "1 Thessalonians 5:16-18",
        reflection_questions: [
          "What spiritual disciplines do you currently practice?",
          "How can you develop a more consistent prayer life?"
        ]
      },
      {
        day_number: 7,
        title: "Day 7: Rest and Reflection",
        content: "Take time to rest and reflect on what you've learned this week. God designed us to need rest and renewal.",
        scripture_reference: "Mark 6:31",
        reflection_questions: [
          "What has been the most meaningful part of this week's study?",
          "How are you feeling about your journey toward membership?"
        ]
      },
      // Week 2 (Monday 2)
      {
        day_number: 8,
        title: "Day 8: Serving in the Church",
        content: "Explore the various ways you can serve in our church community. Every member has unique gifts and talents to contribute.",
        scripture_reference: "1 Peter 4:10-11",
        reflection_questions: [
          "What gifts and talents do you feel God has given you?",
          "Which areas of service in our church interest you most?"
        ]
      },
      {
        day_number: 9,
        title: "Day 9: Stewardship and Giving",
        content: "Understand biblical principles of stewardship, including tithing and generous giving as expressions of faith.",
        scripture_reference: "Malachi 3:10",
        reflection_questions: [
          "How do you view your resources as gifts from God?",
          "What does faithful stewardship look like in your life?"
        ]
      },
      {
        day_number: 10,
        title: "Day 10: Church Leadership and Structure",
        content: "Learn about our church's leadership structure, governance, and how decisions are made in our community.",
        scripture_reference: "Hebrews 13:17",
        reflection_questions: [
          "How can you support and pray for church leadership?",
          "What role do you see yourself playing in church governance?"
        ]
      },
      {
        day_number: 11,
        title: "Day 11: Evangelism and Outreach",
        content: "Discover our church's heart for reaching others with the Gospel and serving our local community.",
        scripture_reference: "Matthew 28:19-20",
        reflection_questions: [
          "How comfortable are you with sharing your faith?",
          "What opportunities do you see for outreach in your daily life?"
        ]
      },
      // Week 3 (Monday 3) + Final Week (Tuesday-Thursday)
      {
        day_number: 12,
        title: "Day 12: Church Discipline and Restoration",
        content: "Understand the biblical approach to church discipline, focused on love, restoration, and maintaining healthy community.",
        scripture_reference: "Matthew 18:15-17",
        reflection_questions: [
          "How does loving accountability strengthen the church?",
          "What role do you play in maintaining healthy relationships?"
        ]
      },
      {
        day_number: 13,
        title: "Day 13: Your Membership Commitment",
        content: "Reflect on the commitments you're making as a church member and what this means for your spiritual journey.",
        scripture_reference: "Joshua 24:15",
        reflection_questions: [
          "What commitments are you ready to make to this church family?",
          "How will membership change your relationship with the church?"
        ]
      },
      {
        day_number: 14,
        title: "Day 14: Moving Forward in Faith",
        content: "Celebrate the completion of your membership preparation and look forward to your continued growth in faith and service.",
        scripture_reference: "Philippians 1:6",
        reflection_questions: [
          "How has this journey prepared you for membership?",
          "What are your hopes and goals as a new church member?"
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

    console.log('14-day journey seeded successfully')

    return res.status(200).json({
      success: true,
      message: '14-day membership booklet journey created successfully',
      journeyId
    })

  } catch (error) {
    console.error('Error seeding 14-day journey:', error)
    return res.status(500).json({ 
      error: 'Failed to seed 14-day journey', 
      details: error.message 
    })
  }
}
