import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://pddhzryhtbxilzuryoyy.supabase.co'
const supabaseAnonKey = 'sb_publishable__kTBln10-uWtXHNsY_H5rw_O2KziKEV'

export const supabase = createClient(
  supabaseUrl,
  supabaseAnonKey
)