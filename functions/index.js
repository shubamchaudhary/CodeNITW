const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

admin.initializeApp();

// Email configuration - use environment variables
const EMAIL_CONFIG = {
  service: "gmail", // or "smtp" for custom
  auth: {
    user: functions.config().email?.user || process.env.EMAIL_USER,
    pass: functions.config().email?.password || process.env.EMAIL_PASSWORD,
  },
};

// Recipient email (as requested by user)
const RECIPIENT_EMAIL = "beshubam@gmail.com";

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport(EMAIL_CONFIG);
};

/**
 * Morning Email - Daily Targets
 * Scheduled to run every day at 7:00 AM IST (1:30 AM UTC)
 */
exports.sendMorningTargetsEmail = functions
  .pubsub
  .schedule("30 1 * * *") // 1:30 AM UTC = 7:00 AM IST
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      console.log("Running morning targets email...");

      // Fetch user's data from Firestore
      // Assuming the user has a specific UID - update this
      const userId = "USER_UID_HERE"; // Replace with actual user ID

      const [personalPlanDoc, healthDoc, moneyDoc] = await Promise.all([
        admin.firestore().collection("user_personal_plans").doc(userId).get(),
        admin.firestore().collection("user_health_tracking").doc(userId).get(),
        admin.firestore().collection("user_money_tracking").doc(userId).get(),
      ]);

      const personalPlan = personalPlanDoc.data() || {};
      const healthData = healthDoc.data() || {};
      const moneyData = moneyDoc.data() || {};

      // Get today's date key
      const today = new Date();
      const dateKey = formatDate(today);

      // Build email content
      const emailContent = buildMorningEmail(personalPlan, healthData, moneyData, dateKey);

      // Send email
      const transporter = createTransporter();
      await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: RECIPIENT_EMAIL,
        subject: `📅 Daily Targets - ${formatDateReadable(today)}`,
        html: emailContent,
      });

      console.log("Morning targets email sent successfully!");
      return null;
    } catch (error) {
      console.error("Error sending morning targets email:", error);
      throw error;
    }
  });

/**
 * Gym Reminder - 7:30 PM IST
 * Scheduled to run every day at 7:30 PM IST (2:00 PM UTC)
 */
exports.sendGymReminderEmail = functions
  .pubsub
  .schedule("0 14 * * *") // 2:00 PM UTC = 7:30 PM IST
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      console.log("Running gym reminder email...");

      const emailContent = buildGymReminderEmail();

      const transporter = createTransporter();
      await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: RECIPIENT_EMAIL,
        subject: "💪 Gym Time Alert!",
        html: emailContent,
      });

      console.log("Gym reminder email sent successfully!");
      return null;
    } catch (error) {
      console.error("Error sending gym reminder email:", error);
      throw error;
    }
  });

/**
 * Day Activity Form - 11:00 PM IST
 * Scheduled to run every day at 11:00 PM IST (5:30 PM UTC)
 */
exports.sendDayActivityFormEmail = functions
  .pubsub
  .schedule("30 17 * * *") // 5:30 PM UTC = 11:00 PM IST
  .timeZone("Asia/Kolkata")
  .onRun(async (context) => {
    try {
      console.log("Running day activity form email...");

      // Fetch user's data to check what's missing
      const userId = "USER_UID_HERE"; // Replace with actual user ID

      const [healthDoc, moneyDoc] = await Promise.all([
        admin.firestore().collection("user_health_tracking").doc(userId).get(),
        admin.firestore().collection("user_money_tracking").doc(userId).get(),
      ]);

      const healthData = healthDoc.data() || {};
      const moneyData = moneyDoc.data() || {};

      const today = new Date();
      const dateKey = formatDate(today);

      // Check what activities are missing
      const todayHealth = healthData.dailyEntries?.[dateKey] || {};
      const todayMoney = moneyData.dailyEntries?.[dateKey] || {};

      const emailContent = buildDayActivityFormEmail(todayHealth, todayMoney, dateKey);

      const transporter = createTransporter();
      await transporter.sendMail({
        from: EMAIL_CONFIG.auth.user,
        to: RECIPIENT_EMAIL,
        subject: `📝 End of Day Review - ${formatDateReadable(today)}`,
        html: emailContent,
      });

      console.log("Day activity form email sent successfully!");
      return null;
    } catch (error) {
      console.error("Error sending day activity form email:", error);
      throw error;
    }
  });

// ==================== EMAIL BUILDERS ====================

