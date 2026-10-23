using ImageMagick;
using Motorcycle.Infrastructure.Images;

namespace Motorcycle.Api.Tests;

public sealed class MagickImageProcessorTests
{
    [Fact]
    public void CreateVariants_ResizesToLongEdgeWithoutUpscalingAndWritesWebp()
    {
        using var sourceImage = new MagickImage(MagickColors.Red, 2048, 1024);
        sourceImage.Format = MagickFormat.Png;
        sourceImage.SetAttribute("comment", "source metadata");
        using var source = new MemoryStream();
        sourceImage.Write(source);
        source.Position = 0;

        var result = new MagickImageProcessor().CreateVariants(source);

        Assert.Equal(2048, result.Width);
        Assert.Equal(1024, result.Height);
        Assert.Equal(["small", "medium", "large", "xl"], result.Variants.Keys.OrderBy(key => key switch
        {
            "small" => 0,
            "medium" => 1,
            "large" => 2,
            "xl" => 3,
            _ => 4,
        }));

        foreach (var (name, expectedLongEdge) in new[] { ("small", 320), ("medium", 640), ("large", 1280), ("xl", 2048) }) {
            using var variant = new MagickImage(result.Variants[name]);
            Assert.Equal((uint)expectedLongEdge, Math.Max(variant.Width, variant.Height));
            Assert.Equal(MagickFormat.WebP, variant.Format);
            Assert.NotEqual("source metadata", variant.GetAttribute("comment"));
        }
    }

    [Fact]
    public void CreateVariants_WritesLargerSizesAtSourceSizeWithoutUpscaling()
    {
        using var sourceImage = new MagickImage(MagickColors.Blue, 1600, 900);
        sourceImage.Format = MagickFormat.Png;
        using var source = new MemoryStream();
        sourceImage.Write(source);
        source.Position = 0;

        var result = new MagickImageProcessor().CreateVariants(source);

        Assert.Equal(4, result.Variants.Count);
        using var large = new MagickImage(result.Variants["large"]);
        using var xl = new MagickImage(result.Variants["xl"]);
        Assert.Equal(1280u, large.Width);
        Assert.Equal(1600u, xl.Width);
        Assert.Equal(900u, xl.Height);
    }
}
