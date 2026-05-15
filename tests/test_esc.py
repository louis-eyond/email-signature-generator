import pytest
import os
import urllib.parse
from playwright.sync_api import Page, expect

def test_esc_function_e2e(page: Page):
    # Construct file path directly instead of using local server
    file_path = os.path.abspath("index.html")
    file_url = "file://" + urllib.parse.quote(file_path)

    page.goto(file_url)

    name_input = page.locator("#sig-name")
    preview = page.locator("#sig-preview")

    # 1. Normal string
    name_input.fill("John Doe")
    expect(preview).to_contain_text("John Doe")

    # 2. XSS string -> Should be rendered securely (escaped by esc)
    name_input.fill("<script>alert('XSS')</script>")
    expect(preview).to_contain_text("<script>alert('XSS')</script>")

    # 3. HTML attributes injection attempt
    name_input.fill('"><img src=x onerror=alert(1)>')
    expect(preview).to_contain_text('"><img src=x onerror=alert(1)>')

    # 4. Ampersands and quotes
    name_input.fill('John & Jane "Doe"')
    expect(preview).to_contain_text('John & Jane "Doe"')
