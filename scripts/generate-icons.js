const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];
const iconsDir = path.join(__dirname, '../public/icons');

// icons 디렉토리가 없으면 생성
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// 원본 이미지 경로 (여러 가능한 경로 시도)
const possibleSourcePaths = [
  path.join(__dirname, '../public/icons/icon-source.png'),
  path.join(__dirname, '../public/icons/icon-source.jpg'),
  path.join(__dirname, '../public/icons/icon-source.jpeg'),
  path.join(__dirname, '../public/icons/icon-source.webp'),
  path.join(__dirname, '../public/icon-source.png'),
  path.join(__dirname, '../public/icon-source.jpg'),
  path.join(__dirname, '../public/icon-source.jpeg'),
  path.join(__dirname, '../public/icon-source.webp'),
];

let sourcePath = null;
for (const possiblePath of possibleSourcePaths) {
  if (fs.existsSync(possiblePath)) {
    sourcePath = possiblePath;
    break;
  }
}

if (!sourcePath) {
  console.error('❌ 원본 이미지를 찾을 수 없습니다.');
  console.log('\n📝 사용 방법:');
  console.log('1. 원본 이미지 파일을 다음 중 하나의 경로에 저장하세요:');
  possibleSourcePaths.slice(0, 4).forEach(p => {
    console.log(`   - ${path.relative(process.cwd(), p)}`);
  });
  console.log('\n2. 파일명은 icon-source.png, icon-source.jpg, icon-source.jpeg, 또는 icon-source.webp 중 하나여야 합니다.');
  console.log('\n3. 이미지 크기는 최소 512x512 픽셀 이상이 권장됩니다.');
  process.exit(1);
}

console.log(`✅ 원본 이미지 발견: ${path.relative(process.cwd(), sourcePath)}`);
console.log(`📦 아이콘 생성 중...\n`);

async function generateIcons() {
  try {
    // 원본 이미지 정보 확인
    const metadata = await sharp(sourcePath).metadata();
    console.log(`원본 이미지 정보: ${metadata.width}x${metadata.height}px, ${metadata.format}`);

    if (metadata.width < 512 || metadata.height < 512) {
      console.warn('⚠️  경고: 원본 이미지가 512x512보다 작습니다. 품질이 저하될 수 있습니다.');
    }

    // 각 크기별로 아이콘 생성
    const promises = sizes.map(async (size) => {
      const outputPath = path.join(iconsDir, `icon-${size}x${size}.png`);
      
      await sharp(sourcePath)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 0, g: 0, b: 0, alpha: 1 }, // 검은 배경
        })
        .png({
          quality: 100,
          compressionLevel: 9,
        })
        .toFile(outputPath);
      
      console.log(`✓ ${size}x${size} 생성 완료`);
      return outputPath;
    });

    await Promise.all(promises);
    
    console.log(`\n✅ 모든 아이콘 생성 완료!`);
    console.log(`📁 저장 위치: ${path.relative(process.cwd(), iconsDir)}`);
    console.log(`\n생성된 파일:`);
    sizes.forEach(size => {
      console.log(`   - icon-${size}x${size}.png`);
    });
    
  } catch (error) {
    console.error('❌ 아이콘 생성 중 오류 발생:', error);
    process.exit(1);
  }
}

generateIcons();
