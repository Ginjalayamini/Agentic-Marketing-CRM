export type Customer = {
  id: number;
  name: string;
  email: string;
  phone: string;
  city: string;
  preferred_channel: string;
  total_spent: string;
  last_order_date: string | null;
  created_at: string;
};

export type Campaign = {
  id: number;
  name: string;
  goal: string;
  audience_size: number;
  status: string;
  channel: string;
  created_at: string;
};

export type Analytics = {
  sent: number;
  delivered: number;
  opened: number;
  read: number;
  clicked: number;
  converted: number;
  delivery_rate: number;
  open_rate: number;
  click_rate: number;
  conversion_rate: number;
  revenue_generated: number;
};

export type CopilotResponse = {
  goal: string;
  audience_size: number;
  reasoning: string[];
  recommended_campaign: string;
  channel: string;
  message: string;
  customer_ids: number[];
};
