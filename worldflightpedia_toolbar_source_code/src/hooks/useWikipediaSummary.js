/**
 * useWikipediaSummary - Custom hook for fetching Wikipedia page summaries
 * 
 * Fetches summary data from Wikipedia's REST API for a given page title.
 * Handles loading state and errors automatically.
 * 
 * API endpoint: https://en.wikipedia.org/api/rest_v1/page/summary/{title}
 * 
 * @param {string} title - Wikipedia page title to fetch
 * @returns {Object} Result object
 * @returns {Object|null} data - Wikipedia API response data or null if error/not loaded
 * @returns {boolean} loading - True while fetching, false otherwise
 * 
 * @example
 * const { data, loading } = useWikipediaSummary("Eiffel Tower");
 * if (loading) return <Spinner />;
 * if (data) return <div>{data.extract}</div>;
 */

import { useState, useEffect } from "react";

export function useWikipediaSummary(title) {
  // Wikipedia API response data
  const [data, setData] = useState(null);
  
  // Loading state for UI feedback
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Skip fetch if no title provided
    if (!title) return;
    
    // Async function to fetch Wikipedia summary
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch from Wikipedia REST API with encoded title
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
        );
        const json = await res.json();
        
        // Store response data
        setData(json);
      } catch (err) {
        // Log error and reset data on failure
        console.error("Wikipedia fetch error:", err);
        setData(null);
      } finally {
        // Always reset loading state
        setLoading(false);
      }
    };
    
    fetchData();
  }, [title]); // Re-fetch when title changes

  return { data, loading };
}
