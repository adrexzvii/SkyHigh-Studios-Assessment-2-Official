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
import { fetchSummary } from "../../utils/wiki/wikipediaApi";

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
        const json = await fetchSummary(title);
        setData(json);
      } catch (err) {
        console.error("Wikipedia fetch error:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [title]); // Re-fetch when title changes

  return { data, loading };
}
