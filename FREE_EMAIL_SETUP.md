# 🎉 FREE Email Notifications Setup (No Cost!)

## 🏆 Option 1: EmailJS (Recommended - Easiest)

**100% FREE:** 200 emails/month (enough for daily emails!)

### Step 1: Create EmailJS Account

1. Go to https://www.emailjs.com/
2. Sign up for FREE account
3. Verify your email

### Step 2: Connect Gmail

1. Go to **Email Services** tab
2. Click **Add New Service**
3. Select **Gmail**
4. Click **Connect Account**
5. Authorize with your Gmail
6. Copy the **Service ID** (e.g., `service_abc123`)

### Step 3: Create Email Templates

Create 3 templates:

#### Template 1: Morning Targets (7:00 AM)
- Go to **Email Templates** > **Create New Template**
- Template Name: `Morning Targets`
- Subject: `🌅 Good Morning! Here are your targets for {{date}}`
- Content:
```html
<h2>Good Morning! 🌅</h2>

<h3>Today's Health Targets:</h3>
<ul>
  <li>✅ 4 Meals (Breakfast, Lunch, Snacks, Dinner)</li>
  <li>💧 2.5L Water (10 points)</li>
  <li>🏋️ Gym 60 minutes (20 points)</li>
  <li>🍎 Fruits (10 points)</li>
  <li>🥜 Dry Fruits (10 points)</li>
  <li>😴 Sleep 7.5 hours (20 points)</li>
  <li>🚫 No Junk Food</li>
</ul>

<h3>Money Budget:</h3>
<p>💰 Daily Budget: ₹{{budget}}</p>
<p>🏦 Bank Balance: ₹{{bank_balance}}</p>

<h3>Today's Goals:</h3>
<p>{{goals}}</p>

<p><strong>Target Health Score: 80+</strong></p>
<p>Let's make today count! 💪</p>
```
- Copy the **Template ID** (e.g., `template_morning123`)

#### Template 2: Gym Reminder (7:30 PM)
- Template Name: `Gym Reminder`
- Subject: `💪 Time to Hit the Gym!`
- Content:
```html
<h2>Gym Time! 🏋️</h2>

<p>Hey there! It's 7:30 PM - time for your workout! 💪</p>

<h3>Today's Workout Goals:</h3>
<ul>
  <li>⏱️ Duration: 60+ minutes</li>
  <li>🔥 Give it your all!</li>
  <li>💯 Earn that 20 health points!</li>
</ul>

<p><strong>Remember:</strong> Every workout counts towards your health score!</p>
<p>Current health score: {{current_score}}/100</p>

<p>Let's do this! 🚀</p>
```
- Copy the **Template ID**

#### Template 3: End of Day Review (11:00 PM)
- Template Name: `Day Review`
- Subject: `🌙 End of Day Review - {{date}}`
- Content:
```html
<h2>Day Review 🌙</h2>

<h3>Health Tracker Status:</h3>
<ul>
  <li>Today's Health Score: {{health_score}}/100</li>
  <li>Meals: {{meals_count}}/4</li>
  <li>Water: {{water}}L</li>
  <li>Gym: {{gym_status}}</li>
  <li>Sleep: {{sleep_hours}} hours</li>
</ul>

<h3>Money Tracker Status:</h3>
<ul>
  <li>Today's Spending: ₹{{today_spending}}</li>
  <li>Budget: ₹{{budget}}</li>
  <li>Status: {{budget_status}}</li>
  <li>Bank Balance: ₹{{bank_balance}}</li>
</ul>

<h3>Missing Data:</h3>
<p>{{missing_data}}</p>

<p>Don't forget to update your trackers before bed! 😴</p>
```
- Copy the **Template ID**

### Step 4: Get Your Public Key

1. Go to **Account** > **General**
2. Copy your **Public Key** (e.g., `user_abc123xyz`)

### Step 5: Install EmailJS in Your Project

```bash
npm install @emailjs/browser
```

### Step 6: Add Email Scheduler Component

Create `src/services/EmailScheduler.js`:

