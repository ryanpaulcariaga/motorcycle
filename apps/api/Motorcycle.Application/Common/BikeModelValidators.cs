namespace Motorcycle.Application.Common;

public static class BikeModelValidators
{
    public static string Validate(int brandId, int categoryId, string name)
    {
        if (brandId <= 0) throw new ArgumentException("Brand is required.", nameof(brandId));
        if (categoryId <= 0) throw new ArgumentException("Category is required.", nameof(categoryId));
        var normalized = name?.Trim() ?? string.Empty;
        if (normalized.Length is < 1 or > 255)
            throw new ArgumentException("Name must contain between 1 and 255 characters.", nameof(name));
        return normalized;
    }
}
