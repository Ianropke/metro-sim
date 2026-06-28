import { chromium } from 'playwright';

(async () => {
    // Launch browser
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
        viewport: { width: 1280, height: 800 }
    });
    const page = await context.newPage();

    try {
        console.log('Navigating to http://localhost:5175/...');
        await page.goto('http://localhost:5175/');

        // Wait for page load
        await page.waitForTimeout(2000);

        // Dismiss Welcome Modal Step 0 -> Step 1
        console.log('Clicking Next on step 0...');
        await page.click('button.bg-blue-600');
        await page.waitForTimeout(500);

        // Dismiss Welcome Modal Step 1 -> Step 2
        console.log('Clicking Next on step 1...');
        await page.click('button.bg-blue-600');
        await page.waitForTimeout(500);

        // Dismiss Welcome Modal Step 2 -> Start Game
        console.log('Clicking Start driften...');
        await page.click('button.bg-blue-600');
        await page.waitForTimeout(3000); // Wait for the simulation and canvas to render

        // Take a screenshot of the page
        const outputPath = '/Users/ianropke/.gemini/antigravity/brain/dbeae644-8ee8-47f9-bcbf-a71027d90a6f/screenshot_fixed.png';
        console.log(`Saving screenshot to ${outputPath}...`);
        await page.screenshot({ path: outputPath });

        console.log('Done!');
    } catch (err) {
        console.error('Error during screenshot capture:', err);
    } finally {
        await browser.close();
    }
})();
