from pathlib import Path
import concurrent.futures, hashlib, io, json, re, shutil, subprocess, sys, zipfile
ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/"deps"))
import numpy as np
import zxingcpp
from PIL import Image
OUT=ROOT/"output"
POSTERS=ROOT/"posters"; POSTERS.mkdir(exist_ok=True)
url="https://github.com/X-lab2017/xlab-ai-brand"
def check(p):
    meta=json.loads(subprocess.check_output(["ffprobe","-v","error","-show_format","-show_streams","-of","json",str(p)]))
    v=next(s for s in meta["streams"] if s["codec_type"]=="video")
    a=next(s for s in meta["streams"] if s["codec_type"]=="audio")
    assert abs(float(meta["format"]["duration"])-45)<.05
    assert v["codec_name"]=="h264" and v["pix_fmt"]=="yuv420p" and v["avg_frame_rate"]=="30/1"
    assert a["codec_name"]=="aac" and a["channels"]==2
    assert (v["width"],v["height"]) in [(1920,1080),(1080,1920)]
    subprocess.run(["ffmpeg","-v","error","-i",str(p),"-f","null","-"],check=True,capture_output=True)
    png=subprocess.check_output(["ffmpeg","-v","error","-ss","41.5","-i",str(p),"-frames:v","1","-f","image2pipe","-vcodec","png","pipe:1"])
    im=Image.open(io.BytesIO(png))
    decoded=zxingcpp.read_barcode(im)
    assert decoded and decoded.text==url
    mode="landscape" if v["width"]==1920 else "portrait"
    expected=Image.open(ROOT/"previews"/(mode+"_41.5.png")).convert("RGB")
    difference=np.asarray(im.convert("RGB"),dtype=np.float32)-np.asarray(expected,dtype=np.float32)
    rmse=float(np.sqrt(np.mean(difference*difference)))
    assert rmse<4.0,rmse
    poster_name="Xlab_AI_指数点亮_"+("横版" if mode=="landscape" else "竖版")+"_片尾.png"
    im.save(POSTERS/poster_name)
    audio_md5=subprocess.check_output(["ffmpeg","-v","error","-i",str(p),"-map","0:a:0","-c:a","pcm_s16le","-f","md5","-"]).decode().strip()
    return {"file":p.name,"bytes":p.stat().st_size,"sha256":hashlib.sha256(p.read_bytes()).hexdigest(),"duration":45.0,"width":v["width"],"height":v["height"],"fps":30,"video_codec":"H.264","audio_codec":"AAC","audio_channels":2,"decode_errors":0,"qr_url":decoded.text,"qr_verified_at":41.5,"render_reference_rmse":rmse,"audio_pcm_md5":audio_md5}
with concurrent.futures.ThreadPoolExecutor(max_workers=2) as pool:
    results=list(pool.map(check,sorted(OUT.glob("*.mp4"))))
assert len(results)==2 and results[0]["audio_pcm_md5"]==results[1]["audio_pcm_md5"]
loudness=subprocess.run(["ffmpeg","-hide_banner","-nostats","-i",str(OUT/results[0]["file"]),"-vn","-af","loudnorm=I=-17:TP=-1.5:LRA=7:print_format=json","-f","null","-"],capture_output=True,text=True,check=True).stderr
loudness=json.loads(loudness[loudness.rfind("{"):])
assert float(loudness["input_tp"])<-.5
checks={"videos":results,"same_soundtrack":True,"integrated_loudness_lufs":float(loudness["input_i"]),"true_peak_dbtp":float(loudness["input_tp"]),"original_instrumental_music":True,"voice_over":False}
(ROOT/"source"/"quality_checks.json").write_text(json.dumps(checks,ensure_ascii=False,indent=2))
repo=Path("/workspace/scratch/83b2367aed49/brand-publication/Xlab_AI_GitHub_Publish/repository")
shutil.copyfile(repo/"NOTICE.md",ROOT/"assets"/"BRAND_NOTICE.md")
for name in ["NimbusSans-Regular.otf","NimbusSans-Bold.otf"]:
    p=ROOT/"fonts"/name
    if p.exists():p.unlink()
(ROOT/"requirements.txt").write_text("numpy\nscipy\nPillow\nqrcode\nzxing-cpp\n")
bundle=OUT/"Xlab_AI_指数点亮_制作文件包.zip"
with zipfile.ZipFile(bundle,"w",compression=zipfile.ZIP_DEFLATED,compresslevel=8) as archive:
    for folder in ["source","fonts","assets","posters"]:
        for p in sorted((ROOT/folder).rglob("*")):
            if p.is_file() and p.name!="music_raw.wav":
                archive.write(p,"Xlab_AI_指数点亮/"+str(p.relative_to(ROOT)))
    for filename in ["README.txt","package.json","requirements.txt"]:
        archive.write(ROOT/filename,"Xlab_AI_指数点亮/"+filename)
with zipfile.ZipFile(bundle) as archive:assert archive.testzip() is None
print(json.dumps({"checks":checks,"bundle_bytes":bundle.stat().st_size},ensure_ascii=False))

