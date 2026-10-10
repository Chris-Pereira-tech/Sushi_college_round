import { chromium } from "playwright";

const ARTIFACT_DIR = "C:/Users/chris/.gemini/antigravity/brain/539c86de-ca18-454f-b313-d6ef502b7a13";

async function main() {
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1280, height: 800 } });

  // Screenshot dashboard
  await page.goto("http://localhost:5173/");
  await page.waitForLoadState("networkidle");
  await page.screenshot({ path: `${ARTIFACT_DIR}/dashboard-placeholder.png` });
  console.log("✅ dashboard screenshot saved");

  await browser.close();
}

main();
