using ImageMagick;
using Motorcycle.Application.Interfaces;

namespace Motorcycle.Infrastructure.Images;

public sealed class MagickImageProcessor : IImageProcessor
{
    private static readonly (string Name, int LongEdge)[] VariantSizes =
    [
        ("small", 320),
        ("medium", 640),
        ("large", 1280),
        ("xl", 2048),
    ];

    public ProcessedImage CreateVariants(Stream source)
    {
        var initialPosition = source.Position;
        try {
            var info = new MagickImageInfo(source);
            if (info.Width == 0 || info.Height == 0 || info.Width > 20000 || info.Height > 20000 || (long)info.Width * info.Height > 100_000_000) {
                throw new InvalidDataException("Image dimensions are too large to process.");
            }

            source.Position = initialPosition;
            using var image = new MagickImage(source);
            image.AutoOrient();
            var width = checked((int)image.Width);
            var height = checked((int)image.Height);

            var variants = new Dictionary<string, byte[]>(StringComparer.Ordinal);
            var longEdge = Math.Max(width, height);
            foreach (var (name, size) in VariantSizes) {
                // Sizes larger than the source are written at the source's native size (never upscaled)
                // so every variant slot is always populated.
                using var resized = (MagickImage)image.Clone();
                if (size < longEdge) {
                    resized.Resize(new MagickGeometry((uint)size, (uint)size));
                }

                resized.Strip();
                resized.Format = MagickFormat.WebP;
                resized.Quality = 82;
                using var output = new MemoryStream();
                resized.Write(output);
                variants.Add(name, output.ToArray());
            }

            return new ProcessedImage(width, height, variants);
        } catch (MagickException exception) {
            throw new InvalidDataException("The image file could not be decoded.", exception);
        } finally {
            source.Position = initialPosition;
        }
    }
}
