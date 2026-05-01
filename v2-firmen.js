const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function loadBusinesses(){

  const { data: userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){
    window.location.href = "v2-login.html";
    return;
  }

  const { data, error } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .order("name");

  if(error){
    console.error(error);
    return;
  }

  const list =
  document.getElementById("businessList");

  list.innerHTML = "";

  if(!data || data.length === 0){
    list.innerHTML = "<p class='muted'>Noch keine Firmen vorhanden.</p>";
    return;
  }

  data.forEach(business => {

    const div =
    document.createElement("div");

    div.className =
    "business-item";

    div.innerHTML = `
      <div class="business-row">

        <div class="business-preview">
          ${
            business.image_url
            ? `<img src="${escapeHtml(business.image_url)}" alt="Firmenbild">`
            : `<div class="no-image">Kein Bild</div>`
          }
        </div>

        <div class="business-info">

          <strong>${escapeHtml(business.name)}</strong>

          <p>Kategorie: ${escapeHtml(business.category || "-")}</p>

          <p>PLZ: ${escapeHtml(business.plz || "-")}</p>

          <p>${escapeHtml(business.description || "Keine Beschreibung vorhanden.")}</p>

          ${
            business.applications_enabled && business.applications_open
            ? `
              <a class="pink-link-btn" href="v2-bewerbung.html?id=${business.id}">
                Jetzt bewerben
              </a>
            `
            : ""
          }

          ${
            business.applications_enabled && !business.applications_open
            ? `
              <p class="closed-application">
                Bewerbungen aktuell geschlossen
              </p>
            `
            : ""
          }

        </div>

      </div>
    `;

    list.appendChild(div);
  });
}

async function logoutUser(){

  await supabaseClient.auth.signOut();

  window.location.href =
  "v2-login.html";
}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}