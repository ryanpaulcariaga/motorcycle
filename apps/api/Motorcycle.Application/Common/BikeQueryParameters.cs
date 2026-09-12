namespace Motorcycle.Application.Common;

public class BikeQueryParameters
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? SortBy { get; set; } // "price", "year", "model_name"
    public bool SortDescending { get; set; } = false;

    public int? BrandId { get; set; }
    public int? CategoryId { get; set; }
    public int? YearMin { get; set; }
    public int? YearMax { get; set; }
    public decimal? PriceMin { get; set; }
    public decimal? PriceMax { get; set; }

    public List<SpecFilterRequest> SpecFilters { get; set; } = new();
}

public class SpecFilterRequest
{
    public string SpecCode { get; set; } = string.Empty;
    public string? Value { get; set; }       // exact / boolean
    public string? Min { get; set; }         // range
    public string? Max { get; set; }         // range
    public List<string>? Values { get; set; } // multiselect
}
