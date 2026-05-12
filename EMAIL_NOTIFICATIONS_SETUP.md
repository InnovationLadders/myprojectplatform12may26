# Email Notifications Setup Guide

This document provides instructions for setting up and configuring the email notification system integrated into the Mashroui Platform.

## Overview

The platform now sends automated email notifications for two key events:

1. **First Daily Chat Message** - Sends an email to all team members and the supervisor when the first message of the day is posted in a project chat room.
2. **Project Creation** - Sends an email to all team members and the supervisor when a new project is created.

## Features

### First Daily Chat Message Notification
- Detects the first message sent in a project each day
- Sends personalized emails to all project team members (except the sender)
- Sends email to the project supervisor/teacher
- Includes message preview and direct link to chat room
- Tracks notification history to prevent duplicate emails
- Beautiful, responsive HTML email template with Arabic RTL support

### Project Creation Notification
- Automatically triggers when a new project is created with team members
- Sends personalized emails to each student showing their role
- Sends comprehensive email to supervisor with full team overview
- Includes complete project details (title, description, category, difficulty, deadline)
- Provides direct link to project details page
- Professional HTML email template with responsive design

## Setup Instructions

### 1. Sign Up for Resend

1. Go to [https://resend.com](https://resend.com) and create an account
2. Verify your email address
3. Navigate to the API Keys section in your dashboard
4. Create a new API key and copy it

### 2. Configure Environment Variables

Open your `.env` file and update the following variables:

```bash
# Resend Email Service Configuration
VITE_RESEND_API_KEY=re_your_actual_api_key_here
VITE_FROM_EMAIL=noreply@yourdomain.com
VITE_APP_URL=https://yourapp.com
```

**Important Notes:**
- Replace `re_your_actual_api_key_here` with your actual Resend API key
- Replace `noreply@yourdomain.com` with a verified email address from your Resend account
- Replace `https://yourapp.com` with your actual application URL (used for generating links in emails)

### 3. Verify Email Domain (Production)

For production use, you need to verify your domain with Resend:

1. Log in to your Resend dashboard
2. Go to Settings > Domains
3. Click "Add Domain"
4. Follow the instructions to add DNS records to your domain
5. Wait for verification (usually takes a few minutes)

**For Development/Testing:**
You can use Resend's sandbox mode which allows sending emails to verified addresses without domain verification.

## Email Templates

### Template Customization

The email templates are located in `src/services/emailService.ts`. You can customize:

- Color schemes
- Logo and branding
- Text content
- Layout and styling

Both templates are fully responsive and support RTL (right-to-left) layout for Arabic content.

## Database Schema

### Email Notifications Collection

The system automatically creates an `email_notifications` collection in Firestore to track sent emails:

```typescript
{
  type: 'first_daily_chat' | 'project_created',
  projectId: string,
  recipientEmail: string,
  recipientName: string,
  status: 'sent' | 'failed',
  error?: string,
  sentAt: Timestamp,
  createdAt: Timestamp
}
```

### Projects Collection - New Field

A new field `last_chat_notification` is added to the projects collection:

```typescript
{
  last_chat_notification: Timestamp  // Tracks when the last chat notification was sent
}
```

## Testing

### Testing Email Notifications

1. **First Daily Chat Message:**
   - Create a project with multiple team members
   - Open the project chat
   - Send a message
   - Check that team members receive an email (only first message of the day)
   - Send another message - no email should be sent

2. **Project Creation:**
   - Create a new project with team members
   - Verify that all team members receive an email
   - Verify that the supervisor receives an email
   - Check the Firestore `email_notifications` collection for logs

### Viewing Email Logs

Check the Firestore `email_notifications` collection to:
- Verify emails were sent successfully
- Debug failed email deliveries
- Monitor email sending activity

## Troubleshooting

### Emails Not Being Sent

1. **Check API Key:** Ensure your Resend API key is correctly set in `.env`
2. **Check From Email:** Verify the from email is verified in your Resend account
3. **Check Console Logs:** Look for error messages in browser console
4. **Check Firestore:** Review the `email_notifications` collection for error details

### Email Delivery Issues

1. **Spam Folder:** Check recipient spam folders
2. **Domain Verification:** Ensure your domain is verified in Resend (for production)
3. **Rate Limits:** Check if you've exceeded Resend's rate limits

### Common Errors

**Error: "Invalid API key"**
- Solution: Double-check your Resend API key in `.env`

**Error: "From email not verified"**
- Solution: Verify your from email address in Resend dashboard

**Error: "Email not found"**
- Solution: Ensure user documents in Firestore have valid email fields

## API Rate Limits

Resend free tier includes:
- 100 emails per day
- 3,000 emails per month

For higher volumes, upgrade to a paid plan.

## Security Best Practices

1. **Never commit `.env` file** to version control
2. **Use environment variables** for sensitive configuration
3. **Validate email addresses** before sending
4. **Implement retry logic** for failed sends (already implemented)
5. **Monitor email logs** regularly

## Email Template Guidelines

When customizing email templates:

1. **Keep HTML simple** - Complex CSS may not render in all email clients
2. **Use inline styles** - External CSS is often stripped by email clients
3. **Test across clients** - Gmail, Outlook, Apple Mail, etc.
4. **Support RTL layout** - Use `dir="rtl"` for Arabic content
5. **Include plain text alternative** - For accessibility

## Support

For issues related to:
- **Email delivery:** Contact Resend support at [https://resend.com/support](https://resend.com/support)
- **Platform integration:** Check application logs and Firestore collections
- **Template customization:** Refer to HTML email best practices

## Additional Features (Future Enhancements)

Potential future enhancements:
- User email preference settings (opt-in/opt-out)
- Email digest/summary notifications
- Notification for task assignments
- Notification for project deadline reminders
- Email templates in multiple languages
- Advanced email tracking and analytics

## Technical Details

### Architecture

- **Email Service:** `src/services/emailService.ts`
- **Integration Points:**
  - `src/components/ProjectChat/ProjectChat.tsx` (chat notifications)
  - `src/hooks/useProjects.ts` (project creation notifications)
- **Email Provider:** Resend (https://resend.com)
- **Database:** Firestore (email logs and tracking)

### Dependencies

- `resend`: ^6.4.2 - Email service SDK

### Notification Flow

1. **First Chat Message:**
   ```
   User sends message
   → Check if first message today
   → Get project team members
   → Filter out sender
   → Fetch user emails
   → Send personalized emails
   → Update last_chat_notification timestamp
   → Log to Firestore
   ```

2. **Project Creation:**
   ```
   Project created with students
   → Add students to project
   → Fetch student and supervisor details
   → Send personalized emails to each student
   → Send comprehensive email to supervisor
   → Log to Firestore
   ```

## License

This email notification system is part of the Mashroui Platform.

---

**Last Updated:** November 2024
**Version:** 1.0.0
