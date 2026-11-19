import os
import re
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT
from docx.oxml import parse_xml
from doc_helpers import (
    set_cell_background, set_cell_margins, create_styled_table,
    add_header_block, add_callout
)

EVIDENCE_MAP = {
    "BUG-01": "bug-01-suspended-login.png",
    "BUG-02": "bug-02-logout-token-not-revoked.png",
    "BUG-03": "bug-03-cashier-void-privilege-escalation.png",
    "BUG-04": "bug-04-idor-cashier-access-other-receipt.png",
    "BUG-05": "bug-05-void-stock-not-restored.png",
    "BUG-06": "bug-06-checkout-overselling-negative-stock.png",
    "BUG-07": "bug-07-ppn-before-discount.png",
    "BUG-08": "bug-08-hemat10-no-cap.png",
    "BUG-09": "bug-09-promo-min-boundary.png",
    "BUG-10": "bug-10-email-case-sensitive.png",
    "BUG-11": "bug-11-case-sensitive-search.png",
    "BUG-12": "bug-12-clear-cart-desync.png",
}

def create_bug_card_table(doc, bug_dict, evidence_dir):
    headers = ["FIELD", "DESCRIPTION"]
    
    severity_colors = {
        "Critical": "C5221F",
        "Major": "E37400",
        "Minor": "1E8E3E"
    }
    sev = bug_dict.get("Severity", "Major")
    
    rows = [
        ["Bug ID & Title", bug_dict.get("Bug ID & Title", "")],
        ["Module", bug_dict.get("Module", "")],
        ["Environment", bug_dict.get("Environment", "")],
        ["Platform", bug_dict.get("Platform", "")],
        ["Severity", bug_dict.get("Severity", "")],
        ["Priority", bug_dict.get("Priority", "")],
        ["Preconditions", bug_dict.get("Preconditions", "")],
        ["Steps to Reproduce", bug_dict.get("Steps to Reproduce", "")],
        ["Expected Result", bug_dict.get("Expected Result", "")],
        ["Actual Result", bug_dict.get("Actual Result", "")],
        ["Attachment / Evidence", bug_dict.get("Attachment / Evidence", "")]
    ]
    
    table = doc.add_table(rows=len(rows) + 1, cols=2)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    
    # Header row
    hdr_cells = table.rows[0].cells
    hdr_cells[0].text = "FIELD"
    hdr_cells[1].text = "DESCRIPTION"
    for c in hdr_cells:
        set_cell_background(c, "1F4E79")
        set_cell_margins(c, top=100, bottom=100, left=130, right=130)
        p = c.paragraphs[0]
        for run in p.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(9.5)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    # Repeat header row across pages
    trPr = table.rows[0]._tr.get_or_add_trPr()
    trPr.append(parse_xml(r'<w:tblHeader xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"/>'))
    
    for idx, (field_name, field_val) in enumerate(rows):
        row_cells = table.rows[idx + 1].cells
        row_cells[0].text = field_name
        row_cells[1].text = field_val
        
        set_cell_background(row_cells[0], "F2F5F9")
        set_cell_margins(row_cells[0], top=80, bottom=80, left=120, right=120)
        p0 = row_cells[0].paragraphs[0]
        for run in p0.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(9)
            run.font.bold = True
            run.font.color.rgb = RGBColor(31, 78, 121)
            
        set_cell_margins(row_cells[1], top=80, bottom=80, left=120, right=120)
        p1 = row_cells[1].paragraphs[0]
        for run in p1.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(9)
            run.font.color.rgb = RGBColor(40, 40, 40)
            
        if field_name == "Severity":
            set_cell_background(row_cells[1], "FCE8E6" if sev == "Critical" else "FEF7E0")
            for run in p1.runs:
                run.font.bold = True
                run.font.color.rgb = RGBColor(197, 34, 31) if sev == "Critical" else RGBColor(180, 100, 0)
                
    for row in table.rows:
        row.cells[0].width = Inches(1.8)
        row.cells[1].width = Inches(5.1)
        
    doc.add_paragraph() # Spacing
    
    # Embed screenshot if available
    bug_id_match = re.search(r'BUG-\d+', bug_dict.get("Bug ID & Title", ""))
    if bug_id_match:
        bug_id = bug_id_match.group(0)
        if bug_id in EVIDENCE_MAP:
            img_file = os.path.join(evidence_dir, EVIDENCE_MAP[bug_id])
            if os.path.exists(img_file):
                p_cap = doc.add_paragraph()
                p_cap.paragraph_format.space_before = Pt(4)
                p_cap.paragraph_format.space_after = Pt(2)
                r_cap = p_cap.add_run(f"Figure {bug_id}: Live Environment Evidence Screenshot ({EVIDENCE_MAP[bug_id]})")
                r_cap.font.name = "Segoe UI"
                r_cap.font.size = Pt(8.5)
                r_cap.font.italic = True
                r_cap.font.color.rgb = RGBColor(100, 100, 100)
                
                doc.add_picture(img_file, width=Inches(6.2))
                
                p_space = doc.add_paragraph()
                p_space.paragraph_format.space_after = Pt(12)

