const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sourcePath = path.join(__dirname, '../public/icons/icon-source.png');
const appDir = path.join(__dirname, '../app');

if (!fs.existsSync(sourcePath)) {
  console.error('❌ 원본 이미지를 찾을 수 없습니다: public/icons/icon-source.png');
  process.exit(1);
}

async function generateFavicon() {
  try {
    // app 디렉토리가 없으면 생성
    if (!fs.existsSync(appDir)) {
      fs.mkdirSync(appDir, { recursive: true });
    }

    // Next.js App Router는 icon.png를 자동으로 인식합니다
    const iconPath = path.join(appDir, 'icon.png');
    
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png({
        quality: 100,
        compressionLevel: 9,
      })
      .toFile(iconPath);
    
    console.log('✅ Favicon 생성 완료: app/icon.png');
    
    // 추가로 favicon.ico도 생성 (선택사항)
    const faviconPath = path.join(appDir, 'favicon.ico');
    await sharp(sourcePath)
      .resize(32, 32, {
        fit: 'contain',
        background: { r: 0, g: 0, b: 0, alpha: 1 },
      })
      .png()
      .toFile(faviconPath);
    
    console.log('✅ Favicon.ico 생성 완료: app/favicon.ico');
    
  } catch (error) {
    console.error('❌ Favicon 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateFavicon();
