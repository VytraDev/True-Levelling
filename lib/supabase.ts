import { createClient } from '@supabase/supabase-js';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

/** Use AsyncStorage on native so session survives app close; on web Supabase uses localStorage by default. */
const authStorage = Platform.OS === 'web' ? undefined : AsyncStorage;

export const supabase = createClient(
  'https://znhdwoyduergrzyswdhl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InpuaGR3b3lkdWVyZ3J6eXN3ZGhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzIwNjc5ODAsImV4cCI6MjA4NzY0Mzk4MH0.gAgfrnMmzFiYrQ1mLRcd_-4WtmL8I7uep2GCb73il3o',
  {
    auth: {
      storage: authStorage,
      persistSession: true,
      autoRefreshToken: true,
    },
  }
);