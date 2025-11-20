/**
 * AIInsightsService - Analyze spending and health data using free AI models
 * Uses OpenRouter API with free models for insights
 */

class AIInsightsService {
  constructor() {
    this.API_URL = "https://openrouter.ai/api/v1/chat/completions";
    this.FREE_MODEL = "meta-llama/llama-3.2-3b-instruct:free"; // Free model
    this.API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY || "";
  }

  /**
   * Analyze spending data and provide insights
   * @param {object} analysis - Spending analysis from MoneyTrackingService
   * @param {object} trends - Spending trends data
   * @returns {Promise<string>} AI-generated insights
   */
  async analyzeSpending(analysis, trends) {
    if (!this.API_KEY) {
      return "⚠️ AI Insights not configured. Add VITE_OPENROUTER_API_KEY to your .env file.\n\nGet a free API key at: https://openrouter.ai/keys";
    }

    try {
      const prompt = this.buildSpendingPrompt(analysis, trends);
      const response = await this.callAI(prompt);
      return response;
    } catch (error) {
      console.error("AI Insights error:", error);
      return `❌ Error getting AI insights: ${error.message}`;
    }
  }

  /**
   * Analyze health data and provide insights
   * @param {object} stats - Health stats from HealthTrackingService
   * @param {number} period - Period in days
   * @returns {Promise<string>} AI-generated insights
   */
  async analyzeHealth(stats, period) {
    if (!this.API_KEY) {
      return "⚠️ AI Insights not configured. Add VITE_OPENROUTER_API_KEY to your .env file.\n\nGet a free API key at: https://openrouter.ai/keys";
    }

    try {
      const prompt = this.buildHealthPrompt(stats, period);
      const response = await this.callAI(prompt);
      return response;
    } catch (error) {
      console.error("AI Insights error:", error);
      return `❌ Error getting AI insights: ${error.message}`;
    }
  }

  /**
   * Build prompt for spending analysis
   */
  buildSpendingPrompt(analysis, trends) {
    const breakdownText = analysis.breakdown
      .map(cat => `- ${cat.name}: ₹${cat.amount} (${cat.percentage}%)`)
      .join("\n");

    const trendText = trends
      .map(t => `- ${t.label}: ₹${t.total}`)
      .join("\n");

    return `You are a financial advisor. Analyze this spending data and provide 3-5 actionable insights and recommendations.

**Overall Statistics (Last ${analysis.period} days):**
- Total Spent: ₹${analysis.total}
- Daily Average: ₹${analysis.dailyAverage}
- Daily Target: ₹1200

**Spending Breakdown:**
${breakdownText}

**Recent Daily Trends:**
${trendText}

Provide concise, practical advice on:
1. Where to reduce spending
2. Spending patterns to watch
3. Budget optimization tips
4. Any concerning trends

Keep response under 200 words, use bullet points, be specific and actionable.`;
  }

  /**
   * Build prompt for health analysis
   */
  buildHealthPrompt(stats, period) {
    const foodText = Object.entries(stats.food)
      .map(([id, data]) => `- ${id}: ${data.percentage}% consistency`)
      .join("\n");

    const exerciseText = Object.entries(stats.exerciseCount)
      .map(([exercise, count]) => `- ${exercise}: ${count} times`)
      .join("\n");

    return `You are a health and wellness advisor. Analyze this health tracking data and provide 3-5 actionable insights.

**Period:** Last ${period} days

**Sleep:**
- Average: ${stats.averageSleep} hours/night
- Target: 8 hours

**Exercise:**
- Gym Days: ${stats.gymDays} (${stats.gymPercentage}% of days)
- Average Duration: ${stats.avgGymDuration} minutes
- Target: 5 days/week, 60 minutes

**Exercise Types:**
${exerciseText || "No exercise data"}

**Food Consistency:**
${foodText}

Provide concise, practical advice on:
1. Sleep improvement strategies
2. Exercise routine optimization
3. Nutrition recommendations
4. Habit-building tips

Keep response under 200 words, use bullet points, be specific and actionable.`;
  }

  /**
   * Call OpenRouter AI API
   */
  async callAI(prompt) {
    const response = await fetch(this.API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${this.API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.origin,
        "X-Title": "CodeNITW - Personal Plan Tracker",
      },
      body: JSON.stringify({
        model: this.FREE_MODEL,
        messages: [
          {
            role: "user",
            content: prompt,
          },
        ],
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || `API Error: ${response.status}`);
    }

    const data = await response.json();
    return data.choices[0].message.content.trim();
  }

  /**
   * Combined analysis for both spending and health
   */
  async analyzeCombined(spendingAnalysis, spendingTrends, healthStats, healthPeriod) {
    if (!this.API_KEY) {
      return "⚠️ AI Insights not configured. Add VITE_OPENROUTER_API_KEY to your .env file.\n\nGet a free API key at: https://openrouter.ai/keys";
    }

    try {
      const prompt = `You are a life coach analyzing both financial and health data. Provide holistic insights.

**Financial Summary:**
- Total Spent (30d): ₹${spendingAnalysis.total}
- Daily Average: ₹${spendingAnalysis.dailyAverage}
- Target: ₹1200/day

**Health Summary:**
- Sleep: ${healthStats.averageSleep}h (target: 8h)
- Gym: ${healthStats.gymDays} days (target: 5 days/week)
- Gym Duration: ${healthStats.avgGymDuration} min (target: 60 min)

Provide 3-4 insights connecting finances and health habits. How do they influence each other? Any recommended changes?

Keep response under 150 words, use bullet points.`;

      const response = await this.callAI(prompt);
      return response;
    } catch (error) {
      console.error("AI Insights error:", error);
      return `❌ Error getting AI insights: ${error.message}`;
    }
  }
}

const aiInsightsService = new AIInsightsService();
export default aiInsightsService;
