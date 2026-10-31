# MaterialMatrix website

## Facebook Marketplace listings

The Facebook Marketplace section is a manually maintained snapshot in `data/facebook-listings.json`; it does not sync automatically. When listings change, update the titles, prices and individual Facebook item links, remove sold items, add new ones, and set `checkedAt` to the date you verified the listings (YYYY-MM-DD). Product photos can be added with an `image` property containing a site-relative image path; leave it out when no photo is available. The Facebook Marketplace profile is linked on the store page so shoppers can check current availability and prices.

## YouTube statistics

The social page reads the saved public channel snapshot in `data/youtube-stats.json`. To refresh it automatically, enable the YouTube Data API v3 in a Google Cloud project, create an API key restricted to that API, and add it to this GitHub repository as the Actions secret `YOUTUBE_API_KEY`. The `Sync YouTube channel` workflow then refreshes the snapshot daily and can also be started manually from GitHub Actions. The key stays in Actions and is never written to the website data. Without a key, the workflow leaves the existing snapshot in place.

The sync reads the channel's public uploads and view counts; popular uploads may include Shorts. It also refreshes the selected featured videos if they are still public; the featured video IDs can be changed in `scripts/sync-youtube.mjs`. The public API rounds subscriber counts and does not expose hidden subscriber counts. Instagram and TikTok are not refreshed by this workflow. You can run `node scripts/sync-youtube.mjs` locally with `YOUTUBE_API_KEY` set in the environment; never commit the key.
