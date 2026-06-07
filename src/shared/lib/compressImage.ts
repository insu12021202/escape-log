import imageCompression from 'browser-image-compression'

/**
 * 사용자가 업로드한 이미지를 모바일 카메라 원본 크기에서 적정 사이즈로 압축.
 *
 * 기본 옵션: 최대 1.5MB · 긴 변 1920px · WebWorker 사용.
 * 이미 작은 파일은 거의 변화 없이 통과. 변환 실패 시 원본 그대로 반환.
 */
export async function compressImage(file: File): Promise<File> {
  // 비이미지나 SVG는 그대로
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }
  try {
    return await imageCompression(file, {
      maxSizeMB: 1.5,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      // 이미 작은 파일이면 그대로 둠 (재인코딩으로 오히려 커지는 경우 방지)
      initialQuality: 0.85,
    })
  } catch (e) {
    console.error('이미지 압축 실패, 원본 사용:', e)
    return file
  }
}
