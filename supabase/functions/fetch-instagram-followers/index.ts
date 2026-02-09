// supabase/functions/fetch-instagram-followers/index.ts
// PRODUCTION VERSION - With improved rate limiting and manual fallback

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramData {
  followers_count: number;
  username: string;
  full_name?: string;
  profile_pic_url?: string;
}

async function scrapeInstagramProfile(username: string): Promise<InstagramData | null> {
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'X-IG-App-ID': '936619743392459',
        'Accept': '*/*',
        'Accept-Language': 'en-US,en;q=0.9',
        'Referer': 'https://www.instagram.com/',
        'Sec-Fetch-Dest': 'empty',
        'Sec-Fetch-Mode': 'cors',
        'Sec-Fetch-Site': 'same-origin',
      },
    });

    if (!response.ok) {
      throw new Error(`Instagram API returned ${response.status}`);
    }

    const data = await response.json();
    
    if (data?.data?.user) {
      const user = data.data.user;
      return {
        followers_count: user.edge_followed_by?.count || 0,
        username: user.username,
        full_name: user.full_name,
        profile_pic_url: user.profile_pic_url_hd || user.profile_pic_url,
      };
    }

    throw new Error('Invalid response format');
  } catch (error) {
    console.error('Scraping error:', error);
    return await scrapeFromHTML(username);
  }
}

async function scrapeFromHTML(username: string): Promise<InstagramData | null> {
  try {
    const htmlUrl = `https://www.instagram.com/${username}/`;
    const htmlResponse = await fetch(htmlUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const html = await htmlResponse.text();
    
    const jsonMatch = html.match(/<script type="application\/ld\+json">({.*?})<\/script>/);
    if (jsonMatch) {
      const jsonData = JSON.parse(jsonMatch[1]);
      const followers = jsonData?.mainEntityofPage?.interactionStatistic?.userInteractionCount;
      
      if (followers) {
        return {
          followers_count: parseInt(followers),
          username: username,
        };
      }
    }

    const sharedDataMatch = html.match(/window\._sharedData = ({.*?});<\/script>/);
    if (sharedDataMatch) {
      const sharedData = JSON.parse(sharedDataMatch[1]);
      const user = sharedData?.entry_data?.ProfilePage?.[0]?.graphql?.user;
      
      if (user) {
        return {
          followers_count: user.edge_followed_by?.count || 0,
          username: user.username,
          full_name: user.full_name,
          profile_pic_url: user.profile_pic_url_hd,
        };
      }
    }
  } catch (fallbackError) {
    console.error('Fallback scraping failed:', fallbackError);
  }

  return null;
}

/**
 * IMPROVED RATE LIMITING
 * - Per-user: 1 request per 2 minutes
 * - Global: Max 10 requests per minute (to avoid Instagram rate limits)
 */
async function checkRateLimit(supabase: any, userId: string): Promise<{ allowed: boolean; reason?: string }> {
  // Check per-user rate limit (2 minutes)
  const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  
  const { data: userRecent, error: userError } = await supabase
    .from('instagram_scrape_queue')
    .select('created_at')
    .eq('user_id', userId)
    .gte('created_at', twoMinutesAgo)
    .limit(1);

  if (userError) {
    console.error('User rate limit check error:', userError);
    return { allowed: true }; // Allow on error to be safe
  }

  if (userRecent && userRecent.length > 0) {
    return { 
      allowed: false, 
      reason: 'Please wait 2 minutes before trying again' 
    };
  }

  // Check global rate limit (10 per minute)
  const oneMinuteAgo = new Date(Date.now() - 60 * 1000).toISOString();
  
  const { data: globalRecent, error: globalError } = await supabase
    .from('instagram_scrape_queue')
    .select('id')
    .eq('status', 'processing')
    .gte('created_at', oneMinuteAgo);

  if (globalError) {
    console.error('Global rate limit check error:', globalError);
    return { allowed: true };
  }

  if (globalRecent && globalRecent.length >= 10) {
    return { 
      allowed: false, 
      reason: 'System is busy. Please try again in 1 minute' 
    };
  }

  return { allowed: true };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseClient.auth.getUser();

    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({
          error: 'Authentication required',
          can_proceed_manually: true, // Allow manual entry
        }),
        {
          status: 401,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { instagram_handle } = await req.json();

    if (!instagram_handle) {
      return new Response(
        JSON.stringify({ 
          error: 'Instagram handle is required',
          can_proceed_manually: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const cleanHandle = instagram_handle.replace('@', '').trim();
    console.log('Fetching followers for:', cleanHandle, 'User:', user.id);

    // Check rate limit with improved logic
    const rateLimitCheck = await checkRateLimit(supabaseClient, user.id);
    
    if (!rateLimitCheck.allowed) {
      return new Response(
        JSON.stringify({
          error: rateLimitCheck.reason || 'Rate limit exceeded',
          can_proceed_manually: true, // Allow manual entry
          retry_after: 120, // seconds
        }),
        {
          status: 429,
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json',
            'Retry-After': '120',
          },
        }
      );
    }

    // Add to queue
    const { data: queueEntry, error: queueError } = await supabaseClient
      .from('instagram_scrape_queue')
      .insert({
        user_id: user.id,
        instagram_handle: cleanHandle,
        status: 'processing',
      })
      .select()
      .single();

    if (queueError) {
      console.error('Queue error:', queueError);
      return new Response(
        JSON.stringify({ 
          error: 'Failed to queue request',
          can_proceed_manually: true,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Scrape Instagram with timeout
    const timeoutPromise = new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Scraping timeout')), 15000)
    );

    let instagramData: InstagramData | null = null;

    try {
      instagramData = await Promise.race([
        scrapeInstagramProfile(cleanHandle),
        timeoutPromise
      ]) as InstagramData | null;
    } catch (timeoutError) {
      console.error('Scraping timeout:', timeoutError);
    }

    if (!instagramData) {
      // Update queue as failed but don't block user signup
      await supabaseClient
        .from('instagram_scrape_queue')
        .update({
          status: 'failed',
          error_message: 'Could not fetch Instagram data - user can enter manually',
        })
        .eq('id', queueEntry.id);

      return new Response(
        JSON.stringify({
          error: 'Unable to fetch followers automatically. You can enter manually.',
          can_proceed_manually: true,
          instagram_handle: cleanHandle,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Update queue as completed
    await supabaseClient
      .from('instagram_scrape_queue')
      .update({
        status: 'completed',
        followers_count: instagramData.followers_count,
      })
      .eq('id', queueEntry.id);

    console.log('✓ Successfully fetched:', instagramData.followers_count, 'followers');

    return new Response(
      JSON.stringify({
        followers_count: instagramData.followers_count,
        username: instagramData.username,
        full_name: instagramData.full_name,
        profile_pic_url: instagramData.profile_pic_url,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
        can_proceed_manually: true, // Always allow manual entry on error
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});