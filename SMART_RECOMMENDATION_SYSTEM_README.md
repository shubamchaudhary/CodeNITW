# 🧠 Smart Recommendation System for CodeNITW

## Overview

The Smart Recommendation System provides personalized question recommendations, 45-day study planning, and intelligent progress tracking to help you prepare for Java Spring Boot Developer interviews.

**Note:** This is an intelligent algorithm-based system (not AI/ML models like GPT or Claude). It uses weighted algorithms and market analysis to generate personalized recommendations.

## Features

### 1. 🎯 Smart Question Recommendations

The system analyzes your progress and suggests questions based on:

#### Priority System:
- **⭐ Starred Questions (30%)** - Questions you marked as important get highest priority
- **📊 Weak Area Questions (40%)** - Questions from topics where you have <30% completion
- **🔥 Trending Topics (20%)** - Questions from market-trending interview topics
- **🔄 Revision Questions (10%)** - Previously solved questions for revision

#### Priority Levels:
- **CRITICAL** - Starred questions you haven't solved yet
- **HIGH** - Weak area questions and company-specific questions
- **MEDIUM** - Trending topic questions
- **LOW** - Revision recommendations

### 2. 📅 45-Day Study Plan (Nov 13 - Dec 28, 2025)

Get a personalized day-by-day study plan tailored for your job switch preparation:

#### Daily Structure:
- **DSA Questions**: Calculated based on your remaining unsolved questions
- **System Design**: Deep dives every 10 days on topics like:
  - URL Shortener Design
  - Instagram Architecture
  - Rate Limiter Design
  - Notification System
  - Chat Application
  - API Gateway
  - Distributed Cache

- **Topic Study**: Focused learning on weak areas (first 20 days)
- **Interview Prep**: Interview-specific topics (last 25 days)
- **Revision Days**: Weekly reviews (every 7 days)
- **Mock Interviews**: Practice sessions every 5 days

#### Progress Tracking:
- ✅ Mark questions as completed
- 📈 Track daily completion rate
- 🔄 Auto-replan based on your actual progress
- 🎯 Visual progress indicators

### 3. 💼 External Question Recommendations

Get suggestions for:
- **Company-specific questions** from Amazon, Google, Microsoft, Uber, Netflix
- **Trending interview questions** for 2024-2025
- **LeetCode problems** relevant to your weak areas
- Direct links to practice platforms

### 4. 📚 Topics to Learn for Job Switch

Comprehensive learning path for 2 YoE Java Spring Boot Developer:

#### Must Learn (2-3 weeks):
- **System Design**
  - Microservices Architecture Patterns
  - API Gateway & Load Balancing
  - Database Sharding & Replication
  - Caching Strategies (Redis, CDN)
  - Message Queues (Kafka, RabbitMQ)
  - Event-Driven Architecture

#### Important (2 weeks):
- **Java Advanced**
  - Multithreading & Concurrency
  - Java Memory Model
  - Garbage Collection
  - JVM Internals
  - Stream API & Functional Programming
  - Design Patterns in Java

#### Spring Boot Advanced (1-2 weeks):
- Spring Security (JWT, OAuth)
- Spring Cloud & Microservices
- Spring Data JPA Advanced
- Caching with Spring
- Testing (JUnit, Mockito, TestContainers)
- Spring Actuator & Monitoring

#### DevOps & Cloud (1 week):
- Docker & Containerization
- Kubernetes Basics
- Azure Services
- CI/CD with GitHub Actions
- Monitoring & Logging

#### Behavioral & Soft Skills:
- STAR method
- Project explanation techniques
- Leadership examples
- Conflict resolution

### 5. 🔄 Dynamic Replanning

The system automatically adjusts your plan based on:
- **Progress Rate**: If you're completing less than 80% of daily goals
- **Days Remaining**: Redistributes work across remaining days
- **Updated Analysis**: Re-evaluates weak areas and priorities

## How to Use

### Getting Started

1. **Navigate to Personal Plan**: Go to the "Personal Plan" section in CodeNITW
2. **Scroll Down**: Find the "Smart Recommendation System" section at the bottom
3. **Login Required**: Make sure you're logged in with Google OAuth

### Viewing Recommendations

1. **Click "Refresh"**: Load your personalized recommendations
2. **View Analytics**: See your total questions, solved, starred, and completion percentage
3. **Browse Recommendations**: Questions are grouped by priority (CRITICAL, HIGH, MEDIUM, LOW)
4. **Click on Questions**: Automatically scrolls to that topic in your personal plan
5. **Open Links**: Click the external link icon to open questions on LeetCode

