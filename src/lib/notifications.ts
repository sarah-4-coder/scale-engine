/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

export const sendNotification = async (payload: {
  user_id: string;
  role: "admin" | "influencer";
  type: string;
  title: string;
  message: string;
  metadata?: any;
}) => {
  const { error, data } = await supabase.functions.invoke("smooth-task", {
    body: payload,
  });

  if (error) {
    console.error("Notification error:", error);
    throw error;
  }

  return data;
};
