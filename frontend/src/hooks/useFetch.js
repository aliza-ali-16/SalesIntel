import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

export default function useFetch(url, options = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Stringify options to avoid infinite dependency loops in useEffect
  const optionsString = JSON.stringify(options);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axios.get(url, JSON.parse(optionsString));
      setData(response.data);
      setError(null);
    } catch (err) {
      console.error(`❌ Fetch error on ${url}:`, err.message);
      setError(err.response?.data?.message || err.message || 'Fetch operation failed.');
    } finally {
      setLoading(false);
    }
  }, [url, optionsString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return { data, loading, error, refetch: fetchData, setData };
}