### Generating 45-Day Plan

1. **Switch to "45-Day Plan" Tab**
2. **Click "Generate Plan"**: Creates your personalized study schedule
3. **View Daily Tasks**:
   - Select any day from the calendar view
   - See DSA questions and topics for that day
   - Current day is highlighted in blue
   - Completed days show in green
   - Past incomplete days show in red

### Tracking Daily Progress

1. **Select Current Day**: Click on today's date
2. **Mark Questions Complete**: Check off questions as you solve them
3. **Review Topics**: Read through topics you need to study
4. **EOD Review**: At end of day, mark all completed items
5. **Replan if Needed**: Click "Replan" button to adjust future days based on your progress

### Learning Topics

1. **Switch to "Topics to Learn" Tab**
2. **Browse Categories**: Review all topics organized by importance
3. **Check Resources**: Each category has recommended learning resources
4. **Track Time**: Estimated time to complete each category

## Technical Details

### Data Storage

All data is stored in Firebase Firestore:

#### Collections:
- `user_progress`: Your solved and starred questions
- `user_daily_plans`: Your 45-day plan with progress

#### Local Storage:
- `PersonalDSASolvedQuestions`: Synced with Firebase
- `PersonalDSAStarredQuestions`: Synced with Firebase

### Smart Algorithm

The recommendation engine uses a weighted algorithm that considers:

1. **Completion Rate per Topic**: Identifies weak areas (<30% solved)
2. **Interview Weight**: Based on market trends for Java Spring Boot roles
3. **User Preferences**: Starred questions get highest priority
4. **Balanced Distribution**: 30% starred, 40% weak areas, 20% trending, 10% revision

### Market Trend Analysis

Based on 2024-2025 interview trends:
- System Design (25% weight)
- Data Structures (20% weight)
- Algorithms (20% weight)
- Java Specific (15% weight)
- Spring Boot (10% weight)
- Problem Solving (10% weight)

## Tips for Success

### Daily Routine

1. **Morning (1 hour)**:
   - Review today's topic to learn
   - Watch videos or read articles on the topic

2. **Mid-Day (2-3 hours)**:
   - Solve recommended DSA questions
   - Focus on CRITICAL and HIGH priority first
   - Take notes on patterns you learn

3. **Evening (1 hour)**:
   - Review starred questions
   - Practice mock interviews (every 5 days)
   - Update progress in the app

4. **EOD (15 minutes)**:
   - Mark completed questions
   - Reflect on what you learned
   - Star difficult questions for revision

### Maximizing Smart Recommendations

1. **Star Important Questions**: System prioritizes these in recommendations
2. **Solve Consistently**: Better progress rates = more accurate replanning
3. **Review Weak Areas**: System identifies topics you struggle with
4. **Check Trending**: Stay updated with current interview trends
5. **Use External Links**: Practice on actual coding platforms

### Preparation Strategy

#### Weeks 1-2 (Nov 13-26):
- Focus on **weak areas** identified by the system
- Complete **starred questions**
- Study **System Design basics**

#### Weeks 3-4 (Nov 27-Dec 10):
- Tackle **trending topics**
- Deep dive into **Java Advanced** concepts
- Practice **mock interviews**

#### Weeks 5-6 (Dec 11-24):
- **Revision mode**: Review all solved questions
- Focus on **behavioral interviews**
- Company-specific preparation

#### Final Week (Dec 25-28):
- **Light practice**: 2-3 questions daily
- **Review notes** and key concepts
- **Mock interviews**: 1 per day
- **Rest and confidence building**

## Troubleshooting

### Recommendations Not Loading
- Ensure you're logged in
- Check internet connection
- Try refreshing the page

### Plan Not Saving
- Verify Firebase connection
- Check browser console for errors
- Clear cache and try again

### Progress Not Syncing
- Use "Save to Cloud" button
- Wait for sync confirmation
- Check "Sync Dashboard" for status

## Future Enhancements

Coming soon:
- 🤝 Integration with real AI APIs (OpenAI/Claude)
- 📊 Advanced analytics and insights
- 🏆 Achievement badges and milestones
- 👥 Peer comparison and leaderboards
- 📱 Mobile app notifications
- 🎥 Video solution recommendations

## Feedback

Found a bug or have suggestions? Create an issue on GitHub or contact:
- Email: beshubam@gmail.com
- LinkedIn: [Shubam Chaudhary](linkedin.com/in/shubam-chaudhary)

---

**Good luck with your interview preparation! 🚀**

*Remember: Consistency is key. Even 2-3 hours daily with focused practice using smart recommendations will prepare you well for your job switch!*
