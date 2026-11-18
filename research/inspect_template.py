import zipfile
import xml.etree.ElementTree as ET

with zipfile.ZipFile('SOTA_Project.docx') as z:
    xml_content = z.read('word/document.xml')
    tree = ET.fromstring(xml_content)
    namespaces = {'w': 'http://schemas.openxmlformats.org/wordprocessingml/2006/main'}
    
    print("--- BODY ELEMENTS ---")
    body = tree.find('w:body', namespaces)
    for i, child in enumerate(body):
        tag = child.tag.split('}')[-1]
        if tag == 'p':
            pPr = child.find('w:pPr', namespaces)
            style = ""
            if pPr is not None:
                pStyle = pPr.find('w:pStyle', namespaces)
                if pStyle is not None:
                    style = pStyle.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '')
            t = ''.join(child.itertext()).strip()
            print(f"P {i:02d} [{style}]: {t[:80]}")
        elif tag == 'tbl':
            print(f"TBL {i:02d}:")
            for r_idx, tr in enumerate(child.findall('.//w:tr', namespaces)):
                cells = []
                for tc in tr.findall('.//w:tc', namespaces):
                    tcPr = tc.find('w:tcPr', namespaces)
                    w = ""
                    shd = ""
                    if tcPr is not None:
                        tcW = tcPr.find('w:tcW', namespaces)
                        if tcW is not None:
                            w = tcW.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}w', '')
                        tcShd = tcPr.find('w:shd', namespaces)
                        if tcShd is not None:
                            shd = tcShd.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}fill', '')
                    t = ''.join(tc.itertext()).strip()
                    cells.append(f"({w}, {shd}) {t}")
                print(f"  Row {r_idx}: " + " | ".join(cells))

    # Also check styles.xml
    styles_xml = z.read('word/styles.xml')
    s_tree = ET.fromstring(styles_xml)
    print("\n--- STYLES ---")
    for s in s_tree.findall('.//w:style', namespaces):
        s_id = s.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}styleId', '')
        s_type = s.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}type', '')
        name_el = s.find('w:name', namespaces)
        name = name_el.attrib.get('{http://schemas.openxmlformats.org/wordprocessingml/2006/main}val', '') if name_el is not None else ''
        print(f"Style: {s_id} ({s_type}) -> {name}")
