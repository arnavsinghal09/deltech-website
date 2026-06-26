import { createClient } from "@supabase/supabase-js";

// Realtime-only client (quiz board, availability). Not used for auth or data fetching.
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
);
