/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "@/integrations/supabase/client";

interface SendNotificationParams {
  user_id: string;
  role: "admin" | "influencer" | "brand";
  type: string;
  title: string;
  message: string;
  metadata?: Record<string, any>;
}

export const sendNotification = async (params: SendNotificationParams) => {
  try {
    const { data, error } = await supabase.from("notifications").insert({
      user_id: params.user_id,
      role: params.role,
      type: params.type,
      title: params.title,
      message: params.message,
      metadata: params.metadata || null,
      is_read: false,
    });

    if (error) {
      console.error("Error sending notification:", error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error("Failed to send notification:", error);
    throw error;
  }
};