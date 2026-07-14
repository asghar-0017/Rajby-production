import { useState, useEffect } from "react";
import { api } from "../API/Api";

export function useSubscription() {
  const [state, setState] = useState({
    isSuspended: false,
    showWarning: false,
    daysLeft: 0,
    endDateFormatted: "",
    suspendMessage: "",
    loading: true
  });

  useEffect(() => {
    let active = true;
    const fetchStatus = async () => {
      try {
        const response = await api.get("/system/status");
        if (active) {
          setState({
            isSuspended: response.data.isSuspended,
            showWarning: response.data.showWarning,
            daysLeft: response.data.daysLeft,
            endDateFormatted: response.data.endDateFormatted,
            suspendMessage: response.data.suspendMessage,
            loading: false
          });
        }
      } catch (error) {
        console.error("Failed to fetch subscription status:", error);
        if (active) {
          setState((prev) => ({ ...prev, loading: false }));
        }
      }
    };

    fetchStatus();
    return () => {
      active = false;
    };
  }, []);

  return state;
}
