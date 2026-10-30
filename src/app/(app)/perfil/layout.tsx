import { ProfileTabs } from "./ProfileTabs";

/** Perfil con tres secciones (Datos · Hogares · Seguridad), cada una con su propia dirección. */
export default function ProfileLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-4xl">
      <h1>Perfil</h1>
      <ProfileTabs />
      {children}
    </div>
  );
}
