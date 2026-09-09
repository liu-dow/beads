import { redirect } from "next/navigation";
export const dynamic="force-dynamic";
export const metadata={title:"Sign in · Bead Atelier"};
export default function LoginPage(){redirect("/studio");}
