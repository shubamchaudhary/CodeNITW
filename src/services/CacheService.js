/**
 * CacheService - Centralized caching utility for localStorage
 * Helps minimize Firebase calls by caching data locally with expiration
 */

class CacheService {
  /**
   * Set a cached item with expiration
   * @param {string} key - Cache key
   * @param {any} value - Value to cache
   * @param {number} expiresInMs - Expiration time in milliseconds
   */
  set(key, value, expiresInMs) {
    const cacheData = {
      value,
      timestamp: Date.now(),
      expiresAt: Date.now() + expiresInMs,
    };
    localStorage.setItem(key, JSON.stringify(cacheData));
  }

  /**
   * Get a cached item if not expired
   * @param {string} key - Cache key
   * @returns {any|null} Cached value or null if expired/not found
   */
  get(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
      const cacheData = JSON.parse(cached);
      const now = Date.now();

      // Check if expired
      if (cacheData.expiresAt && now > cacheData.expiresAt) {
        this.remove(key);
        return null;
      }

      return cacheData.value;
    } catch (error) {
      console.error("Error reading cache:", error);
      this.remove(key);
      return null;
    }
  }

  /**
   * Check if a cached item exists and is not expired
   * @param {string} key - Cache key
   * @returns {boolean}
   */
  has(key) {
    return this.get(key) !== null;
  }

  /**
   * Remove a cached item
   * @param {string} key - Cache key
   */
  remove(key) {
    localStorage.removeItem(key);
  }

  /**
   * Clear all cache (use with caution)
   */
  clear() {
    localStorage.clear();
  }

  /**
   * Get cache metadata
   * @param {string} key - Cache key
   * @returns {object|null} Metadata with timestamp and expiresAt
   */
  getMetadata(key) {
    const cached = localStorage.getItem(key);
    if (!cached) return null;

    try {
      const cacheData = JSON.parse(cached);
      return {
        timestamp: cacheData.timestamp,
        expiresAt: cacheData.expiresAt,
        isExpired: Date.now() > cacheData.expiresAt,
      };
    } catch (error) {
      return null;
    }
  }

  /**
   * Cache recommendations with 24-hour expiration
   * @param {string} userId - User ID
   * @param {object} recommendations - Recommendations data
   */
  cacheRecommendations(userId, recommendations) {
    const key = `recommendations_${userId}`;
    const expiresIn = 24 * 60 * 60 * 1000; // 24 hours
    this.set(key, recommendations, expiresIn);
  }

  /**
   * Get cached recommendations
   * @param {string} userId - User ID
   * @returns {object|null} Cached recommendations or null
   */
  getCachedRecommendations(userId) {
    const key = `recommendations_${userId}`;
    return this.get(key);
  }

  /**
   * Cache 40-day plan with 7-day expiration
   * @param {string} userId - User ID
   * @param {object} plan - Daily plan data
   */
  cache40DayPlan(userId, plan) {
    const key = `40day_plan_${userId}`;
    const expiresIn = 7 * 24 * 60 * 60 * 1000; // 7 days
    this.set(key, plan, expiresIn);
  }

  /**
   * Get cached 40-day plan
   * @param {string} userId - User ID
   * @returns {object|null} Cached plan or null
   */
  getCached40DayPlan(userId) {
    const key = `40day_plan_${userId}`;
    return this.get(key);
  }

  /**
   * Invalidate 40-day plan cache (for replan)
   * @param {string} userId - User ID
   */
  invalidate40DayPlan(userId) {
    const key = `40day_plan_${userId}`;
    this.remove(key);
  }

  /**
   * Invalidate recommendations cache
   * @param {string} userId - User ID
   */
  invalidateRecommendations(userId) {
    const key = `recommendations_${userId}`;
    this.remove(key);
  }
}

// Export singleton instance
const cacheService = new CacheService();
export default cacheService;
