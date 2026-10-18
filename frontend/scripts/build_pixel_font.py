"""Repair two missing Cyrillic glyphs in Pixelify Sans 5.2.7, under OFL.
Requires fonttools. Run from the project root after npm ci.
"""
from copy import deepcopy
from pathlib import Path
from fontTools.ttLib import TTFont
root = Path(__file__).resolve().parents[1]
source = root / 'node_modules/@fontsource/pixelify-sans/files'
out = root / 'src/assets/fonts'
out.mkdir(parents=True, exist_ok=True)
for weight in (400, 600):
    latin = TTFont(source / f'pixelify-sans-latin-{weight}-normal.woff')
    cyr = TTFont(source / f'pixelify-sans-cyrillic-{weight}-normal.woff')
    # Cyrillic O has the same design and metrics as Latin O.
    cyr['glyf']['uni041E'] = deepcopy(latin['glyf']['O'])
    cyr['hmtx']['uni041E'] = latin['hmtx']['O']
    # Raise the upper edge of the existing small pe to the capital ge height.
    glyph = deepcopy(cyr['glyf']['uni043F'])
    top = cyr['glyf']['uni0413'].yMax
    delta = top - glyph.yMax
    for i, (x, y) in enumerate(glyph.coordinates):
        if y > 0: glyph.coordinates[i] = (x, y + delta)
    cyr['glyf']['uni041F'] = glyph
    cyr['hmtx']['uni041F'] = cyr['hmtx']['uni043F']
    cyr.setGlyphOrder(list(cyr['glyf'].glyphs))
    for table in cyr['cmap'].tables:
        if table.isUnicode(): table.cmap.update({0x041E: 'uni041E', 0x041F: 'uni041F'})
    for subset, font in [('latin', latin), ('cyrillic', cyr)]:
        for record in font['name'].names:
            if record.nameID in (1, 3, 4, 6, 16):
                record.string = ('PetCare Pixel' if record.nameID != 6 else 'PetCarePixel').encode(record.getEncoding())
        font.flavor = 'woff'
        font.save(out / f'petcare-pixel-{subset}-{weight}.woff')
        if subset == 'cyrillic':
            assert all(ord(char) in font.getBestCmap() for char in ''.join(map(chr, range(0x410, 0x450))))