```javascript
import emailjs from '@emailjs/browser';

// EmailJS Configuration
const EMAILJS_CONFIG = {
  serviceId: 'YOUR_SERVICE_ID',        // Replace with your Service ID
  publicKey: 'YOUR_PUBLIC_KEY',        // Replace with your Public Key
  templates: {
    morning: 'YOUR_MORNING_TEMPLATE_ID',   // Replace with Morning Template ID
    gym: 'YOUR_GYM_TEMPLATE_ID',          // Replace with Gym Template ID
    night: 'YOUR_NIGHT_TEMPLATE_ID'       // Replace with Night Template ID
  },
  recipientEmail: 'beshubam@gmail.com'    // Your email
};

// Initialize EmailJS
emailjs.init(EMAILJS_CONFIG.publicKey);

class EmailScheduler {
  constructor() {
    this.checkAndSendEmails();
    // Check every 5 minutes
    setInterval(() => this.checkAndSendEmails(), 5 * 60 * 1000);
  }

  checkAndSendEmails() {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    const today = now.toISOString().split('T')[0];

    // Check if already sent today
    const lastSent = JSON.parse(localStorage.getItem('emailsSentToday') || '{}');

    // Morning Email: 7:00 AM
    if (hour === 7 && minute < 5 && lastSent.morning !== today) {
      this.sendMorningEmail();
      lastSent.morning = today;
      localStorage.setItem('emailsSentToday', JSON.stringify(lastSent));
    }

    // Gym Reminder: 7:30 PM
    if (hour === 19 && minute >= 30 && minute < 35 && lastSent.gym !== today) {
      this.sendGymEmail();
      lastSent.gym = today;
      localStorage.setItem('emailsSentToday', JSON.stringify(lastSent));
    }

    // Night Review: 11:00 PM
    if (hour === 23 && minute < 5 && lastSent.night !== today) {
      this.sendNightEmail();
      lastSent.night = today;
      localStorage.setItem('emailsSentToday', JSON.stringify(lastSent));
    }
  }

  async sendMorningEmail() {
    try {
      // Get data from localStorage
      const moneyData = JSON.parse(localStorage.getItem('moneyTrackingData') || '{}');
      const budget = moneyData.settings?.dailyBudget || 1500;
      const bankBalance = moneyData.bankBalance || 0;

      const templateParams = {
        to_email: EMAILJS_CONFIG.recipientEmail,
        date: new Date().toLocaleDateString('en-IN'),
        budget: budget,
        bank_balance: bankBalance,
        goals: 'Complete all tasks and maintain health score above 80!'
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.morning,
        templateParams
      );
      console.log('✅ Morning email sent successfully!');
    } catch (error) {
      console.error('❌ Failed to send morning email:', error);
    }
  }

  async sendGymEmail() {
    try {
      const healthData = JSON.parse(localStorage.getItem('healthTrackingData') || '{}');
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = healthData.dailyEntries?.[today];

      // Calculate current score (basic calculation)
      let currentScore = 0;
      if (todayEntry) {
        const meals = todayEntry.meals || {};
        currentScore += Object.values(meals).filter(m => m?.checked).length * 10;
        // Add other score calculations...
      }

      const templateParams = {
        to_email: EMAILJS_CONFIG.recipientEmail,
        current_score: currentScore
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.gym,
        templateParams
      );
      console.log('✅ Gym reminder email sent successfully!');
    } catch (error) {
      console.error('❌ Failed to send gym email:', error);
    }
  }

  async sendNightEmail() {
    try {
      // Get health data
      const healthData = JSON.parse(localStorage.getItem('healthTrackingData') || '{}');
      const today = new Date().toISOString().split('T')[0];
      const todayEntry = healthData.dailyEntries?.[today] || {};

      const meals = todayEntry.meals || {};
      const mealsCount = Object.values(meals).filter(m => m?.checked).length;
      const water = todayEntry.food?.water || 0;
      const gymStatus = todayEntry.gym?.attended ? `✅ ${todayEntry.gym.duration || 0} minutes` : '❌ Not done';
      const sleepHours = todayEntry.sleep?.hours || 0;

      // Calculate health score (simplified)
      let healthScore = mealsCount * 10 + Math.min(10, water * 2.5);
      if (todayEntry.gym?.attended) healthScore += 20;
      if (todayEntry.food?.fruits?.had) healthScore += 10;
      if (todayEntry.food?.dry_fruits?.had) healthScore += 10;
      if (sleepHours >= 7) healthScore += 20;
      if (todayEntry.food?.junk?.had) healthScore -= 20;
      healthScore = Math.max(0, Math.min(100, healthScore));

      // Get money data
      const moneyData = JSON.parse(localStorage.getItem('moneyTrackingData') || '{}');
      const todaySpending = moneyData.dailyEntries?.[today] || {};
      const totalSpending = Object.values(todaySpending).reduce((sum, v) => {
        return sum + (typeof v === 'object' ? (v.amount || 0) : v);
      }, 0);
      const budget = moneyData.settings?.dailyBudget || 1500;
      const budgetStatus = totalSpending <= budget ? '✅ Within budget' : '⚠️ Over budget';
      const bankBalance = moneyData.bankBalance || 0;

      // Find missing data
      const missing = [];
      if (mealsCount < 4) missing.push(`Missing ${4 - mealsCount} meal(s)`);
      if (water < 2.5) missing.push('Water intake incomplete');
      if (!todayEntry.gym?.attended) missing.push('Gym not recorded');
      if (sleepHours === 0) missing.push('Sleep data missing');

      const templateParams = {
        to_email: EMAILJS_CONFIG.recipientEmail,
        date: new Date().toLocaleDateString('en-IN'),
        health_score: healthScore,
        meals_count: mealsCount,
        water: water,
        gym_status: gymStatus,
        sleep_hours: sleepHours,
        today_spending: Math.round(totalSpending),
        budget: budget,
        budget_status: budgetStatus,
        bank_balance: bankBalance,
        missing_data: missing.length > 0 ? missing.join(', ') : '✅ All data complete!'
      };

      await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templates.night,
        templateParams
      );
      console.log('✅ Night review email sent successfully!');
    } catch (error) {
      console.error('❌ Failed to send night email:', error);
    }
  }

  // Manual trigger for testing
  sendTestEmail(type) {
    switch(type) {
      case 'morning':
        return this.sendMorningEmail();
      case 'gym':
        return this.sendGymEmail();
      case 'night':
        return this.sendNightEmail();
      default:
        console.error('Invalid email type');
    }
  }
}

export default new EmailScheduler();
```

