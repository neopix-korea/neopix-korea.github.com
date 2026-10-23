"""Create print assets for the 15 permanent MAKE classroom URLs."""
from pathlib import Path
import csv
import zipfile
import qrcode
import qrcode.image.svg
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent
OUT = ROOT / 'print-assets' / 'make-qr'
(OUT / 'png').mkdir(parents=True, exist_ok=True)
(OUT / 'svg').mkdir(parents=True, exist_ok=True)
rows = []
for number in range(1, 16):
    label = f'{number:02d}'
    url = f'https://neopix-korea.github.io/make/{label}/'
    qr = qrcode.QRCode(error_correction=qrcode.constants.ERROR_CORRECT_M, box_size=30, border=4)
    qr.add_data(url)
    qr.make(fit=True)
    png = qr.make_image(fill_color='black', back_color='white').convert('RGB')
    png.save(OUT / 'png' / f'make-{label}.png', dpi=(600, 600))
    qr.make_image(image_factory=qrcode.image.svg.SvgPathImage).save(OUT / 'svg' / f'make-{label}.svg')
    assert len(qr.data_list) == 1 and qr.data_list[0].data.decode() == url
    assert png.getpixel((0, 0)) == (255, 255, 255)
    rows.append((label, url, f'png/make-{label}.png', f'svg/make-{label}.svg'))

with (OUT / 'urls.csv').open('w', newline='', encoding='utf-8-sig') as handle:
    writer = csv.writer(handle)
    writer.writerow(['number', 'url', 'png', 'svg'])
    writer.writerows(rows)

(OUT / 'README.txt').write_text(
    'MAKE 강의실 QR 코드 01–15\n\n'
    'png/: 흰 바탕·검정 QR, 600dpi 메타데이터의 고해상도 PNG\n'
    'svg/: 인쇄용 벡터 QR (배경 투명, 흰 종이에 배치)\n'
    'urls.csv: 번호별 연결 주소\n'
    'preview.png: 파일 확인용 미리보기 (책에는 개별 파일 사용)\n\n'
    '테두리 장식, 프레임, 이미지 내부 번호 없음.\n'
    'QR 주변 4모듈은 인식용 빈 여백이며 자르지 않습니다.\n'
    '모든 코드는 https://neopix-korea.github.io/make/01/ 형식의 강의실에 연결됩니다.\n', encoding='utf-8')

sheet = Image.new('RGB', (1500, 1900), 'white')
draw = ImageDraw.Draw(sheet)
font = ImageFont.truetype('C:/Windows/Fonts/arial.ttf', 26)
for index, (label, url, png_path, _) in enumerate(rows):
    x = (index % 3) * 500
    y = (index // 3) * 380
    with Image.open(OUT / png_path) as source:
        thumb = source.resize((300, 300), Image.Resampling.NEAREST)
        sheet.paste(thumb, (x + 100, y + 5))
    draw.text((x + 150, y + 315), f'MAKE {label}', fill='black', font=font)
sheet.save(OUT / 'preview.png')

with zipfile.ZipFile(OUT.parent / 'make-qr-01-15.zip', 'w', zipfile.ZIP_DEFLATED) as archive:
    for path in sorted(OUT.rglob('*')):
        if path.is_file():
            archive.write(path, path.relative_to(OUT.parent))
print(f'Created and checked {len(rows)} QR codes in PNG and SVG: {OUT}')
