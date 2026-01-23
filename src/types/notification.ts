/* eslint-disable @typescript-eslint/no-explicit-any */
export interface Notification {
  id: string;
  user_id: string;
  role: "admin" | "influencer";
  type: string;
  title: string;
  message: string;
  metadata: any | null;
  is_read: boolean;
  created_at: string;
}
