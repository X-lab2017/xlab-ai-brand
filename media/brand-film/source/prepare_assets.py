from pathlib import Path
import copy, hashlib, json, os, shutil, sys, xml.etree.ElementTree as ET
ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "deps"))
import qrcode, zxingcpp
from PIL import Image
REPO = Path(os.environ.get("XLAB_BRAND_REPO", str(ROOT.parent / "xlab-ai-brand")))
BRAND = REPO / "brand/Xlab_AI_Logo_System_v1.0"
assets = ROOT / "assets"
assets.mkdir(exist_ok=True)
manifest = []
for p in sorted((BRAND / "02_SVG_矢量描摹").rglob("*.svg")):
    dest = assets / p.name
    shutil.copyfile(p, dest)
    manifest.append({"source": str(p.relative_to(REPO)), "file": dest.name, "sha256": hashlib.sha256(p.read_bytes()).hexdigest()})
for p in sorted((BRAND / "04_应用图标").glob("*Avatar*1024.png")):
    shutil.copyfile(p, assets / p.name)
NS = "{http://www.w3.org/2000/svg}"
ET.register_namespace("", NS[1:-1])
for variant in ["Horizontal", "Vertical"]:
    src = assets / ("XlabAI_" + variant + "_ColorDark.svg")
    tree = ET.parse(src)
    root = tree.getroot()
    group = root.findall(NS + "g")[1]
    green = next(e for e in group if e.attrib.get("data-role") == "green")
    parts = green.attrib["d"].split("M ")
    parts = ["M " + p for p in parts if p.strip()]
    assert len(parts) == 4
    green.attrib["d"] = parts[0]
    ET.ElementTree(root).write(assets / (variant + "_base.svg"), encoding="utf-8", xml_declaration=False)
    root = ET.parse(src).getroot()
    for e in list(root):
        if e.tag == NS + "g" and e.attrib.get("id") != "component-2":
            root.remove(e)
    group = root.findall(NS + "g")[0]
    for e in list(group):
        if e.attrib.get("data-role") != "green":
            group.remove(e)
    green = group[0]
    green.attrib["d"] = " ".join(parts[1:])
    ET.ElementTree(root).write(assets / (variant + "_ai.svg"), encoding="utf-8", xml_declaration=False)
qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=10, border=4)
url = "https://github.com/X-lab2017/xlab-ai-brand"
qr.add_data(url)
qr.make(fit=True)
qr.make_image(fill_color="#171A1F", back_color="white").save(assets / "repository_qr.png")
decoded = zxingcpp.read_barcode(Image.open(assets / "repository_qr.png"))
assert decoded and decoded.text == url
(ROOT / "assets" / "source_manifest.json").write_text(json.dumps({"repository":url,"logo_version":"v1.0","assets":manifest,"qr_url":url},ensure_ascii=False,indent=2))
copy_data = [
    {"start":0,"end":5,"cn":"指数点亮","en":"Potential, amplified."},
    {"start":5,"end":12.5,"cn":"一个新的指数","en":"A new exponent."},
    {"start":12.5,"end":20,"cn":"让 AI 成为认知升级的「指数」","en":"AI, the exponent of cognitive growth."},
    {"start":20,"end":25,"cn":"一套系统，多种表达","en":"One identity. Many expressions."},
    {"start":25,"end":30,"cn":"五种结构 · 四种配色","en":"5 layouts. 4 colorways."},
    {"start":30,"end":37.5,"cn":"在每个场景，保持一致","en":"Consistent, wherever you are."},
    {"start":37.5,"end":45,"cn":"以开放连接智慧，以 AI 拓展认知。","en":"Connect minds through openness. Expand horizons with AI."},
    {"start":38.8,"end":45,"cn":"获取品牌资源 · 欢迎反馈","en":"Get the assets. Share your feedback."}
]
(ROOT / "source" / "bilingual_copy.json").write_text(json.dumps(copy_data,ensure_ascii=False,indent=2))
print(json.dumps({"formal_svg_files":len(manifest),"qr_verified":decoded.text,"font_ready":(ROOT/"fonts/SourceHanSansSC-Regular.otf").exists()}))

