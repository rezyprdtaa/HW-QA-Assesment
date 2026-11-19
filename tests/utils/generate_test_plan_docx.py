import os
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from doc_helpers import (
    set_cell_background, set_cell_margins, create_styled_table,
    add_header_block, add_callout
)

def build_test_plan_doc(output_path):
    doc = Document()
    
    # Page setup - 0.8 inch margins
    sections = doc.sections
    for section in sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    add_header_block(
        doc,
        title="Test Plan & Risk Analysis",
        subtitle="QA Mart POS Desktop Web & REST API Assessment (Holywings QA Assessment)",
        doc_ref="Task A Deliverable"
    )
    
    # 1. General Information
    h1 = doc.add_heading("1. General Information", level=1)
    h1.paragraph_format.space_before = Pt(8)
    h1.paragraph_format.space_after = Pt(4)
    h1.runs[0].font.name = "Segoe UI"
    h1.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    gen_info_headers = ["Field", "Detail"]
    gen_info_data = [
        ["Application Under Test", "QA Mart POS (https://qa-assessment.holywings.id)"],
        ["API & Business Rules Reference", "https://qa-assessment.holywings.id/docs & /README.md"],
        ["Assessment Brief", "POS - QA Engineer Skill Test (Take-Home Assignment)"],
        ["Target Platform", "Desktop Web (1440×900, Chromium) + REST API (Postman / Playwright)"],
        ["Environment", "QA Assessment / Staging (seededBugs: \"on\")"],
        ["Execution Date", "November 2026"],
        ["QA Engineer", "Senior QA Automation Candidate"]
    ]
    create_styled_table(doc, gen_info_headers, gen_info_data, col_widths=[2.2, 4.7], header_bg="1F4E79")
    
    # 2. Scope of Testing
    h2 = doc.add_heading("2. Scope of Testing", level=1)
    h2.paragraph_format.space_before = Pt(10)
    h2.paragraph_format.space_after = Pt(4)
    h2.runs[0].font.name = "Segoe UI"
    h2.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    # In Scope
    p_in = doc.add_paragraph()
    r = p_in.add_run("In Scope:")
    r.font.name = "Segoe UI"
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(46, 117, 182)
    
    in_scope_items = [
        ("Authentication & Session Management", "Active login (Cashier & Manager), email normalization (case-insensitive & whitespace trimming), invalid credentials, client-side validation, suspended account rejection (403), account lockout after 5 failed attempts (423 for 60s), logout & server-side token revocation (401), protected route guard."),
        ("Sale Screen (Desktop)", "Product catalog display (15 seeded SKUs), category filtering, search by product name and SKU (case-insensitive), out-of-stock handling, cart operations (add, increment/decrement, direct numeric edit, remove, clear), quantity boundaries (1–99 and <= stock)."),
        ("Promo Codes & Price Calculation", "HEMAT10 (10% floor, min Rp50.000 inclusive, max Rp20.000), DISKON5K (Rp5.000 flat, min Rp25.000 inclusive), LAMA2025 (expired), invalid codes, case-insensitivity, single-promo constraint, PPN 11% (round((subtotal - discount) * 0.11)), Grand Total (subtotal - discount + tax)."),
        ("Checkout, Payment & Stock", "Cash (amountPaid >= total, change = amountPaid - total), Card & QRIS (exact total, optional amountPaid), receipt modal accuracy, post-sale stock deduction."),
        ("Transactions, RBAC & Void", "Cashier sees/opens own transactions only; Manager sees all transactions and can void with 5–200 char reason; double-void prevention (409); stock restoration on void; status filtering (completed / voided)."),
        ("Product Management & API Contract (REST API)", "Manager-only POST /api/products and PUT /api/products/{id}, Cashier 403 restriction, duplicate SKU 409, field validation boundaries, error format consistency, performance requirement (< 1000 ms per endpoint).")
    ]
    
    for title, desc in in_scope_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(f"{title}: ")
        r1.font.name = "Segoe UI"
        r1.font.bold = True
        r1.font.size = Pt(10)
        r2 = p.add_run(desc)
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(10)
        
    doc.add_paragraph() # Spacing
    
    # Out of Scope
    p_out = doc.add_paragraph()
    r = p_out.add_run("Out of Scope:")
    r.font.name = "Segoe UI"
    r.font.bold = True
    r.font.size = Pt(11)
    r.font.color.rgb = RGBColor(180, 50, 50)
    
    out_scope_items = [
        ("News Features from Assessment Brief", "View, share, like, comment, report news — not present on https://qa-assessment.holywings.id (the deployed application is QA Mart POS). Handled under documented assumptions."),
        ("Mobile & Hardware Integration", "Native mobile apps (Android / iOS) and physical hardware peripherals (thermal receipt printers, barcode scanners, cash drawers)."),
        ("Stress & Load Testing", "DDoS / volumetric load testing against shared assessment cloud staging environment."),
        ("Self-Registration & Multi-Store", "Customer self-registration, user self-service password reset, and multi-tenant warehouse chains (not implemented in application under test).")
    ]
    for title, desc in out_scope_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        r1 = p.add_run(f"{title}: ")
        r1.font.name = "Segoe UI"
        r1.font.bold = True
        r1.font.size = Pt(10)
        r2 = p.add_run(desc)
        r2.font.name = "Segoe UI"
        r2.font.size = Pt(10)
        
    # 3. Assumptions, Dependencies & Data Needs
    h3 = doc.add_heading("3. Assumptions, Dependencies & Data Needs", level=1)
    h3.paragraph_format.space_before = Pt(12)
    h3.paragraph_format.space_after = Pt(4)
    h3.runs[0].font.name = "Segoe UI"
    h3.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    p_assump = doc.add_paragraph()
    p_assump.paragraph_format.space_after = Pt(3)
    r = p_assump.add_run("Key Assumptions:")
    r.font.name = "Segoe UI"
    r.font.bold = True
    r.font.size = Pt(10.5)
    
    assumptions = [
        "Requirement Precedence: The brief includes a generic News rule, whereas the live target URL exclusively serves QA Mart POS. Therefore, /docs and POS Readme.md are treated as authoritative functional business rule specifications.",
        "Deterministic State Isolation: The backend environment provides a reset hook (POST /api/test/reset) which restores initial database seed data for clean test isolation.",
        "Seeded Defects: GET /api/health returns {\"status\":\"ok\",\"seededBugs\":\"on\"}, confirming that all discrepancies between actual behavior and /docs are intentional assessment defects.",
        "Classification: Target environment is classified as Staging / QA Assessment."
    ]
    for item in assumptions:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(3)
        r = p.add_run(item)
        r.font.name = "Segoe UI"
        r.font.size = Pt(10)
        
    doc.add_paragraph() # Spacing
    
    # Test Data Table
    p_data = doc.add_paragraph()
    p_data.paragraph_format.space_after = Pt(3)
    r = p_data.add_run("Test Data Strategy & Matrix:")
    r.font.name = "Segoe UI"
    r.font.bold = True
    r.font.size = Pt(10.5)
    
    data_headers = ["Category", "Test Data Details"]
    data_rows = [
        ["Active Cashier 1", "andi@pos.test / Password123! (Andi Pratama, role: cashier)"],
        ["Active Cashier 2", "budi@pos.test / Password123! (Budi Santoso, role: cashier, owns seeded TRX-20261001-0001)"],
        ["Active Manager", "manager@pos.test / Password123! (Citra Manager, role: manager, has void privileges)"],
        ["Suspended Account", "suspended@pos.test / Password123! (status: suspended)"],
        ["Low-Stock Boundary SKU", "SNK-003 — Roasted Peanuts 250 g (Rp15.000, stock: 3)"],
        ["Out-of-Stock SKU", "GRC-004 — Granulated Sugar 1 kg (Rp17.500, stock: 0)"],
        ["Promo Boundary SKUs", "BEV-003 Instant Coffee Rp25.000 (1x = exact DISKON5K min; 2x = exact HEMAT10 min)\nGRC-001 Rice 5 kg Rp75.000 (4x = Rp300.000 for HEMAT10 Rp20.000 cap test)"],
        ["Promo Code Test Suite", "HEMAT10 (active), DISKON5K (active), LAMA2025 (expired), INVALIDCODE (non-existent)"]
    ]
    create_styled_table(doc, data_headers, data_rows, col_widths=[2.2, 4.7], header_bg="2E75B6")
    
    # 4. Risk-Based Testing Analysis
    h4 = doc.add_heading("4. Risk-Based Testing Analysis (RBT)", level=1)
    h4.paragraph_format.space_before = Pt(12)
    h4.paragraph_format.space_after = Pt(4)
    h4.runs[0].font.name = "Segoe UI"
    h4.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    rbt_headers = ["Risk ID", "Risk Area", "Business / Technical Impact", "Likelihood", "Risk Level", "Priority", "Mitigation / Test Focus"]
    rbt_data = [
        ["R-01", "Financial Calculation Errors", "Direct tax/fiscal loss; customer overcharging; revenue leakage.", "High", "Critical", "P0", "Test PPN with/without promo, exact min subtotal boundaries (Rp25k, Rp50k), max discount cap (Rp20k), and cash change."],
        ["R-02", "Inventory Integrity", "Oversold goods; negative stock; inventory count corruption.", "High", "Critical", "P0", "Test stock decrement after sale, stock restoration after void, UI/API over-stock rejection, and out-of-stock blocking."],
        ["R-03", "Broken Access Control (RBAC / IDOR)", "Cashiers voiding sales, accessing other cashiers' receipts, or modifying catalog.", "High", "Critical", "P0", "Test UI controls AND direct API calls across Cashier vs Manager roles (GET /transactions/{id}, POST /void, POST/PUT /products)."],
        ["R-04", "Session & Auth Vulnerabilities", "Stolen tokens remain valid after logout; suspended staff login; server 500 crashes.", "High", "Critical", "P0", "Test suspended account status code, token reuse after POST /api/auth/logout, 5-attempt lockout (423), and email normalization."],
        ["R-05", "Client-Side State Leaks", "Wrong discount silently applied to next customer; cashier unable to submit payment.", "Medium", "High", "P1", "Test sequential checkouts (New sale) and Clear cart after switching payment methods and applying promos."],
        ["R-06", "Catalog Usability on Desktop", "Cashiers unable to locate SKUs quickly during checkout queues.", "Medium", "High", "P1", "Test case-insensitive search by SKU and name, category filter combinations, and desktop viewport layout (1440×900)."],
        ["R-07", "API Performance Degradation", "Checkout response lag violating < 1000 ms SLA.", "Low", "Medium", "P2", "Assert response time < 1000 ms across all endpoints in Playwright & Postman suites."]
    ]
    create_styled_table(doc, rbt_headers, rbt_data, col_widths=[0.6, 1.1, 1.3, 0.7, 0.7, 0.6, 1.9], header_bg="1F4E79")
    
    # 5. Priority Classification
    h5 = doc.add_heading("5. Priority Classification", level=1)
    h5.paragraph_format.space_before = Pt(12)
    h5.paragraph_format.space_after = Pt(4)
    h5.runs[0].font.name = "Segoe UI"
    h5.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    prio_headers = ["Priority", "Definition & Criteria", "Execution Cadence"]
    prio_data = [
        ["P0 (Critical)", "Core revenue, financial calculations, inventory stock integrity, authentication, and RBAC / security gates.", "Every build & PR (Automated smoke / blocker gate)"],
        ["P1 (High)", "Primary customer workflows, promo boundaries, catalog search/filter, and product CRUD validation.", "Every release / full regression test cycle"],
        ["P2 (Medium)", "Secondary UI flows, state edge cases, exploratory resilience, and cosmetic edge cases.", "Pre-release regression test run"],
        ["P3 (Low)", "Minor UX polish, non-blocking layout details, minor text alignments.", "Executed as schedule permits"]
    ]
    create_styled_table(doc, prio_headers, prio_data, col_widths=[1.3, 3.5, 2.1], header_bg="2E75B6")
    
    # 6. Entry & Exit Criteria
    h6 = doc.add_heading("6. Entry & Exit Criteria", level=1)
    h6.paragraph_format.space_before = Pt(12)
    h6.paragraph_format.space_after = Pt(4)
    h6.runs[0].font.name = "Segoe UI"
    h6.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    p_crit = doc.add_paragraph()
    r = p_crit.add_run("Entry Criteria:")
    r.font.name = "Segoe UI"
    r.font.bold = True
    r.font.size = Pt(10.5)
    
    entry_items = [
        "Target application returns HTTP 200 OK on GET /api/health.",
        "API specification (/docs) and test credentials (POS Readme.md) are available and verified.",
        "POST /api/test/reset cleanly restores initial seed data (15 products, 1 seeded transaction)."
    ]
    for item in entry_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(item)
        r.font.name = "Segoe UI"
        r.font.size = Pt(10)
        
    p_exit = doc.add_paragraph()
    p_exit.paragraph_format.space_before = Pt(6)
    r = p_exit.add_run("Exit Criteria:")
    r.font.name = "Segoe UI"
    r.font.bold = True
    r.font.size = Pt(10.5)
    
    exit_items = [
        "100% of planned P0 and P1 test cases executed across UI and API layers.",
        "All discovered defects documented with full reproduction steps, severity, priority, and test automation evidence.",
        "Playwright JavaScript automation suite (POM + Fixtures) executes cleanly with Allure Report generated."
    ]
    for item in exit_items:
        p = doc.add_paragraph(style='List Bullet')
        p.paragraph_format.space_after = Pt(2)
        r = p.add_run(item)
        r.font.name = "Segoe UI"
        r.font.size = Pt(10)
        
    # Callout Box: Release Gate Recommendation
    add_callout(
        doc,
        title="RELEASE GATE RECOMMENDATION: NO-GO FOR PRODUCTION",
        text=(
            "Based on test execution against https://qa-assessment.holywings.id (seededBugs: \"on\"), "
            "a total of 12 defects were identified, including 7 CRITICAL severity blockers:\n"
            "• BUG-01: Suspended login triggers HTTP 500 INTERNAL_ERROR crash instead of 403.\n"
            "• BUG-02: Logout fails to revoke Bearer token server-side (session hijacking risk).\n"
            "• BUG-03: Privilege Escalation — Cashier can void any transaction directly via API.\n"
            "• BUG-04: IDOR — Cashier can view full receipt details of other cashiers via API.\n"
            "• BUG-05: Inventory Loss — Voiding a transaction fails to restore product stock.\n"
            "• BUG-06: Inventory Overselling — Checkout allows ordering over available stock (negative stock).\n"
            "• BUG-07: Fiscal Compliance — PPN 11% is computed before discount, overcharging customers.\n\n"
            "Recommendation: Block deployment until all P0/Critical security, financial, and inventory defects are resolved."
        ),
        bg_color="FCE8E6",
        border_color="C5221F",
        title_color=RGBColor(197, 34, 31)
    )
    
    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    out_dir = r"C:\Users\LOQ15\.gemini\antigravity\scratch\qa-mart-pos-assessment\docs"
    out_file = os.path.join(out_dir, "Test-Plan-and-Risk-Analysis.docx")
    build_test_plan_doc(out_file)
