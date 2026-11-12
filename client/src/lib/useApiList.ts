import { useEffect, useState } from "react";
import api, { getErrorMessage } from "./api";
import { toList } from "./helpers";

export function useApiList<T>(url: string) {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");
    api
      .get(url)
      .then((res) => {
        if (active) setData(toList<T>(res.data));
      })
      .catch((err) => {
        if (active) setError(getErrorMessage(err));
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [url]);

  return { data, loading, error };
}
