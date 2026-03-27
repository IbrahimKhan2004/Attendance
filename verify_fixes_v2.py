import asyncio
from playwright.async_api import async_playwright
import os

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        # Using a relative path for the file
        file_path = "file://" + os.path.abspath("index.html")
        await page.goto(file_path)

        # 1. Switch to Attendance tab
        await page.click("text=Attendance")

        # 2. Check if button is visible
        is_visible = await page.is_visible("#addAttBtn")
        print(f"Attendance button visible: {is_visible}")

        # 3. Open modal
        await page.click("#addAttBtn")

        # 4. Check for the new hint text
        hint_text = await page.inner_text(".modal p")
        print(f"Modal hint: {hint_text}")

        # 5. Simulate a proxy change: Change first slot (VI) from OS to PCS
        # Assuming we are on a Tuesday (Tues is index 2)
        # We'll set the date to a known Tuesday: 2026-01-20
        await page.fill("#modalDate", "2026-01-20")

        # Wait for periods to render
        await asyncio.sleep(0.5)

        # Select PCS for Slot VI
        await page.select_option("#msub_VI", "PCS")
        await page.click("#mbtn_VI") # Mark Present

        # Save
        await page.click("text=Save")

        # Check localStorage to ensure no pollution
        storage = await page.evaluate("() => localStorage.getItem('sms_att_c')")
        print(f"LocalStorage after first save: {storage}")

        # Now edit again: Change Slot VI from PCS to DECO
        await page.click("#addAttBtn")
        await page.fill("#modalDate", "2026-01-20")
        await asyncio.sleep(0.5)
        await page.select_option("#msub_VI", "DECO")
        await page.click("text=Save")

        storage_v2_json = await page.evaluate("() => localStorage.getItem('sms_att_c')")
        print(f"LocalStorage after second save: {storage_v2_json}")

        import json
        storage_v2 = json.loads(storage_v2_json)
        day_data = storage_v2.get("2026-01-20", {})

        # Check if PCS_VI is gone and DECO_VI is present
        assert "PCS_VI" not in day_data
        assert "DECO_VI" in day_data
        print("Data pollution check passed!")

        # Take a screenshot
        await page.screenshot(path="verification_v2.png")

        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
