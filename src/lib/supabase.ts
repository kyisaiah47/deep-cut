import { createClient } from "@supabase/supabase-js";
import { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
	throw new Error("Missing Supabase environment variables");
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
	realtime: {
		params: {
			eventsPerSecond: 10,
		},
	},
});

// Client-side Supabase client for browser usage
export const createClientComponentClient = () => {
	return createClient<Database>(supabaseUrl, supabaseAnonKey, {
		realtime: {
			params: {
				eventsPerSecond: 10,
			},
		},
	});
};
