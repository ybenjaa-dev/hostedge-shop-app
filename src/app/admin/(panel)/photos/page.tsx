import { redirect } from "next/navigation";

// "Photos" is now the Media library — keep old links working.
export default function PhotosRedirect() {
  redirect("/admin/media?tab=products");
}
