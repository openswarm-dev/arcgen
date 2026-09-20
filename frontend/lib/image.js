export async function fileToDataUrl(file, kind) {
  const bitmap = await createImageBitmap(file);
  const target = kind === 'banner' ? { width: 800, height: 1280 } : { width: 512, height: 512 };
  const scale = Math.max(target.width / bitmap.width, target.height / bitmap.height);
  const drawWidth = bitmap.width * scale;
  const drawHeight = bitmap.height * scale;
  const dx = (target.width - drawWidth) / 2;
  const dy = (target.height - drawHeight) / 2;

  const canvas = document.createElement('canvas');
  canvas.width = target.width;
  canvas.height = target.height;
  const context = canvas.getContext('2d');
  context.fillStyle = '#111';
  context.fillRect(0, 0, target.width, target.height);
  context.drawImage(bitmap, dx, dy, drawWidth, drawHeight);
  bitmap.close();

  return canvas.toDataURL('image/jpeg', 0.86);
}
