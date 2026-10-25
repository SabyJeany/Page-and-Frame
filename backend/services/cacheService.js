// Import the Cache model (MongoDB collection for API responses)
import Cache from '../models/Cache.js';

/**
 * Returns the cached data for a key, or null if missing or expired.
 *
 * @param {string} key - Unique name of the request, e.g. "search:dune"
 * @returns {Promise<Object|null>} The cached API data, or null
 */
export async function getCache(key) {
    // Find the entry with this key whose expiration date is still in the future
    const entry = await Cache.findOne({ key, expiresAt: { $gt: new Date() } });
    // If found, return only the API data; otherwise return null
    return entry ? entry.data : null;
}

/**
 * Saves data in the cache, or replaces it if the key already exists.
 *
 * @param {string} key - Unique name of the request, e.g. "search:dune"
 * @param {string} source - The API the data comes from (tmdb, openlibrary...)
 * @param {Object} data - The raw API response to store
 * @param {number} [ttlHours=24] - How long the data stays valid, in hours
 * @returns {Promise<void>}
 */
export async function setCache(key, source, data, ttlHours = 24) {
    // Compute the expiration date: now + ttlHours converted to milliseconds
    const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
    // Update the entry with this key, or create it if it does not exist
    await Cache.findOneAndUpdate(
        // Filter: which document to look for
        { key },
        // New values to save
        { key, source, data, createdAt: new Date(), expiresAt },
        // upsert = update if found, insert if not
        { upsert: true }
    );
}