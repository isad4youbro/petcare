"""Bounded, allowlisted configs for the user-supplied pixel-pets renderer."""
import json
from pathlib import Path
import re

CATALOG = json.loads(Path(__file__).with_name('avatar_catalog.json').read_text('utf-8'))


def clean_sprite(value):
    if not isinstance(value, dict) or value.get('engineVersion') != 1:
        raise ValueError('Проверьте версию аватара')
    species = value.get('species')
    if not isinstance(species, str) or species not in CATALOG['species']:
        raise ValueError('Выберите внешность из каталога')
    rig = CATALOG['species'][species]
    parts, colors = value.get('parts', {}), value.get('colors', {})
    if not isinstance(parts, dict) or not isinstance(colors, dict):
        raise ValueError('Проверьте настройки аватара')
    allowed = CATALOG['parts'].get(rig, {})
    if any(k not in allowed or v not in allowed[k] for k, v in parts.items()):
        raise ValueError('Эта форма недоступна для выбранного вида')
    keys = ('base', 'sec', 'pat', 'eye', 'ext', 'feet', 'acc')
    if any(not isinstance(colors.get(k), str) or colors[k] not in CATALOG['palette'] for k in keys):
        raise ValueError('Выберите цвета из палитры')
    pattern = value.get('pattern')
    if pattern not in CATALOG['patterns'].get(rig, ['solid']):
        raise ValueError('Этот узор недоступен для выбранного вида')
    if value.get('neck', 'none') not in ('none', 'collar', 'bell', 'bandana') or value.get('head', 'none') not in ('none', 'bow', 'flower', 'hat', 'glasses'):
        raise ValueError('Проверьте аксессуары')
    paint = value.get('paint', {})
    if not isinstance(paint, dict) or len(paint) > 1100 or any(not re.fullmatch(r'[a-z0-9]{1,8}(:-?[a-z0-9]{1,3}){0,3}', k, re.I) or v not in CATALOG['palette'] for k, v in paint.items()):
        raise ValueError('Проверьте рисунок аватара')
    if value.get('paintBase', 'constructor') not in ('constructor', 'white'):
        raise ValueError('Проверьте основу рисунка')
    return {'engineVersion': 1, 'species': species, 'parts': parts, 'pattern': pattern,
            'colors': {k: colors[k] for k in keys}, 'neck': value.get('neck', 'none'),
            'head': value.get('head', 'none'), 'paint': paint, 'paintBase': value.get('paintBase', 'constructor')}
