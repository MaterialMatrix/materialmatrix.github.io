import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const shopName = process.env.ETSY_SHOP_NAME || "MaterialMatrix";
const shopUrl = `https://www.etsy.com/shop/${shopName}`;
const keystring = process.env.ETSY_API_KEYSTRING;
const sharedSecret = process.env.ETSY_SHARED_SECRET;
const configuredShopId = process.env.ETSY_SHOP_ID;
const outputPath = process.env.ETSY_OUTPUT_PATH || "data/etsy-listings.json";
const apiBaseUrl = "https://api.etsy.com/v3/application";

if (!keystring || !sharedSecret) {
  throw new Error("Missing ETSY_API_KEYSTRING or ETSY_SHARED_SECRET.");
}

const headers = {
  "x-api-key": `${keystring}:${sharedSecret}`,
  "accept": "application/json",
};

const fetchJson = async (url) => {
  const response = await fetch(url, { headers });
  const text = await response.text();

  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${text.slice(0, 280)}`);
  }

  return text ? JSON.parse(text) : {};
};

const getResults = (payload) => {
  if (Array.isArray(payload?.results)) {
    return payload.results;
  }

  if (Array.isArray(payload)) {
    return payload;
  }

  return [];
};

const discoverShopId = async () => {
  if (configuredShopId) {
    return configuredShopId;
  }

  const candidates = [
    `${apiBaseUrl}/shops?shop_name=${encodeURIComponent(shopName)}&limit=100`,
  ];

  for (const url of candidates) {
    try {
      const payload = await fetchJson(url);
      const shops = getResults(payload);
      const shop =
        shops.find((candidate) => candidate.shop_name?.toLowerCase() === shopName.toLowerCase()) ||
        shops[0] ||
        payload;
      const shopId = shop?.shop_id || shop?.shopId;

      if (shopId) {
        return String(shopId);
      }
    } catch (error) {
      console.warn(`Shop lookup failed for ${url}: ${error.message}`);
    }
  }

  throw new Error("Could not discover Etsy shop ID. Add ETSY_SHOP_ID as a GitHub secret.");
};

const fetchActiveListings = async (shopId) => {
  const candidates = [
    `${apiBaseUrl}/shops/${encodeURIComponent(shopId)}/listings/active?limit=100`,
  ];

  let lastError;

  for (const url of candidates) {
    try {
      return getResults(await fetchJson(url));
    } catch (error) {
      lastError = error;
      console.warn(`Listing fetch failed for ${url}: ${error.message}`);
    }
  }

  throw lastError;
};

const fetchListingImages = async (shopId, listingId) => {
  const candidates = [
    `${apiBaseUrl}/listings/${encodeURIComponent(listingId)}/images`,
  ];

  for (const url of candidates) {
    try {
      return getResults(await fetchJson(url));
    } catch (error) {
      console.warn(`Image fetch failed for listing ${listingId}: ${error.message}`);
    }
  }

  return [];
};

const formatMoney = (price) => {
  if (!price) {
    return "";
  }

  if (typeof price === "string") {
    return price.startsWith("$") ? price : `$${price}`;
  }

  const amount = Number(price.amount);
  const divisor = Number(price.divisor || 100);
  const currency = price.currency_code || price.currency || "USD";

  if (!Number.isFinite(amount) || !Number.isFinite(divisor) || divisor === 0) {
    return "";
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / divisor);
};

const summarize = (description = "") => {
  const compact = String(description).replace(/\s+/g, " ").trim();

  if (compact.length <= 180) {
    return compact;
  }

  return `${compact.slice(0, 177).trim()}...`;
};

const imageUrlFrom = (listing, images) => {
  const directImage =
    listing.image ||
    listing.image_url ||
    listing.url_570xN ||
    listing.MainImage?.url_570xN ||
    listing.MainImage?.url_fullxfull;

  const firstImage = images[0];

  return (
    directImage ||
    firstImage?.url_fullxfull ||
    firstImage?.url_570xN ||
    firstImage?.url_300x300 ||
    ""
  );
};

const normalizeListing = async (shopId, listing) => {
  const listingId = listing.listing_id || listing.listingId || listing.id;
  const images = listingId ? await fetchListingImages(shopId, listingId) : [];

  return {
    id: String(listingId),
    title: listing.title || "Untitled listing",
    price: formatMoney(listing.price),
    currency: listing.price?.currency_code || listing.currency_code || "USD",
    quantity: listing.quantity ?? null,
    url: listing.url || `https://www.etsy.com/listing/${listingId}`,
    image: imageUrlFrom(listing, images),
    description: summarize(listing.description),
    tags: Array.isArray(listing.tags) ? listing.tags.slice(0, 6) : [],
  };
};

const shopId = await discoverShopId();
const rawListings = await fetchActiveListings(shopId);
const listings = await Promise.all(rawListings.map((listing) => normalizeListing(shopId, listing)));

const payload = {
  shopName,
  shopUrl,
  shopId,
  updatedAt: new Date().toISOString(),
  source: "etsy-api",
  listings,
};

await mkdir(path.dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Synced ${listings.length} Etsy listing(s) to ${outputPath}.`);
