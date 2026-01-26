import asyncio
from playwright import async_api
from playwright.async_api import expect

async def run_test():
    pw = None
    browser = None
    context = None
    
    try:
        # Start a Playwright session in asynchronous mode
        pw = await async_api.async_playwright().start()
        
        # Launch a Chromium browser in headless mode with custom arguments
        browser = await pw.chromium.launch(
            headless=True,
            args=[
                "--window-size=1280,720",         # Set the browser window size
                "--disable-dev-shm-usage",        # Avoid using /dev/shm which can cause issues in containers
                "--ipc=host",                     # Use host-level IPC for better stability
                "--single-process"                # Run the browser in a single process mode
            ],
        )
        
        # Create a new browser context (like an incognito window)
        context = await browser.new_context()
        context.set_default_timeout(5000)
        
        # Open a new page in the browser context
        page = await context.new_page()
        
        # Navigate to your target URL and wait until the network request is committed
        await page.goto("http://localhost:5173", wait_until="commit", timeout=10000)
        
        # Wait for the main page to reach DOMContentLoaded state (optional for stability)
        try:
            await page.wait_for_load_state("domcontentloaded", timeout=3000)
        except async_api.Error:
            pass
        
        # Iterate through all iframes and wait for them to load as well
        for frame in page.frames:
            try:
                await frame.wait_for_load_state("domcontentloaded", timeout=3000)
            except async_api.Error:
                pass
        
        # Interact with the page elements to simulate user flow
        # -> Input username and password, then click Sign In button to login as authorized user
        frame = context.pages[-1]
        # Input username 'admin'
        elem = frame.locator('xpath=html/body/div/div/div/form/div/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin')
        

        frame = context.pages[-1]
        # Input password 'admin123'
        elem = frame.locator('xpath=html/body/div/div/div/form/div[2]/input').nth(0)
        await page.wait_for_timeout(3000); await elem.fill('admin123')
        

        frame = context.pages[-1]
        # Click Sign In button
        elem = frame.locator('xpath=html/body/div/div/div/form/button').nth(0)
        await page.wait_for_timeout(3000); await elem.click(timeout=5000)
        

        # --> Assertions to verify final state
        frame = context.pages[-1]
        await expect(frame.locator('text=Welcome back! Here\'s your business overview.').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Total Revenue').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=EGP 452,262.00').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Total Expenses').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=EGP 3,000.00').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Net Profit').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=EGP 449,262.00').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Stock Value').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=EGP 271,445.39').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=84').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Products').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=3').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Low Stock').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=31').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Pending').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=81').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Paid').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Mon').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Tue').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Wed').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Thu').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Fri').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sat').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Sun').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lezn i13Fac...').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=MASTERContr...').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=DUALR3LITE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Lezn R7 CAT...').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Smart DoorL...').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=INVOICE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ACC-SINV-2025-00050 - Hamada Elshazly').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ACC-SINV-2025-00056 - ا. محمد نبيل').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ACC-SINV-2025-00007 - م فادي جمال').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ACC-SINV-2025-00039 - م. يوسف الحاطوم').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=ACC-SINV-2025-00033 - ا. احمد ربيع').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=EXPENSE').first).to_be_visible(timeout=30000)
        await expect(frame.locator('text=Rent - $3000.00').first).to_be_visible(timeout=30000)
        await asyncio.sleep(5)
    
    finally:
        if context:
            await context.close()
        if browser:
            await browser.close()
        if pw:
            await pw.stop()
            
asyncio.run(run_test())
    