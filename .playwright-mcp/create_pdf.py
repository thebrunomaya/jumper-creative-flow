#!/usr/bin/env python3
"""
Create PDF from Koko Atulado presentation screenshots.
Converts 18 PNG screenshots into a single PDF document.
"""

import os
from pathlib import Path

try:
    import img2pdf
    IMG2PDF_AVAILABLE = True
except ImportError:
    IMG2PDF_AVAILABLE = False

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False

def create_pdf_with_img2pdf():
    """Create PDF using img2pdf library (best quality, smallest size)"""
    script_dir = Path(__file__).parent

    # Collect all slide images in order
    image_files = []
    for i in range(1, 19):
        filename = f"koko-atulado-slide-{i:02d}.png"
        filepath = script_dir / filename
        if filepath.exists():
            image_files.append(str(filepath))
            print(f"  ✓ Found: {filename}")
        else:
            print(f"  ✗ Missing: {filename}")

    if not image_files:
        print("❌ Error: No slide images found!")
        return False

    print(f"\n📊 Total slides found: {len(image_files)}/18")

    # Create PDF
    output_path = script_dir / "koko-atulado-final.pdf"
    print(f"\n🔧 Creating PDF...")

    with open(output_path, "wb") as f:
        f.write(img2pdf.convert(image_files))

    file_size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"\n✅ PDF created successfully!")
    print(f"   📄 File: {output_path}")
    print(f"   💾 Size: {file_size_mb:.2f} MB")
    print(f"   📐 Pages: {len(image_files)}")
    return True

def create_pdf_with_pillow():
    """Create PDF using Pillow library (fallback method)"""
    script_dir = Path(__file__).parent

    # Collect all slide images in order
    images = []
    for i in range(1, 19):
        filename = f"koko-atulado-slide-{i:02d}.png"
        filepath = script_dir / filename
        if filepath.exists():
            img = Image.open(filepath)
            # Convert to RGB if needed (PDFs don't support RGBA)
            if img.mode == 'RGBA':
                rgb_img = Image.new('RGB', img.size, (255, 255, 255))
                rgb_img.paste(img, mask=img.split()[3])
                images.append(rgb_img)
            else:
                images.append(img.convert('RGB'))
            print(f"  ✓ Loaded: {filename}")
        else:
            print(f"  ✗ Missing: {filename}")

    if not images:
        print("❌ Error: No slide images found!")
        return False

    print(f"\n📊 Total slides loaded: {len(images)}/18")

    # Create PDF
    output_path = script_dir / "koko-atulado-final.pdf"
    print(f"\n🔧 Creating PDF...")

    # First image is saved with save(), rest are appended
    images[0].save(
        output_path,
        save_all=True,
        append_images=images[1:],
        resolution=100.0,
        quality=95
    )

    file_size_mb = output_path.stat().st_size / 1024 / 1024
    print(f"\n✅ PDF created successfully!")
    print(f"   📄 File: {output_path}")
    print(f"   💾 Size: {file_size_mb:.2f} MB")
    print(f"   📐 Pages: {len(images)}")
    return True

def main():
    print("=" * 60)
    print("🎨 KOKO ATULADO - PDF GENERATOR")
    print("=" * 60)
    print("\n📸 Scanning for slide screenshots...")
    print()

    # Try img2pdf first (better quality and smaller file size)
    if IMG2PDF_AVAILABLE:
        print("🔧 Using img2pdf library (high quality, small size)\n")
        if create_pdf_with_img2pdf():
            print("\n" + "=" * 60)
            print("🎉 SUCCESS! Your PDF is ready.")
            print("=" * 60)
            return
    elif PIL_AVAILABLE:
        print("🔧 Using Pillow library (fallback method)\n")
        if create_pdf_with_pillow():
            print("\n" + "=" * 60)
            print("🎉 SUCCESS! Your PDF is ready.")
            print("=" * 60)
            return
    else:
        print("❌ Error: Neither img2pdf nor Pillow is installed")
        print("\nInstall one of these:")
        print("  pip3 install img2pdf")
        print("  pip3 install Pillow")
        return

    print("\n❌ PDF creation failed")

if __name__ == "__main__":
    main()
