import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        defaultViewport: { width: 1280, height: 800 }
    });
    const page = await browser.newPage();
    
    try {
        console.log("Navigating to dev server...");
        await page.goto('http://localhost:5175', { waitUntil: 'networkidle0', timeout: 10000 });
    } catch (e) { console.error(e); }
    
    // Wait for the Næste button
    try {
        for (let i = 0; i < 3; i++) {
            await page.waitForSelector('button', { timeout: 2000 });
            // Evaluate script to find the button with "Næste" or "Start"
            await page.evaluate(() => {
                const btns = Array.from(document.querySelectorAll('button'));
                const nextBtn = btns.find(b => b.textContent.includes('Næste') || b.textContent.includes('Start'));
                if (nextBtn) nextBtn.click();
            });
            await new Promise(r => setTimeout(r, 1000));
        }
    } catch (e) { console.log("No modal found or error clicking:", e.message); }
    
    // Wait for the map to draw
    await new Promise(r => setTimeout(r, 2000));
    
    console.log("Taking screenshot...");
    await page.screenshot({ path: 'ui_screenshot.png' });
    
    await browser.close();
    console.log("Screenshot saved!");
})();
