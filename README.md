# MaterialMatrix website

## Facebook Marketplace listings

The Facebook Marketplace section is a manually maintained snapshot in `data/facebook-listings.json`; it does not sync automatically. When listings change, update the titles, prices and individual Facebook item links, remove sold items, add new ones, and set `checkedAt` to the date you verified the listings (YYYY-MM-DD). Product photos can be added with an `image` property containing a site-relative image path; leave it out when no photo is available. The Facebook Marketplace profile is linked on the store page so shoppers can check current availability and prices.
