import os
import docx
from docx import Document
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import parse_xml, OxmlElement
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, hex_color):
    shading_elm = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{hex_color}"/>')
    cell._tc.get_or_add_tcPr().append(shading_elm)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def style_paragraph(p, font_name="Segoe UI", font_size=10.5, color=RGBColor(51, 51, 51), line_spacing=1.15, space_after=4):
    p.paragraph_format.line_spacing = line_spacing
    p.paragraph_format.space_after = Pt(space_after)
    for run in p.runs:
        run.font.name = font_name
        run.font.size = Pt(font_size)
        run.font.color.rgb = color

def create_styled_table(doc, headers, data, col_widths=None, header_bg="1F4E79", alt_bg="F2F5F9"):
    table = doc.add_table(rows=len(data) + 1, cols=len(headers))
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    
    # Header row
    hdr_cells = table.rows[0].cells
    for i, header_text in enumerate(headers):
        hdr_cells[i].text = header_text
        set_cell_background(hdr_cells[i], header_bg)
        set_cell_margins(hdr_cells[i], top=120, bottom=120, left=140, right=140)
        p = hdr_cells[i].paragraphs[0]
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        for run in p.runs:
            run.font.name = "Segoe UI"
            run.font.size = Pt(10)
            run.font.bold = True
            run.font.color.rgb = RGBColor(255, 255, 255)
            
    # Repeat header row across pages
    trPr = table.rows[0]._tr.get_or_add_trPr()
    trPr.append(parse_xml(f'<w:tblHeader {nsdecls("w")}/>'))
    
    # Data rows
    for r_idx, row_data in enumerate(data):
        row_cells = table.rows[r_idx + 1].cells
        bg_col = alt_bg if r_idx % 2 == 1 else "FFFFFF"
        for c_idx, val in enumerate(row_data):
            row_cells[c_idx].text = str(val)
            if bg_col != "FFFFFF":
                set_cell_background(row_cells[c_idx], bg_col)
            set_cell_margins(row_cells[c_idx], top=100, bottom=100, left=140, right=140)
            p = row_cells[c_idx].paragraphs[0]
            p.alignment = WD_ALIGN_PARAGRAPH.LEFT
            for run in p.runs:
                run.font.name = "Segoe UI"
                run.font.size = Pt(9.5)
                run.font.color.rgb = RGBColor(40, 40, 40)
                
    if col_widths:
        for row in table.rows:
            for idx, width in enumerate(col_widths):
                row.cells[idx].width = Inches(width)
                
    doc.add_paragraph() # spacing
    return table

def add_header_block(doc, title, subtitle, doc_ref):
    title_p = doc.add_paragraph()
    title_p.paragraph_format.space_before = Pt(0)
    title_p.paragraph_format.space_after = Pt(2)
    run = title_p.add_run(title)
    run.font.name = "Segoe UI"
    run.font.size = Pt(22)
    run.font.bold = True
    run.font.color.rgb = RGBColor(31, 78, 121)
    
    sub_p = doc.add_paragraph()
    sub_p.paragraph_format.space_after = Pt(4)
    run_sub = sub_p.add_run(subtitle)
    run_sub.font.name = "Segoe UI"
    run_sub.font.size = Pt(12)
    run_sub.font.color.rgb = RGBColor(89, 89, 89)
    
    meta_p = doc.add_paragraph()
    meta_p.paragraph_format.space_after = Pt(16)
    run_meta = meta_p.add_run(f"Standard Brief Deliverable | {doc_ref} | Date: November 2026")
    run_meta.font.name = "Segoe UI"
    run_meta.font.size = Pt(9.5)
    run_meta.font.italic = True
    run_meta.font.color.rgb = RGBColor(120, 120, 120)

def add_callout(doc, title, text, bg_color="FFF2CC", border_color="D6B656", title_color=RGBColor(180, 100, 0)):
    table = doc.add_table(rows=1, cols=1)
    table.alignment = WD_TABLE_ALIGNMENT.CENTER
    table.style = 'Table Grid'
    cell = table.rows[0].cells[0]
    cell.width = Inches(6.5)
    set_cell_background(cell, bg_color)
    set_cell_margins(cell, top=140, bottom=140, left=180, right=180)
    
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(2)
    r_t = p.add_run(title + "\n")
    r_t.font.name = "Segoe UI"
    r_t.font.bold = True
    r_t.font.size = Pt(10.5)
    r_t.font.color.rgb = title_color
    
    r_b = p.add_run(text)
    r_b.font.name = "Segoe UI"
    r_b.font.size = Pt(9.5)
    r_b.font.color.rgb = RGBColor(50, 50, 50)
    
    doc.add_paragraph()

print("Helper definitions loaded successfully.")