def parse_markdown_bugs(md_file_path):
    with open(md_file_path, "r", encoding="utf-8") as f:
        content = f.read()
        
    bugs = []
    bug_sections = re.split(r'###\s+(BUG-\d+)', content)
    
    for i in range(1, len(bug_sections), 2):
        body = bug_sections[i+1]
        bug_dict = {}
        for line in body.strip().split("\n"):
            line = line.strip()
            if line.startswith("|") and not line.startswith("| FIELD") and not line.startswith("| :---"):
                parts = [p.strip() for p in line.split("|")]
                if len(parts) >= 3:
                    raw_field = parts[1].replace("**", "").strip()
                    raw_desc = parts[2].replace("<br>", "\n").strip()
                    if raw_field:
                        bug_dict[raw_field] = raw_desc
                        
        if bug_dict:
            bugs.append(bug_dict)
            
    return bugs

def build_bug_reports_doc(md_path, evidence_dir, output_path):
    doc = Document()
    
    for section in doc.sections:
        section.top_margin = Inches(0.8)
        section.bottom_margin = Inches(0.8)
        section.left_margin = Inches(0.8)
        section.right_margin = Inches(0.8)
        
    add_header_block(
        doc,
        title="Bug Reports & Defect Findings",
        subtitle="Standard Brief Format (Task A & Task B) — QA Mart POS Assessment",
        doc_ref="11-Field Table Format with Visual Evidence"
    )
    
    # Overview
    p_intro = doc.add_paragraph()
    p_intro.paragraph_format.space_after = Pt(8)
    r = p_intro.add_run(
        "All defects listed below were identified, verified, and automated on the target platform "
        "https://qa-assessment.holywings.id (seededBugs: \"on\") against the official business rules in "
        "https://qa-assessment.holywings.id/docs and POS Readme.md. Each bug report follows the mandatory "
        "11-field specification outlined in the assessment brief, complete with embedded visual evidence screenshots."
    )
    r.font.name = "Segoe UI"
    r.font.size = Pt(10)
    r.font.color.rgb = RGBColor(50, 50, 50)
    
    # Summary Table
    h_sum = doc.add_heading("Executive Defect Summary", level=1)
    h_sum.paragraph_format.space_before = Pt(8)
    h_sum.paragraph_format.space_after = Pt(4)
    h_sum.runs[0].font.name = "Segoe UI"
    h_sum.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    exec_headers = ["Bug ID", "Defect Title", "Module", "Platform", "Severity", "Priority", "Automated Check"]
    exec_data = [
        ["BUG-01", "Suspended account login returns HTTP 500 INTERNAL_ERROR instead of 403", "Authentication", "Web / API", "Critical", "Critical", "TC-AUTH-007"],
        ["BUG-02", "Logout does not revoke Bearer token server-side", "Authentication / Session", "API", "Critical", "Critical", "TC-AUTH-009"],
        ["BUG-03", "Privilege Escalation: Cashier can void transactions via API", "Transactions / RBAC", "API", "Critical", "Critical", "TC-TX-006"],
        ["BUG-04", "IDOR: Cashier can view other cashier's transaction receipt via API", "Transactions / RBAC", "API", "Critical", "Critical", "TC-TX-007"],
        ["BUG-05", "Voiding transaction does not restore sold product stock", "Inventory / Void", "Web / API", "Critical", "Critical", "TC-TX-005"],
        ["BUG-06", "Checkout allows quantity exceeding available stock (negative inventory)", "Checkout / Inventory", "API", "Critical", "Critical", "TC-API-008"],
        ["BUG-07", "PPN 11% is calculated on gross subtotal before discount", "Cart / Price Calc", "Web / API", "Critical", "Critical", "TC-PROMO-003"],
        ["BUG-08", "HEMAT10 promo code ignores maximum discount cap of Rp20.000", "Promo Codes", "Web / API", "Critical", "High", "TC-PROMO-004"],
        ["BUG-09", "Promo minimum subtotal validation is exclusive (>) instead of inclusive (>=)", "Promo Codes", "Web / API", "Major", "High", "TC-PROMO-005"],
        ["BUG-10", "Login email is case-sensitive and fails with surrounding whitespace", "Authentication", "Web / API", "Major", "High", "TC-AUTH-008"],
        ["BUG-11", "Product search (q) is case-sensitive for both name and SKU", "Catalog / Search", "Web / API", "Major", "High", "TC-SALE-006"],
        ["BUG-12", "Promo code leaks across sales and Clear cart causes payment UI/state desync", "Sale Screen / Cart", "Web", "Major", "Medium", "TC-SALE-007 / PROMO-006"]
    ]
    create_styled_table(doc, exec_headers, exec_data, col_widths=[0.8, 2.2, 1.1, 0.7, 0.7, 0.7, 0.7], header_bg="1F4E79")
    
    # Detailed Reports
    h_det = doc.add_heading("Detailed Defect Reports (Standard Brief Format)", level=1)
    h_det.paragraph_format.space_before = Pt(14)
    h_det.paragraph_format.space_after = Pt(8)
    h_det.runs[0].font.name = "Segoe UI"
    h_det.runs[0].font.color.rgb = RGBColor(31, 78, 121)
    
    bugs = parse_markdown_bugs(md_path)
    print(f"Parsed {len(bugs)} bug reports from markdown.")
    
    for bug in bugs:
        h_bug = doc.add_heading(bug.get("Bug ID & Title", "Defect Report"), level=2)
        h_bug.paragraph_format.space_before = Pt(8)
        h_bug.paragraph_format.space_after = Pt(4)
        h_bug.runs[0].font.name = "Segoe UI"
        h_bug.runs[0].font.size = Pt(11.5)
        h_bug.runs[0].font.color.rgb = RGBColor(46, 117, 182)
        
        create_bug_card_table(doc, bug, evidence_dir)
        
    doc.save(output_path)
    print(f"Successfully generated: {output_path}")

if __name__ == "__main__":
    md_file = r"C:\Users\LOQ15\.gemini\antigravity\scratch\qa-mart-pos-assessment\docs\bug-reports.md"
    evidence_dir = r"C:\Users\LOQ15\.gemini\antigravity\scratch\qa-mart-pos-assessment\docs\evidence"
    out_dir = r"C:\Users\LOQ15\.gemini\antigravity\scratch\qa-mart-pos-assessment\docs"
    out_file = os.path.join(out_dir, "Bug-Reports-and-Findings-with-Screenshots.docx")
    build_bug_reports_doc(md_file, evidence_dir, out_file)
    # Also try overwriting original if unlocked
    orig_file = os.path.join(out_dir, "Bug-Reports-and-Findings.docx")
    try:
        import shutil
        shutil.copy2(out_file, orig_file)
        print("Updated original Bug-Reports-and-Findings.docx as well.")
    except Exception as e:
        print(f"Original file is currently open in Word ({e}), saved to {out_file}")
