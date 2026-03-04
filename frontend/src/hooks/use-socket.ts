import { useEffect } from "react";
import { socketService } from "@/services/socketService";

export function useSocket() {
  useEffect(() => {
    socketService.connect();
    return () => {
      socketService.disconnect();
    };
  }, []);

  return socketService;
}
