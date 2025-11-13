# Fixes Required for Smart Recommendation System

## UI Fixes (Dark Mode) - HIGH PRIORITY
- [x] Analytics cards (Total Questions, Solved, Starred, Completion)
- [ ] Priority recommendation cards (CRITICAL, HIGH, MEDIUM, LOW)
- [ ] External question cards
- [ ] Topics to Master cards
- [ ] Day selector buttons (Day 1, Day 2, etc.)

## Functional Requirements - CRITICAL

### 1. Add Diversity to Recommendations
**Issue**: All recommendations from same topic
**Fix**: Modify algorithm to ensure mix of topics while keeping more from weak areas
- Group recommendations by topic
- Limit max questions per topic in each priority
- Ensure CRITICAL/HIGH have 2-3 different topics minimum

### 2. External Questions Tracking + Caching
**Requirements**:
- Add checkbox to each external question
- Store checked state in localStorage cache: `ExternalQuestionsProgress`
- Sync to Firebase on "Sync to DB" button click
- Track question names to avoid future duplicates
- Cache recommendations for 24 hours

**Implementation**:
```javascript
localStorage.setItem('ExternalQuestionsProgress', JSON.stringify({
  solved: { "Question Name": true },
  lastUpdated: timestamp
}));

localStorage.setItem('CachedRecommendations', JSON.stringify({
  recommendations: [...],
  timestamp: Date.now(),
  expiresIn: 24 * 60 * 60 * 1000 // 24 hours
}));
```

### 3. Cache for 40-Day Plan Questions
**Requirements**:
- Cache generated plan in localStorage
- Don't reload from DB on page refresh
- Only reload when "Replan" is clicked or cache expires
- Cache expiry: 7 days

**Implementation**:
```javascript
localStorage.setItem('Cached40DayPlan', JSON.stringify({
  plan: dailyPlan,
  timestamp: Date.now(),
  expiresIn: 7 * 24 * 60 * 60 * 1000 // 7 days
}));
```

### 4. Fix Learning Materials Display
**Issue**: Says "3 questions + 2 hrs learning" but only shows questions
**Fix**: Check if learningMaterials array is being generated correctly in generate40DayPlan()
- Verify Udemy course sections are being added
- Verify complementary materials are being added
- Debug why materials aren't showing

### 5. Add Checkboxes to "Topics to Master"
**Requirements**:
- Checkbox for each topic category
- Store in localStorage: `TopicsToMasterProgress`
- Sync to Firebase on "Sync to DB" button
- Add ChatGPT link for each topic with prompt

**ChatGPT Prompts**:
```
System Design: "I'm preparing for Java Spring Boot interviews. Teach me [topic] in detail with examples. Then give me 5 practice questions to test my understanding."

Java Advanced: "Explain [topic] for Java with 2 YoE experience. Use real-world examples. Then quiz me on the concepts."

etc.
```

### 6. Sync Button for External Questions & Topics
- Add "Sync to Cloud" button similar to Personal Plan
- Syncs both external questions and topics to master progress
- Show sync status

## Implementation Order

1. **Batch 1 - UI Fixes** (Quick wins)
   - Fix all remaining dark mode issues
   - Add checkboxes to external questions
   - Add checkboxes to Topics to Master

2. **Batch 2 - Caching System** (Foundation)
   - Implement localStorage caching utilities
   - Cache recommendations with 24h expiry
   - Cache 40-day plan with 7d expiry
   - Add cache invalidation logic

3. **Batch 3 - Tracking & Sync** (Core functionality)
   - External questions progress tracking
   - Topics to Master progress tracking
   - Sync mechanism to Firebase
   - Cache-first loading strategy

4. **Batch 4 - Algorithm Improvements** (Quality)
   - Diversify recommendations across topics
   - Fix learning materials generation bug
   - Add ChatGPT links with prompts

5. **Batch 5 - Testing & Polish**
   - Test all caching mechanisms
   - Test sync functionality
   - Verify dark mode everywhere
   - Test ChatGPT links

## Files to Modify

1. `src/components/AIRecommendations.jsx` - UI fixes, checkboxes, ChatGPT links
2. `src/services/AIRecommendationService.js` - Algorithm improvements, diversity
3. `src/services/CacheService.js` (NEW) - Centralized caching utilities
4. `src/services/ProgressSyncService.js` - Add external questions sync
5. `src/hooks/useCaching.js` (NEW) - React hook for caching
