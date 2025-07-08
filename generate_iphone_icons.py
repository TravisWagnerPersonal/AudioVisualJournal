#!/usr/bin/env python3
"""
Generate iPhone-optimized icons for the Audio-Photo Journal PWA
Creates all required iOS icon sizes from a source icon file
"""

import os
from PIL import Image, ImageDraw, ImageFont
import sys

def create_icon_with_gradient(size, output_path):
    """Create a beautiful gradient icon for the journal app"""
    img = Image.new('RGB', (size, size), '#667eea')
    draw = ImageDraw.Draw(img)
    
    # Create gradient effect
    for i in range(size):
        ratio = i / size
        r = int(102 + (118 - 102) * ratio)  # 667eea to 764ba2 gradient
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        color = (r, g, b)
        draw.line([(0, i), (size, i)], fill=color)
    
    # Add rounded corners for iOS style
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = size // 5  # 20% corner radius for iOS style
    mask_draw.rounded_rectangle([(0, 0), (size, size)], corner_radius, fill=255)
    
    # Apply rounded corners
    rounded_img = Image.new('RGB', (size, size), (255, 255, 255, 0))
    rounded_img.paste(img, mask=mask)
    
    # Add journal icon symbol
    symbol_size = size // 3
    symbol_offset = (size - symbol_size) // 2
    
    # Create a simple journal/book icon
    draw = ImageDraw.Draw(rounded_img)
    
    # Book spine
    spine_width = symbol_size // 8
    draw.rectangle([
        symbol_offset, 
        symbol_offset + symbol_size // 6,
        symbol_offset + spine_width,
        symbol_offset + symbol_size - symbol_size // 6
    ], fill='white')
    
    # Book pages
    page_offset = symbol_offset + spine_width + 2
    draw.rectangle([
        page_offset,
        symbol_offset + symbol_size // 8,
        symbol_offset + symbol_size - 2,
        symbol_offset + symbol_size - symbol_size // 8
    ], fill='white')
    
    # Lines on the page (if icon is large enough)
    if size >= 72:
        line_spacing = symbol_size // 12
        line_start_y = symbol_offset + symbol_size // 3
        for i in range(3):
            y = line_start_y + i * line_spacing
            draw.line([
                page_offset + symbol_size // 8,
                y,
                symbol_offset + symbol_size - symbol_size // 6,
                y
            ], fill='#667eea', width=max(1, size // 128))
    
    # Add microphone symbol if large enough
    if size >= 120:
        mic_x = symbol_offset + symbol_size - symbol_size // 4
        mic_y = symbol_offset + symbol_size // 8
        mic_size = symbol_size // 6
        
        # Microphone circle
        draw.ellipse([
            mic_x - mic_size // 2,
            mic_y,
            mic_x + mic_size // 2, 
            mic_y + mic_size
        ], fill='#ff6b6b')
        
        # Microphone stand
        draw.line([
            mic_x,
            mic_y + mic_size,
            mic_x,
            mic_y + mic_size * 1.5
        ], fill='#ff6b6b', width=max(1, size // 200))
    
    # Save the icon
    rounded_img.save(output_path, 'PNG', quality=100, optimize=True)
    print(f"✅ Created {size}x{size} icon: {output_path}")

def generate_all_icons():
    """Generate all required iPhone icon sizes"""
    
    # Create icons directory if it doesn't exist
    icons_dir = 'icons'
    if not os.path.exists(icons_dir):
        os.makedirs(icons_dir)
        print(f"📁 Created {icons_dir} directory")
    
    # iPhone icon sizes (following Apple's guidelines)
    icon_sizes = [
        (57, 'icon-57.png'),      # iPhone (iOS 6.1 and earlier)
        (60, 'icon-60.png'),      # iPhone (iOS 7+) @1x
        (72, 'icon-72.png'),      # iPad (iOS 6.1 and earlier)
        (76, 'icon-76.png'),      # iPad (iOS 7+) @1x
        (114, 'icon-114.png'),    # iPhone (iOS 6.1 and earlier) @2x
        (120, 'icon-120.png'),    # iPhone (iOS 7+) @2x
        (144, 'icon-144.png'),    # iPad (iOS 6.1 and earlier) @2x
        (152, 'icon-152.png'),    # iPad (iOS 7+) @2x
        (180, 'icon-180.png'),    # iPhone (iOS 8+) @3x
        (192, 'icon-192.png'),    # Standard PWA icon
        (512, 'icon-512.png'),    # Large PWA icon
    ]
    
    print("🎨 Generating iPhone-optimized icons...")
    print("=" * 50)
    
    for size, filename in icon_sizes:
        output_path = os.path.join(icons_dir, filename)
        create_icon_with_gradient(size, output_path)
    
    # Create maskable icon (for Android/PWA)
    print("\n🎭 Creating maskable icon...")
    create_maskable_icon()
    
    # Create favicon
    print("\n🔗 Creating favicon...")
    create_favicon()
    
    print("\n" + "=" * 50)
    print("✅ All iPhone icons generated successfully!")
    print(f"📁 Icons saved in: {os.path.abspath(icons_dir)}")
    
    # Show file sizes
    print("\n📊 Icon file sizes:")
    for size, filename in icon_sizes:
        file_path = os.path.join(icons_dir, filename)
        if os.path.exists(file_path):
            file_size = os.path.getsize(file_path)
            print(f"   {filename}: {file_size:,} bytes ({file_size/1024:.1f} KB)")

def create_maskable_icon():
    """Create maskable icon for PWA (Android)"""
    size = 512
    # Maskable icons need extra padding for the safe zone
    safe_zone = size // 5  # 20% safe zone
    
    img = Image.new('RGB', (size, size), '#667eea')
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for i in range(size):
        ratio = i / size
        r = int(102 + (118 - 102) * ratio)
        g = int(126 + (75 - 126) * ratio)
        b = int(234 + (162 - 234) * ratio)
        color = (r, g, b)
        draw.line([(0, i), (size, i)], fill=color)
    
    # Add icon content within safe zone
    icon_size = size - (safe_zone * 2)
    icon_offset = safe_zone
    
    # Create journal symbol
    symbol_size = icon_size // 2
    symbol_x = icon_offset + (icon_size - symbol_size) // 2
    symbol_y = icon_offset + (icon_size - symbol_size) // 2
    
    # Background circle for better visibility
    circle_radius = symbol_size // 2 + 20
    draw.ellipse([
        symbol_x + symbol_size // 2 - circle_radius,
        symbol_y + symbol_size // 2 - circle_radius,
        symbol_x + symbol_size // 2 + circle_radius,
        symbol_y + symbol_size // 2 + circle_radius
    ], fill='rgba(255, 255, 255, 0.2)')
    
    # Journal book
    book_width = symbol_size // 2
    book_height = symbol_size * 3 // 4
    book_x = symbol_x + (symbol_size - book_width) // 2
    book_y = symbol_y + (symbol_size - book_height) // 2
    
    # Book cover
    draw.rectangle([book_x, book_y, book_x + book_width, book_y + book_height], fill='white')
    
    # Book spine
    spine_width = book_width // 10
    draw.rectangle([book_x, book_y, book_x + spine_width, book_y + book_height], fill='#f0f0f0')
    
    # Lines on book
    line_spacing = book_height // 8
    for i in range(5):
        y = book_y + line_spacing * (i + 2)
        draw.line([
            book_x + book_width // 6,
            y,
            book_x + book_width - book_width // 6,
            y
        ], fill='#667eea', width=3)
    
    output_path = os.path.join('icons', 'maskable-icon.png')
    img.save(output_path, 'PNG', quality=100, optimize=True)
    print(f"✅ Created maskable icon: {output_path}")

def create_favicon():
    """Create favicon.ico with multiple sizes"""
    # Create 16x16 and 32x32 versions
    sizes = [16, 32]
    images = []
    
    for size in sizes:
        img = Image.new('RGB', (size, size), '#667eea')
        draw = ImageDraw.Draw(img)
        
        # Simple gradient
        for i in range(size):
            ratio = i / size
            r = int(102 + (118 - 102) * ratio)
            g = int(126 + (75 - 126) * ratio) 
            b = int(234 + (162 - 234) * ratio)
            color = (r, g, b)
            draw.line([(0, i), (size, i)], fill=color)
        
        # Simple white dot for recognition at small sizes
        center = size // 2
        radius = max(2, size // 6)
        draw.ellipse([
            center - radius,
            center - radius,
            center + radius,
            center + radius
        ], fill='white')
        
        images.append(img)
    
    # Save as ICO file
    favicon_path = 'favicon.ico'
    images[0].save(favicon_path, format='ICO', sizes=[(16, 16), (32, 32)])
    print(f"✅ Created favicon: {favicon_path}")
    
    # Also save 32x32 PNG for manifest
    favicon_png_path = os.path.join('icons', 'favicon-32x32.png')
    images[1].save(favicon_png_path, 'PNG')
    print(f"✅ Created favicon PNG: {favicon_png_path}")

def main():
    """Main function"""
    print("🍎 iPhone Icon Generator for Audio-Photo Journal")
    print("=" * 50)
    
    try:
        generate_all_icons()
        print("\n🎉 Icon generation completed successfully!")
        print("\n📱 Your app is now optimized for iPhone with all required icon sizes.")
        print("\n💡 Next steps:")
        print("   1. Test the app on iPhone Safari")
        print("   2. Add to Home Screen to test PWA functionality")
        print("   3. Verify all icons appear correctly")
        
    except ImportError:
        print("❌ PIL (Pillow) library not found.")
        print("📦 Install it with: pip install Pillow")
        sys.exit(1)
    except Exception as e:
        print(f"❌ Error generating icons: {e}")
        sys.exit(1)

if __name__ == "__main__":
    main() 