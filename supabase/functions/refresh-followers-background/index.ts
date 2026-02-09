// supabase/functions/refresh-followers-background/index.ts

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * BACKGROUND SERVICE FOR REFRESHING INSTAGRAM FOLLOWERS
 * 
 * This function should be triggered via Supabase cron job
 * Schedule: Every 6 hours or daily (depending on your needs)
 * 
 * Strategy to avoid bans:
 * 1. Process influencers in batches
 * 2. Add random delays between requests (5-15 seconds)
 * 3. Prioritize active influencers
 * 4. Skip recently updated profiles
 * 5. Rotate user agents
 */

interface InstagramData {
  followers_count: number;
  username: string;
}

const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.1 Safari/605.1.15',
];

function getRandomUserAgent(): string {
  return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

function getRandomDelay(): number {
  // Random delay between 5-15 seconds
  return Math.floor(Math.random() * 10000) + 5000;
}

async function scrapeInstagramProfile(username: string): Promise<InstagramData | null> {
  try {
    const url = `https://www.instagram.com/api/v1/users/web_profile_info/?username=${username}`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': getRandomUserAgent(),
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
      };
    }

    return null;
  } catch (error) {
    console.error(`Scraping error for ${username}:`, error);
    return null;
  }
}

serve(async (req) => {
  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get('Authorization');
    const cronSecret = Deno.env.get('CRON_SECRET');
    
    if (authHeader !== `Bearer ${cronSecret}`) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Get influencers that need refresh
    // Priority: Active influencers who haven't been updated in the last 7 days
    const { data: influencers, error: fetchError } = await supabaseAdmin
      .from('influencer_profiles')
      .select('id, user_id, instagram_handle, followers_count, last_followers_fetch')
      .eq('is_blocked', false)
      .or('last_followers_fetch.is.null,last_followers_fetch.lt.' + 
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('last_followers_fetch', { ascending: true, nullsFirst: true })
      .limit(50); // Process 50 at a time

    if (fetchError) {
      throw fetchError;
    }

    if (!influencers || influencers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No influencers to update' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Processing ${influencers.length} influencers`);

    const results = {
      total: influencers.length,
      updated: 0,
      failed: 0,
      errors: [] as string[],
    };

    // Process each influencer with delay
    for (const influencer of influencers) {
      try {
        // Add random delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, getRandomDelay()));

        const instagramData = await scrapeInstagramProfile(influencer.instagram_handle);

        if (instagramData) {
          // Update profile
          const { error: updateError } = await supabaseAdmin
            .from('influencer_profiles')
            .update({
              followers_count: instagramData.followers_count,
              last_followers_fetch: new Date().toISOString(),
            })
            .eq('id', influencer.id);

          if (updateError) {
            console.error(`Update error for ${influencer.instagram_handle}:`, updateError);
            results.failed++;
            results.errors.push(`${influencer.instagram_handle}: ${updateError.message}`);
          } else {
            console.log(`Updated ${influencer.instagram_handle}: ${instagramData.followers_count} followers`);
            results.updated++;

            // Log to history table
            await supabaseAdmin
              .from('follower_history')
              .insert({
                user_id: influencer.user_id,
                followers_count: instagramData.followers_count,
                recorded_at: new Date().toISOString(),
              });
          }
        } else {
          console.error(`Failed to fetch data for ${influencer.instagram_handle}`);
          results.failed++;
          results.errors.push(`${influencer.instagram_handle}: Scraping failed`);
        }
      } catch (error) {
        console.error(`Error processing ${influencer.instagram_handle}:`, error);
        results.failed++;
        results.errors.push(`${influencer.instagram_handle}: ${error.message}`);
      }
    }

    console.log('Refresh completed:', results);

    return new Response(
      JSON.stringify({
        message: 'Follower refresh completed',
        results,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Background refresh error:', error);
    return new Response(
      JSON.stringify({
        error: error.message || 'Internal server error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
});