### Step 7: Initialize in Your App

Add to `src/App.jsx` or `src/index.jsx`:

```javascript
import EmailScheduler from './services/EmailScheduler';

// Initialize email scheduler (will run automatically)
// EmailScheduler is already initialized as a singleton
```

### Step 8: Test Manually

Open browser console and run:
```javascript
// Import the scheduler
import('./services/EmailScheduler').then(module => {
  // Send test emails
  module.default.sendTestEmail('morning');  // Test morning email
  module.default.sendTestEmail('gym');      // Test gym email
  module.default.sendTestEmail('night');    // Test night email
});
```

---

## 🚀 Option 2: GitHub Actions (Completely Free)

**100% FREE:** Unlimited emails with Resend (3000/month free)

### Setup (10 minutes):

1. **Create `.github/workflows/send-emails.yml`:**

```yaml
name: Send Daily Emails

on:
  schedule:
    # Morning: 7:00 AM IST = 1:30 AM UTC
    - cron: '30 1 * * *'
    # Gym: 7:30 PM IST = 2:00 PM UTC
    - cron: '0 14 * * *'
    # Night: 11:00 PM IST = 5:30 PM UTC
    - cron: '30 17 * * *'
  workflow_dispatch:  # Manual trigger for testing

jobs:
  send-email:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Send Email
        env:
          RESEND_API_KEY: ${{ secrets.RESEND_API_KEY }}
          RECIPIENT_EMAIL: beshubam@gmail.com
        run: |
          node .github/scripts/send-email.js
```

2. **Sign up at Resend.com** (Free: 3000 emails/month)
3. **Add API key to GitHub Secrets**
4. **Emails sent automatically by GitHub!**

---

## 📊 Comparison:

| Feature | EmailJS | GitHub Actions | Firebase (Paid) |
|---------|---------|----------------|-----------------|
| Cost | 100% FREE | 100% FREE | $0.10-$1/month |
| Setup Time | 5 min | 10 min | 15 min |
| Emails/Month | 200 | 3000 | Unlimited |
| Reliability | 99% | 99.9% | 99.9% |
| Requires App Open | Yes (browser check) | No (automatic) | No (automatic) |

---

## 🎯 My Recommendation:

**Use EmailJS** if you want:
- ✅ Quick 5-minute setup
- ✅ No configuration needed
- ✅ Works immediately
- ⚠️ Browser must be open for checks

**Use GitHub Actions** if you want:
- ✅ Fully automatic (no browser needed)
- ✅ More reliable
- ✅ More emails (3000/month)
- ⚠️ Slightly more complex setup

---

## 🔥 Want Me to Implement It?

Just say which option you prefer, and I'll:
1. Install the dependencies
2. Add the code to your project
3. Give you step-by-step config instructions
4. Test it for you

**100% FREE. Zero monthly cost. No credit card needed.** 🎉
