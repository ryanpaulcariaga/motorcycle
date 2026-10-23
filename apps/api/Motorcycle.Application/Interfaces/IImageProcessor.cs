namespace Motorcycle.Application.Interfaces;

public sealed record ProcessedImage(int Width, int Height, IReadOnlyDictionary<string, byte[]> Variants);

public interface IImageProcessor
{
    ProcessedImage CreateVariants(Stream source);
}
