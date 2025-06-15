# Interactive Sermon Notes & Q&A System

## Overview

This system allows pastors to create interactive sermon outlines with questions that congregation members can answer during or after the sermon. It includes both private note-taking and public Q&A functionality.

## Features

### For Pastors/Admins
- **Create Interactive Sermons**: Set up sermon outlines with questions and reflection points
- **Privacy Controls**: Choose which questions are private (user-only) vs visible to admin
- **Public Q&A Management**: View and respond to anonymous questions from congregation
- **Export Functionality**: Download questions and responses as CSV for newsletter creation
- **Real-time Monitoring**: Track participation and engagement

### For Congregation Members
- **Interactive Note-Taking**: Navigate through sermon questions with next/back buttons
- **Private Journaling**: Personal notes that only the user can see
- **Public Q&A**: Submit questions anonymously to the pastor
- **Progress Tracking**: Resume where you left off
- **Mobile-Friendly**: Optimized for phones and tablets

## Setup Instructions

### 1. Database Setup

Run the database migration to create the required tables:

```bash
# Option 1: Run the setup script
node scripts/setup-sermon-system.js

# Option 2: Manual SQL execution
# Execute the SQL file: sql/create_sermon_system.sql in your Supabase dashboard
```

### 2. Database Tables Created

- **sermons**: Store sermon information (title, date, pastor, etc.)
- **sermon_questions**: Store questions/outline points with privacy settings
- **sermon_responses**: Store user's private notes and responses
- **sermon_public_questions**: Store public Q&A questions (anonymous to admin)
- **sermon_participation**: Track user progress through sermons

### 3. Access the System

- **Admin Interface**: `/admin/sermons`
- **User Interface**: `/sermons`
- **Navigation**: Added to main menu for both admin and users

## How to Use

### Creating a Sermon (Pastor/Admin)

1. Go to `/admin/sermons`
2. Click "Create New Sermon"
3. Fill in sermon details:
   - Title
   - Date
   - Pastor name
   - Scripture reference
   - Description

4. Add questions/reflection points:
   - Question text
   - Placeholder text (optional)
   - Privacy setting:
     - **Private Notes**: Only visible to the user
     - **Visible to Admin**: You can see responses

5. Save the sermon

### Taking Notes (Congregation Members)

1. Go to `/sermons`
2. Select a sermon
3. Navigate through questions using Next/Back buttons
4. Type responses in the text areas
5. Responses are automatically saved
6. At the end, optionally submit a public question

### Managing Q&A (Pastor/Admin)

1. Go to `/admin/sermons`
2. Click "Q&A" on any sermon
3. View all public questions (submitted anonymously)
4. Type responses to questions
5. Export questions and responses as CSV for newsletter

## Privacy & Security

### Private Notes
- Questions marked as "Private Notes" are only visible to the user
- Stored securely with Row Level Security (RLS)
- Cannot be accessed by admins or other users

### Public Questions
- Submitted anonymously to protect user privacy
- Admin sees questions but not who asked them
- Designed for introverts who may not ask questions publicly

### Data Protection
- All tables use Row Level Security (RLS)
- Users can only access their own data
- Admins have controlled access to public questions only

## Technical Implementation

### API Endpoints

- `GET /api/sermons` - List all active sermons
- `POST /api/sermons` - Create new sermon (admin only)
- `GET /api/sermons/[id]/responses` - Get user's responses
- `POST /api/sermons/[id]/responses` - Save user response
- `GET /api/sermons/[id]/public-questions` - Get public questions
- `POST /api/sermons/[id]/public-questions` - Submit public question
- `PUT /api/sermons/[id]/public-questions` - Update admin response
- `GET /api/sermons/[id]/participation` - Get participation status
- `POST /api/sermons/[id]/participation` - Update participation

### Mobile Responsiveness

The system is fully responsive and optimized for:
- **Mobile phones**: Touch-friendly navigation, proper input sizing
- **Tablets**: Optimized layouts and spacing
- **Desktop**: Full-featured interface

### Key Components

- **SermonsList** (`/pages/sermons/index.js`): Browse available sermons
- **SermonNotes** (`/pages/sermons/[id].js`): Interactive note-taking interface
- **AdminSermons** (`/pages/admin/sermons.js`): Sermon management
- **CreateSermon** (`/pages/admin/sermons/create.js`): Sermon creation form
- **SermonQuestions** (`/pages/admin/sermons/[id]/questions.js`): Q&A management

## Use Cases

### During Live Sermons
- Pastor asks congregation to open the sermon on their phones
- Members follow along and answer reflection questions in real-time
- Private notes for personal reflection
- Public questions for clarification

### Post-Sermon Study
- Members can revisit and complete sermon notes at home
- Continue reflection and add more thoughts
- Submit questions that came up during personal study

### Newsletter Creation
- Export all public questions and admin responses
- Create weekly Q&A newsletter
- Address common questions in follow-up sessions

### Small Group Discussions
- Use sermon notes as discussion starters
- Members can share insights from their private notes
- Group leaders can facilitate based on sermon questions

## Best Practices

### For Pastors
1. **Mix Question Types**: Combine private reflection with discussion prompts
2. **Clear Instructions**: Explain the system before starting
3. **Encourage Participation**: Remind congregation about the Q&A feature
4. **Regular Responses**: Answer public questions weekly for engagement

### For Users
1. **Honest Reflection**: Use private notes for genuine spiritual reflection
2. **Ask Questions**: Don't hesitate to submit questions - they're anonymous
3. **Regular Review**: Revisit old sermon notes for continued growth
4. **Engage Fully**: Take time to thoughtfully answer questions

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure Supabase credentials are correct
2. **Permission Errors**: Check RLS policies are properly set
3. **Mobile Issues**: Verify responsive CSS is loading
4. **Export Problems**: Check admin permissions and data format

### Support

For technical issues:
1. Check browser console for errors
2. Verify database table structure
3. Test API endpoints individually
4. Review Supabase logs for backend issues

## Future Enhancements

Potential additions:
- **Audio Integration**: Link sermon audio to questions
- **Group Features**: Small group discussion modes
- **Analytics**: Participation and engagement metrics
- **Notifications**: Remind users about unanswered questions
- **Themes**: Seasonal or topical sermon series
- **Multimedia**: Add images or videos to questions
