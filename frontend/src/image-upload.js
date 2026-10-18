const MAX_FILE_BYTES = 25 * 1024 * 1024
const MAX_EDGE = 1600
const MAX_DATA_URL = 2600000

export function isHeicFile(file) {
  return /\.hei[cf]$/i.test(file.name || '') || /^image\/hei[cf](?:-sequence)?$/i.test(file.type || '')
}

export function validatePhoto(file) {
  if (!file || file.size === 0) throw new Error('Выберите непустой файл фотографии')
  if (file.size > MAX_FILE_BYTES) throw new Error('Фотография должна быть не больше 25 МБ')
  if (!isHeicFile(file) && !/^image\/(jpeg|png|webp)$/i.test(file.type || '') && !/\.(jpe?g|png|webp)$/i.test(file.name || '')) {
    throw new Error('Поддерживаются JPEG, PNG, WebP и фотографии iPhone HEIC/HEIF')
  }
}

async function decode(blob) {
  // data: images are allowed by our CSP; blob: image URLs are intentionally not.
  const source = await new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(new Error('Не удалось прочитать фотографию'))
    reader.readAsDataURL(blob)
  })
  const image = new Image()
  image.src = source
  await image.decode()
  if (!image.naturalWidth || !image.naturalHeight) throw new Error('Пустое изображение')
  return image
}

// Conversion happens locally. Only the reviewed JPEG is sent with the report.
export async function preparePhoto(file) {
  validatePhoto(file)
  let image
  try { image = await decode(file) }
  catch {
    if (!isHeicFile(file)) throw new Error('Не удалось прочитать фотографию. Выберите другой снимок')
    try {
      const { heicTo } = await import('heic-to/csp')
      image = await decode(await heicTo({ blob: file, type: 'image/jpeg', quality: 0.9 }))
    } catch { throw new Error('Не удалось обработать HEIC. Экспортируйте фото как JPEG и попробуйте снова') }
  }
  const scale = Math.min(1, MAX_EDGE / Math.max(image.naturalWidth, image.naturalHeight))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
  canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
  try {
    const context = canvas.getContext('2d')
    if (!context) throw new Error('Браузер не смог обработать фотографию')
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    let result = ''
    for (const quality of [0.85, 0.7, 0.5]) {
      result = canvas.toDataURL('image/jpeg', quality)
      if (result.length <= MAX_DATA_URL) return result
    }
    throw new Error('Снимок слишком сложный для загрузки. Выберите меньшую фотографию')
  } finally { canvas.width = 1; canvas.height = 1 }
}
