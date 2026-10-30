import { redirect } from "next/navigation";
import { getActor } from "@/server/session";

export default async function Home() {
  redirect((await getActor()) ? "/biblioteca" : "/entrar");
}
