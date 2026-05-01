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
  .select("*")
  .eq("user_id", currentUser.id)
  .order("created_at", {
    ascending:false
  });

  if(error){

    console.error(error);

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

  for(const application of data){

    const { data: business } =
    await supabaseClient
    .from("businesses_v2")
    .select("*")
    .eq("id", application.business_id)
    .maybeSingle();

    const created =
    application.created_at
    ? new Date(application.created_at).toLocaleString("de-DE")
    : "-";

    const div =
    document.createElement("div");

    div.className =
    "application-card";

    div.innerHTML = `
      <div class="application-head">

        <div>

          <strong>
            ${escapeHtml(business ? business.name : "Unbekannte Firma")}
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
  }
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
