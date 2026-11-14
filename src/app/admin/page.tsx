import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function AdminRootPage() {
  const cookieStore = await cookies();
  const session = cookieStore.get("uoda_admin_session");

  if (session?.value === "authenticated") {
    redirect("/admin/dashboard");
  } else {
    redirect("/admin/login");
  }
}
