import { useState, useEffect } from "react";

/**
 * Hook to fetch Wikipedia summary for a given title.
 */
export function useWikipediaSummary(title) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!title) return;
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await fetch(
          `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`
        );
        const json = await res.json();
        setData(json);
      } catch (err) {
        console.error("Wikipedia fetch error:", err);
        setData(null);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [title]);

  return { data, loading };
}
