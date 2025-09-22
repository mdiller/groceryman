const { addExtra } = require("playwright-extra");
const StealthPlugin = require("puppeteer-extra-plugin-stealth");
const playwright = require("playwright");
const fs = require("fs").promises;

const url = "https://w-mt.co/q/10jFfqz0fm006O";
const htmlOut = "example.html";
const jsonOut = "saved_info.json";

const chromium = addExtra(playwright.chromium);
chromium.use(StealthPlugin());

(async () => {
	const browser = await chromium.launch({ headless: false });
	const context = await browser.newContext();
	const page = await context.newPage();

	try {
		await page.goto(url, { waitUntil: "networkidle" });
		// let hydration breathe a bit
		await page.waitForTimeout(1200);
	} catch (err) {
		console.error("Navigation error:", err.stack || err);
	}

	// Always save the HTML we actually saw
	try {
		await fs.writeFile(htmlOut, await page.content(), "utf8");
	} catch (err) {
		console.error("Failed to save HTML:", err.stack || err);
	}

	// Helper: try several selectors; log errors but never throw, return null if all fail.
	async function getBySelectors(selectors, extractor, label) {
		for (const sel of selectors) {
			try {
				return await page.$eval(sel, extractor);
			} catch (err) {
				console.error(`Selector failed for ${label}: ${sel}\n${err.stack || err}`);
			}
		}
		return null;
	}

	// Try to read schema.org JSON-LD as a robust fallback
	async function readJsonLd() {
		try {
			const raw = await page.$eval('script[type="application/ld+json"][data-seo-id="schema-org-product"]', el => el.textContent);
			return JSON.parse(raw);
		} catch (err) {
			console.error("JSON-LD not available / parse failed:", err.stack || err);
			return null;
		}
	}

	let jsonLd = await readJsonLd();

	// 1) Title
	const title =
		await getBySelectors(
			["#main-title", 'h1[itemprop="name"]'],
			el => el.textContent.trim(),
			"title"
		) ?? (jsonLd?.name ?? null);

	// 2) Main image (fixed selector + sensible fallbacks)
	// Primary works on Walmart: the IMG is inside a node with data-seo-id="hero-carousel-image"
	const image =
		await getBySelectors(
			[
				'[data-seo-id="hero-carousel-image"] img',
				// sometimes the hero uses a role-based container
				'[data-testid="vertical-carousel-container"] img',
				// fallback to OpenGraph image
				'meta[property="og:image"]'
			],
			el => (el.tagName === "META" ? el.getAttribute("content") : el.src),
			"main image"
		) ?? (jsonLd?.image ?? null);

	// 3) Aisle (may be missing if no store is selected)
	const aisle =
		await getBySelectors(
			['[data-testid="product-aisle-location"] span'],
			el => el.textContent.trim(),
			"aisle"
		);

	// 4) Price (DOM first, then JSON-LD)
	let price =
		await getBySelectors(
			['span[itemprop="price"]', '[data-seo-id="hero-price"]'],
			el => el.textContent.trim(),
			"price"
		);
	if (!price && jsonLd?.offers?.[0]?.price != null) {
		price = `$${jsonLd.offers[0].price}`;
	}

	const item = { title: title ?? null, image: image ?? null, aisle: aisle ?? null, price: price ?? null };

	// Print as a JSON object (per run)
	console.log(JSON.stringify(item, null, 2));

	// Load existing list, append, and save
	let list = [];
	try {
		const prev = await fs.readFile(jsonOut, "utf8");
		list = JSON.parse(prev);
		if (!Array.isArray(list)) list = [];
	} catch (err) {
		if (err.code !== "ENOENT") {
			// Log but continue
			console.error("Failed to read saved_info.json:", err.stack || err);
		}
	}
	list.push(item);

	try {
		await fs.writeFile(jsonOut, JSON.stringify(list, null, 2), "utf8");
	} catch (err) {
		console.error("Failed to write saved_info.json:", err.stack || err);
	}

	await browser.close();
})().catch(err => {
	// Last-resort logging; ensure script still "finishes" with process exit
	console.error("Unhandled error:", err.stack || err);
	process.exit(0);
});