function buildMorningEmail(personalPlan, healthData, moneyData, dateKey) {
  const today = new Date();

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; border-left: 4px solid #667eea; }
        .section h2 { color: #667eea; margin-top: 0; }
        .target { padding: 10px; margin: 5px 0; background: white; border-radius: 5px; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
        .emoji { font-size: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌅 Good Morning!</h1>
          <p>${formatDateReadable(today)}</p>
        </div>

        <div class="section">
          <h2><span class="emoji">🎯</span> Today's Focus</h2>
          <p>Start your day with purpose and determination!</p>
        </div>

        <div class="section">
          <h2><span class="emoji">💪</span> Health Targets</h2>
          <div class="target">✅ Complete all 4 meals (Breakfast, Lunch, Dinner, Snacks)</div>
          <div class="target">✅ Sleep 8 hours tonight</div>
          <div class="target">✅ Hit the gym (60 min session)</div>
          <div class="target">✅ Track food intake and water</div>
        </div>

        <div class="section">
          <h2><span class="emoji">💰</span> Money Target</h2>
          <div class="target">✅ Stay within ₹1200 daily budget</div>
          <div class="target">✅ Track all expenses with notes</div>
        </div>

        <div class="section">
          <h2><span class="emoji">📚</span> Personal Plan</h2>
          <div class="target">Review your goals and make progress today!</div>
        </div>

        <div class="footer">
          <p>This is your automated daily reminder from CodeNITW Personal Plan Tracker</p>
          <p>Visit your dashboard to track progress throughout the day</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildGymReminderEmail() {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; text-align: center; }
        .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 50px; border-radius: 10px; }
        .emoji { font-size: 80px; margin: 20px 0; }
        h1 { margin: 10px 0; font-size: 36px; }
        .message { font-size: 18px; padding: 20px; }
        .tips { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: left; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="emoji">💪</div>
          <h1>GYM TIME!</h1>
          <p>It's 7:30 PM - Time to hit the gym!</p>
        </div>

        <div class="message">
          <p><strong>Don't skip today!</strong></p>
          <p>Your body will thank you for showing up 💯</p>
        </div>

        <div class="tips">
          <h3>🎯 Today's Workout Goals:</h3>
          <ul>
            <li>60 minutes of focused training</li>
            <li>Log your exercises in the tracker</li>
            <li>Stay hydrated 💧</li>
            <li>Give it your 100%!</li>
          </ul>
        </div>

        <div class="footer">
          <p>Automated gym reminder from CodeNITW Personal Plan Tracker</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

function buildDayActivityFormEmail(todayHealth, todayMoney, dateKey) {
  const hasMeals = Object.keys(todayHealth.meals || {}).length > 0;
  const hasFood = Object.keys(todayHealth.food || {}).length > 0;
  const hasSleep = todayHealth.sleep?.bedTime && todayHealth.sleep?.wakeTime;
  const hasGym = todayHealth.gym?.attended;
  const hasSpending = Object.keys(todayMoney || {}).length > 0;

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%); color: white; padding: 30px; text-align: center; border-radius: 10px; }
        .section { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 8px; }
        .checklist { list-style: none; padding: 0; }
        .checklist li { padding: 10px; margin: 5px 0; background: white; border-radius: 5px; }
        .complete { color: #28a745; }
        .incomplete { color: #dc3545; }
        .cta { background: #667eea; color: white; padding: 15px 30px; text-decoration: none; border-radius: 5px; display: inline-block; margin: 20px 0; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1>🌙 End of Day Review</h1>
          <p>${dateKey}</p>
        </div>

        <div class="section">
          <h2>📋 Today's Activity Checklist</h2>
          <ul class="checklist">
            <li class="${hasMeals ? 'complete' : 'incomplete'}">
              ${hasMeals ? '✅' : '❌'} Meal Tracking
            </li>
            <li class="${hasFood ? 'complete' : 'incomplete'}">
              ${hasFood ? '✅' : '❌'} Food Intake Logged
            </li>
            <li class="${hasSleep ? 'complete' : 'incomplete'}">
              ${hasSleep ? '✅' : '❌'} Sleep Schedule Recorded
            </li>
            <li class="${hasGym ? 'complete' : 'incomplete'}">
              ${hasGym ? '✅' : '❌'} Gym Session Logged
            </li>
            <li class="${hasSpending ? 'complete' : 'incomplete'}">
              ${hasSpending ? '✅' : '❌'} Daily Spending Tracked
            </li>
          </ul>
        </div>

        ${!hasMeals || !hasFood || !hasSleep || !hasGym || !hasSpending ? `
          <div class="section">
            <h3>⚠️ Missing Data</h3>
            <p>Don't forget to log your activities before sleeping!</p>
            <p>Consistent tracking helps you achieve your goals.</p>
          </div>
        ` : `
          <div class="section">
            <h3>🎉 Great Job!</h3>
            <p>You've tracked all your activities today. Keep it up!</p>
          </div>
        `}

        <div style="text-align: center;">
          <a href="YOUR_APP_URL" class="cta">Open Dashboard</a>
        </div>

        <div class="footer">
          <p>End of day reminder from CodeNITW Personal Plan Tracker</p>
        </div>
      </div>
    </body>
    </html>
  `;
}

// ==================== HELPER FUNCTIONS ====================

function formatDate(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function formatDateReadable(date) {
  const options = { weekday: "long", year: "numeric", month: "long", day: "numeric" };
  return date.toLocaleDateString("en-US", options);
}
