// Local 32×32 pixel treatment. The photo never leaves the device for generation.
export async function photoToPixel(source) {
  const img = new Image()
  await new Promise((resolve, reject) => { img.onload = resolve; img.onerror = () => reject(new Error('Не удалось прочитать изображение')); img.src = source })
  const canvas = document.createElement('canvas'); canvas.width = 32; canvas.height = 32
  const context = canvas.getContext('2d'), side = Math.min(img.naturalWidth, img.naturalHeight)
  if (!side || !context) throw new Error('Не удалось создать аватар')
  context.drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, 32, 32)
  const pixels = context.getImageData(0, 0, 32, 32)
  for (let i = 0; i < pixels.data.length; i += 4) for (let c = 0; c < 3; c++) pixels.data[i + c] = Math.min(255, Math.round(pixels.data[i + c] / 32) * 32)
  context.putImageData(pixels, 0, 0)
  return canvas.toDataURL('image/png')
}
