import { redirect } from "next/navigation";
import { isAuthed, adminConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ e?: string }>;
}) {
  if (await isAuthed()) redirect("/");
  const { e } = await searchParams;
  const configured = adminConfigured();

  return (
    <div className="wrap">
      <div className="card login-box">
        <div className="brand" style={{ marginBottom: 20 }}>
          <span className="dot">♪</span> Kore Music
        </div>
        {!configured ? (
          <p className="muted">
            Le mot de passe administrateur n'est pas encore défini. Ajoutez la variable
            d'environnement <code>ADMIN_PASSWORD</code> sur Vercel, puis rechargez.
          </p>
        ) : (
          <form action="/api/login" method="post">
            <label className="field">
              <span className="lbl">Mot de passe</span>
              <input type="password" name="password" autoFocus required />
            </label>
            {e && (
              <p style={{ color: "var(--red)", fontSize: 13, marginTop: -6, marginBottom: 12 }}>
                Mot de passe incorrect.
              </p>
            )}
            <button className="btn primary" style={{ width: "100%", justifyContent: "center" }}>
              Entrer
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
