let db=null;let currentUser=null;function createDbClient(){if(!SUPABASE_URL||!SUPABASE_ANON_KEY||SUPABASE_URL.includes("PASTE_")||SUPABASE_ANON_KEY.includes("PASTE_")){return null}return supabase.createClient(SUPABASE_URL,SUPABASE_ANON_KEY)}

let accessMode="owner";
