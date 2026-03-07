import puppeteer from 'puppeteer';

(async () => {
    const browser = await puppeteer.launch({
        headless: 'new',
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--ignore-certificate-errors', '--ignore-certificate-errors-spki-list']
    });
    
    // We are testing LOCAL PRODUCTION BUILD directly!
    const page = await browser.newPage();
    
    // Listen to all console logs
    page.on('console', msg => console.log('BROWSER CONSOLE:', msg.text()));
    
    // Listen to network requests
    page.on('requestfailed', request => {
        console.error(`FAILED REQUEST: ${request.url()} - ${request.failure().errorText}`);
    });
    
    page.on('response', response => {
        if (response.url().includes('api')) {
           console.log(`API RESPONSE: ${response.url()} -> ${response.status()}`);
        }
    });

    console.log("Navigating to Local Production Build...");
    await page.goto('http://localhost:8080/admin/login');
    
    console.log("Waiting to load...");
    await page.waitForTimeout(2000); // 2 seconds delay
    
    // Automate Login
    console.log("Logging in...");
    await page.type('input[placeholder="Usuario"]', 'admin');
    await page.type('input[type="password"]', '1234');
    await page.click('button[type="submit"]');
    
    console.log("Waiting for redirect to Dashboard...");
    await page.waitForTimeout(4000); 
    
    console.log("Navigating to Chats...");
    await page.goto('http://localhost:8080/admin/chats');
    await page.waitForTimeout(4000);

    await browser.close();
})();
