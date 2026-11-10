import { redirect } from "next/navigation";

/**
 * There is no standalone "beds" page per ward — the beds live on the ward
 * page. Without this file, reloading /dashboard/wards/<id>/beds was a 404.
 */
export default async function WardBedsIndex({
  params,
}: {
  params: Promise<{ wardId: string }>;
}) {
  const { wardId } = await params;
  redirect(`/dashboard/wards/${wardId}`);
}
