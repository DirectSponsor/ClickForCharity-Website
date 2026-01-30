# Hero Background Image

Place your hero background image here as `hero-bg.jpg`.

## Requirements

- **Format**: JPG (or convert to WebP for better compression)
- **Recommended size**: 1920x1080px or similar landscape ratio
- **File size target**: <200KB (optimize with tools like ImageOptim, Squoosh, or jpegoptim)
- **Content positioning**: 
  - Important content should be on the RIGHT side (visible on desktop)
  - TOP portion should also work well (visible on mobile)
  - LEFT side will be covered by white gradient on desktop
  - BOTTOM may be cropped on mobile

## Optimization Commands

```bash
# Using jpegoptim (if installed)
jpegoptim --size=200k hero-bg.jpg

# Using ImageMagick (if installed)
convert hero-bg.jpg -quality 85 -resize 1920x1080^ -gravity center -extent 1920x1080 hero-bg.jpg
```

## Fallback

If no image is provided, the site will show a white background (graceful degradation).
