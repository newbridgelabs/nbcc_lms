import { supabase } from '../../../lib/supabase'
import { checkAdminAccess } from '../../../lib/admin-config'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Check admin access
    const { user, isAdmin } = await checkAdminAccess(req, res)
    if (!isAdmin) {
      return res.status(403).json({ error: 'Admin access required' })
    }

    console.log('Creating sample journeys...')

    // Sample journeys data
    const sampleJourneys = [
      {
        title: "Welcome to Our Church Family",
        description: "A 7-day journey for newcomers to understand our church values, community, and how to get involved.",
        user_tags: ['newcomer'],
        days: [
          {
            day_number: 1,
            title: "Welcome Home",
            content: "Welcome to our church family! Today we want you to know that you belong here. Our church is a place where everyone is welcomed with open arms, regardless of where you've been or what you've done.",
            scripture_reference: "Romans 15:7",
            reflection_questions: [
              "What drew you to visit our church?",
              "How can we help you feel more at home here?"
            ]
          },
          {
            day_number: 2,
            title: "Our Mission and Vision",
            content: "Learn about our church's mission to love God, love people, and serve our community. Discover how you can be part of something bigger than yourself.",
            scripture_reference: "Matthew 28:19-20",
            reflection_questions: [
              "How does our mission resonate with your heart?",
              "What gifts or talents do you have that could serve others?"
            ]
          },
          {
            day_number: 3,
            title: "Finding Your Place",
            content: "Every person has a unique role in the body of Christ. Today, explore the different ways you can get involved and find your place in our community.",
            scripture_reference: "1 Corinthians 12:12-27",
            reflection_questions: [
              "What areas of ministry interest you most?",
              "How do you sense God calling you to serve?"
            ]
          }
        ]
      },
      {
        title: "Growing Deeper in Faith",
        description: "A 10-day journey for existing members to deepen their relationship with God and strengthen their spiritual foundation.",
        user_tags: ['existing_member'],
        days: [
          {
            day_number: 1,
            title: "The Foundation of Prayer",
            content: "Prayer is the foundation of our relationship with God. Today, let's explore different ways to pray and how to make prayer a consistent part of your daily life.",
            scripture_reference: "1 Thessalonians 5:17",
            reflection_questions: [
              "How has your prayer life evolved since joining our church?",
              "What barriers do you face in maintaining consistent prayer?"
            ]
          },
          {
            day_number: 2,
            title: "Studying God's Word",
            content: "The Bible is our guide for life. Learn practical ways to study Scripture and apply its truths to your daily circumstances.",
            scripture_reference: "2 Timothy 3:16-17",
            reflection_questions: [
              "What is your current approach to Bible study?",
              "How has God's Word impacted your life recently?"
            ]
          }
        ]
      },
      {
        title: "Leading with Excellence",
        description: "A 14-day journey for worship team members focusing on spiritual preparation, technical excellence, and heart posture in worship ministry.",
        user_tags: ['worship_team'],
        days: [
          {
            day_number: 1,
            title: "The Heart of a Worshipper",
            content: "Before we lead others in worship, we must first be worshippers ourselves. Today, reflect on what it means to worship God in spirit and truth.",
            scripture_reference: "John 4:23-24",
            reflection_questions: [
              "What does worship mean to you personally?",
              "How do you prepare your heart before leading worship?"
            ]
          },
          {
            day_number: 2,
            title: "Excellence in Ministry",
            content: "God deserves our best effort. Explore how to balance technical excellence with spiritual authenticity in your worship ministry.",
            scripture_reference: "Colossians 3:23",
            reflection_questions: [
              "How do you maintain excellence without losing heart focus?",
              "What areas of your ministry need improvement?"
            ]
          }
        ]
      },
      {
        title: "Multi-Community Journey",
        description: "A special journey designed for multiple groups - newcomers and existing members working together on community building.",
        user_tags: ['newcomer', 'existing_member'],
        days: [
          {
            day_number: 1,
            title: "Building Bridges",
            content: "Community is built when people from different backgrounds come together. Today, focus on how we can build bridges between newcomers and long-time members.",
            scripture_reference: "Ephesians 4:3",
            reflection_questions: [
              "How can you help newcomers feel welcomed?",
              "What can you learn from people with different church experiences?"
            ]
          }
        ]
      }
    ]

    // Use the authenticated admin user
    const adminUserId = user.id

    let createdJourneys = 0
    let createdDays = 0
    let createdTags = 0

    for (const journeyData of sampleJourneys) {
      // Check if journey already exists
      const { data: existingJourney } = await supabase
        .from('journeys')
        .select('id')
        .eq('title', journeyData.title)
        .single()

      if (existingJourney) {
        console.log(`Journey "${journeyData.title}" already exists, skipping...`)
        continue
      }

      // Create journey
      const { data: newJourney, error: journeyError } = await supabase
        .from('journeys')
        .insert({
          title: journeyData.title,
          description: journeyData.description,
          user_tag: journeyData.user_tags[0], // First tag for backward compatibility
          created_by: adminUserId,
          is_active: true
        })
        .select()
        .single()

      if (journeyError) throw journeyError

      createdJourneys++
      console.log(`Created journey: ${journeyData.title}`)

      // Create journey tags
      const journeyTagsData = journeyData.user_tags.map(tag => ({
        journey_id: newJourney.id,
        tag_name: tag,
        is_active: true
      }))

      const { error: tagsError } = await supabase
        .from('journey_tags')
        .insert(journeyTagsData)

      if (tagsError) {
        console.warn(`Warning: Failed to create tags for journey ${journeyData.title}:`, tagsError)
      } else {
        createdTags += journeyTagsData.length
      }

      // Create journey days
      for (const dayData of journeyData.days) {
        const { error: dayError } = await supabase
          .from('journey_days')
          .insert({
            journey_id: newJourney.id,
            day_number: dayData.day_number,
            title: dayData.title,
            content: dayData.content,
            scripture_reference: dayData.scripture_reference,
            reflection_questions: dayData.reflection_questions
          })

        if (dayError) {
          console.error(`Error creating day ${dayData.day_number} for journey ${journeyData.title}:`, dayError)
        } else {
          createdDays++
        }
      }
    }

    res.status(200).json({ 
      success: true, 
      message: `Sample journeys created successfully!`,
      stats: {
        journeys: createdJourneys,
        days: createdDays,
        tags: createdTags
      }
    })

  } catch (error) {
    console.error('Error creating sample journeys:', error)
    res.status(500).json({ 
      error: 'Failed to create sample journeys', 
      details: error.message 
    })
  }
}
