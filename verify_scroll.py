import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        file_path = "file://" + os.path.abspath("index.html")
        await page.goto(file_path)

        await page.click("text=Attendance")

        # Add many dummy entries to test scrolling
        script = """
        const data = {};
        for (let i = 1; i <= 30; i++) {
            const date = `2026-01-${String(i).padStart(2, '0')}`;
            data[date] = {"PCS_VI": "P"};
        }
        localStorage.setItem('sms_att_c', JSON.stringify(data));
        location.reload();
        """
        await page.evaluate(script)

        # Wait for reload and navigate back
        await page.wait_for_load_state("networkidle")
        await page.click("text=Attendance")

        # Check if log is scrollable
        is_scrollable = await page.evaluate("""() => {
            const el = document.getElementById('attLog');
            return el.scrollHeight > el.clientHeight;
        }""")
        print(f"Daily Log scrollable: {is_scrollable}")

        # Check button position
        button_pos = await page.evaluate("""() => {
            const btn = document.getElementById('addAttBtn');
            const log = document.getElementById('attLog');
            return btn.getBoundingClientRect().top < log.getBoundingClientRect().top;
        }""")
        print(f"Button is above log: {button_pos}")

        await page.screenshot(path="verification_scroll.png")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
