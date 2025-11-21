# Email Notifications Setup Guide

This guide explains how to set up automated email notifications for the CodeNITW Personal Plan Tracker.

## Features

The email notification system sends three scheduled emails daily to **beshubam@gmail.com**:

1. **Morning Targets Email** (7:00 AM IST)
   - Daily health targets
   - Money budget reminder
   - Personal plan goals

2. **Gym Reminder** (7:30 PM IST)
   - Motivational gym reminder
   - Workout goals

3. **End of Day Review** (11:00 PM IST)
   - Activity checklist
   - Missing data reminders
   - Daily summary

## Prerequisites

- Firebase project with Blaze (Pay-as-you-go) plan
- Node.js 18 or higher
- Firebase CLI installed (`npm install -g firebase-tools`)
- Gmail account for sending emails

## Setup Instructions

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase (if not already done)

```bash
firebase init functions
```

Select:
- Use existing project
- JavaScript
- ESLint: No (or Yes, your choice)
- Install dependencies: Yes

### 4. Install Dependencies

```bash
cd functions
npm install
```

### 5. Configure Email Credentials

You have two options:

#### Option A: Using Firebase Environment Config (Recommended)

```bash
firebase functions:config:set email.user="your-email@gmail.com"
firebase functions:config:set email.password="your-app-password"
```

**Important:** For Gmail, you need to use an App Password, not your regular password:
1. Go to https://myaccount.google.com/apppasswords
2. Create a new App Password for "Mail"
3. Copy the generated password
4. Use it in the config above

#### Option B: Using Environment Variables

Create a `.env` file in the `functions` directory:

```env
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

### 6. Update User ID

Edit `functions/index.js` and replace `USER_UID_HERE` with the actual Firebase Auth user ID:

```javascript
const userId = "USER_UID_HERE"; // Replace with actual user ID
```

To find your user ID:
1. Go to Firebase Console > Authentication
2. Find your user
3. Copy the User UID

### 7. Deploy Cloud Functions

```bash
firebase deploy --only functions
```

This will deploy three functions:
- `sendMorningTargetsEmail`
- `sendGymReminderEmail`
- `sendDayActivityFormEmail`

### 8. Verify Deployment

Check the Firebase Console:
1. Go to Firebase Console > Functions
2. Verify all three functions are deployed
3. Check the logs for any errors

### 9. Test Functions (Optional)

You can manually trigger functions for testing:

```bash
# Test morning email
firebase functions:shell
> sendMorningTargetsEmail()

# Or use the Firebase Console to test
```

## Email Schedules

All times are in IST (Indian Standard Time):

| Function | Time (IST) | Time (UTC) | Description |
|----------|------------|------------|-------------|
| Morning Targets | 7:00 AM | 1:30 AM | Daily goals and targets |
| Gym Reminder | 7:30 PM | 2:00 PM | Gym motivation |
| Day Activity Form | 11:00 PM | 5:30 PM | End of day review |

## Troubleshooting

### Emails Not Sending

1. **Check Gmail Security:**
   - Make sure you're using an App Password
   - Enable "Less secure app access" (not recommended)

2. **Check Function Logs:**
   ```bash
   firebase functions:log
   ```

3. **Check Firebase Console:**
   - Go to Functions > Logs
   - Look for error messages

### Wrong Timezone

If emails are arriving at the wrong time:
1. Verify the timezone is set to `Asia/Kolkata`
2. Check your Firebase project region

### Missing Data in Emails

If personal plan data is not showing:
1. Verify Firestore collections exist:
   - `user_personal_plans`
   - `user_health_tracking`
   - `user_money_tracking`
2. Check that the user ID is correct

## Cost Considerations

Firebase Cloud Functions with scheduled triggers on the Blaze plan:

- **Cloud Scheduler:** ~$0.10/month (3 jobs)
- **Function Invocations:** Free tier covers 2M invocations/month
- **Outbound Networking:** Minimal cost for emails

Expected monthly cost: **$0.10 - $1.00**

## Alternative Email Services

If you want to use a different email service:

### Using SendGrid

```bash
npm install @sendgrid/mail
```

Update `functions/index.js`:

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(functions.config().sendgrid.key);

// Replace nodemailer with sendgrid
await sgMail.send({
  to: RECIPIENT_EMAIL,
  from: 'your-verified-sender@example.com',
  subject: 'Subject',
  html: emailContent,
});
```

### Using Resend

```bash
npm install resend
```

Update `functions/index.js`:

```javascript
const { Resend } = require('resend');
const resend = new Resend(functions.config().resend.key);

await resend.emails.send({
  from: 'onboarding@resend.dev',
  to: RECIPIENT_EMAIL,
  subject: 'Subject',
  html: emailContent,
});
```

## Updating Email Templates

To customize email templates, edit the following functions in `functions/index.js`:

- `buildMorningEmail()` - Morning targets email
- `buildGymReminderEmail()` - Gym reminder email
- `buildDayActivityFormEmail()` - End of day review email

## Undeploying Functions

To remove the email functions:

```bash
firebase functions:delete sendMorningTargetsEmail
firebase functions:delete sendGymReminderEmail
firebase functions:delete sendDayActivityFormEmail
```

## Support

For issues:
1. Check Firebase Functions logs
2. Verify email configuration
3. Test with manual triggers
4. Check Firestore data structure

## Security Notes

- Never commit email credentials to git
- Use Firebase config or environment variables
- Use App Passwords for Gmail
- Consider using a dedicated email service for production
