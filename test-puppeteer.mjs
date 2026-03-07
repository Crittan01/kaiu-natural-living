import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    // We are testing Vercel directly!
    const page = await browser.newPage();
    
    // Listen to all console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Listen to network requests
    page.on('requestfailed', request => {
        console.error(`FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
    });
    
    page.on('response', response => {
        if (response.url().includes('/api/sessions')) {
           console.log(`SESSION RESPONSE: ${response.url()} -> ${response.status()}`);
        }
    });

    console.log("Navigating to Vercel...");
    await page.goto('https://kaiu-natural-living.vercel.app/admin/login');
    
    console.log("Waiting to load...");
    await page.waitForTimeout(2000); // 2 seconds delay
    
    // Automate Login (since local storage is empty in puppeteer)
    console.log("Logging in...");
    await page.type('input[placeholder="Usuario"]', 'admin');
    await page.type('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for redirect to Dashboard...");
    await page.waitForTimeout(4000); 
    
    console.log("Navigating to Chats...");
    // Explicitly go to chats because it might load overview by default
    await page.goto('https://kaiu-natural-living.vercel.app/admin/chats');
    await page.waitForTimeout(4000);

    await browser.close();
})();
