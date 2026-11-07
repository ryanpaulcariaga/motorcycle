export function bikeModelLabel(name: string, bikeCount: number | undefined): string {
  if (bikeCount === undefined) {
    return `${name} (bike count unavailable)`;
  }

  return `${name} (${bikeCount})`;
}
