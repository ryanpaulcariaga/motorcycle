import BikeManagement from "@/components/bikes/BikeManagement";

type BikesPageProps = { params: Promise<{ id: string }> };

export default async function BikeModelBikesPage({ params }: BikesPageProps) {
  const { id } = await params;
  return <BikeManagement modelId={Number(id)} />;
}
