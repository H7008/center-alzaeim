window.supabaseClient = window.supabase.createClient(
  "https://dyddnpudffqzdbjzkwac.supabase.co",
  "sb_publishable_JQYr90QlDjNPCp9CGKdGQw_-Bxm_QSj",
  {
    db: {
      schema: "public"
    },
    auth: {
      persistSession: true
    }
  }
);