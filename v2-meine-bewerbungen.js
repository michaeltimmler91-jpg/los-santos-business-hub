const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;

async function loadMyApplications(){

  const { data: userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  currentUser =
  userData.user;

  const { data, error } =
  await supabaseClient
  .from("applications")
  .select(`
    id,
    business_id,
    user_id,
    status,
    message,
    owner_reply,
    created_at,
    businesses_v2 (
      name
    )
  `)
  .eq("user_id", currentUser.id)
  .order("created_at", {
    ascending:false
  });

  if(error){

    console.error(error);

    document.getElementById("applicationList").innerHTML =
    "<p class='muted'>Bewerbungen konnten nicht geladen werden.</p>";

    return;
  }

  const list =
  document.getElementById("applicationList");

  list.innerHTML =
  "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Du hast noch keine Bewerbungen geschrieben.</p>";

    return;
  }

  data.forEach(application => {

    const created =
    application.created_at
    ? new Date(application.created_at).toLocaleString("de-DE")
    : "-";

    const businessName =
    application.businesses_v2 && application.businesses_v2.name
    ? application.businesses_v2.name
    : "Unbekannte Firma";

    const div =
    document.createElement("div");

    div.className =
    "application-card";

    div.innerHTML = `
      <div class="application-head">

        <div>

          <strong>
            ${escapeHtml(businessName)}
          </strong>

          <p>
            Gesendet:
            ${escapeHtml(created)}
          </p>

        </div>

        <span class="application-status status-${escapeHtml(application.status)}">
          ${escapeHtml(application.status)}
        </span>

      </div>

      <div class="application-message">

        <strong>
          Deine Nachricht:
        </strong>

        <p>
          ${escapeHtml(application.message || "-")}
        </p>

      </div>

      <div class="application-message">

        <strong>
          Antwort der Firma:
        </strong>

        <p>
          ${escapeHtml(application.owner_reply || "Noch keine Antwort")}
        </p>

      </div>
    `;

    list.appendChild(div);
  });
}

function goBack(){

  window.location.href =
  "v2-dashboard.html";
}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}