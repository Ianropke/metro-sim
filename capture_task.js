import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

(async () => {
    const outputDir = '/Users/ianropke/.gemini/antigravity/brain/3862adb3-6e97-4ab1-a483-ef8f4b9f5257';
    
    // Ensure output directory exists
    if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
    }

    console.log('Launching browser...');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    // Goal 1: Home page
    console.log('Navigating to http://localhost:5174/...');
    await page.goto('http://localhost:5174/', { waitUntil: 'networkidle' });
    
    console.log('Waiting 3 seconds for rendering...');
    await page.waitForTimeout(3000);

    const homePath = path.join(outputDir, 'home.png');
    console.log(`Saving homepage screenshot to ${homePath}...`);
    await page.screenshot({ path: homePath });

    // Goal 2: Admin page
    console.log('Navigating to http://localhost:5174/admin-vice...');
    await page.goto('http://localhost:5174/admin-vice', { waitUntil: 'networkidle' });

    console.log('Waiting 2 seconds for rendering...');
    await page.waitForTimeout(2000);

    const adminPath = path.join(outputDir, 'admin.png');
    console.log(`Saving admin page screenshot to ${adminPath}...`);
    await page.screenshot({ path: adminPath });

    await browser.close();
    console.log('Browser closed. Screenshots taken successfully!');
})();
