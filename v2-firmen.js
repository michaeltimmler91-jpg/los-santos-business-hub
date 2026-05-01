const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let businessesCache = [];

async function loadBusinesses(){

  const { data: userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){

    window.location.href =
    "v2-login.html";

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

  businessesCache =
  data || [];

  renderBusinesses(businessesCache);
}

function renderBusinesses(businesses){

  const list =
  document.getElementById("businessList");

  list.innerHTML =
  "";

  if(!businesses || businesses.length === 0){

    list.innerHTML =
    "<p class='muted'>Keine Unternehmen gefunden.</p>";

    return;
  }

  businesses.forEach(business => {

    const card =
    document.createElement("div");

    card.className =
    "business-modern-card";

    card.innerHTML = `
      <div class="business-image-wrap">

        ${
          business.image_url
          ? `
            <img
              src="${escapeHtml(business.image_url)}"
              alt="Firmenbild"
              class="business-modern-image"
            >
          `
          : `
            <div class="business-modern-noimage">
              Kein Bild
            </div>
          `
        }

        <div class="business-status-wrap">

          <span class="
            business-status
            ${business.open ? "status-open" : "status-closed"}
          ">
            ${business.open ? "Offen" : "Geschlossen"}
          </span>

          ${
            business.has_delivery
            ? `
              <span class="
                business-status
                ${business.delivery ? "status-delivery-on" : "status-delivery-off"}
              ">
                ${
                  business.delivery
                  ? "Lieferung aktiv"
                  : "Keine Lieferung"
                }
              </span>
            `
            : ""
          }

        </div>

      </div>

      <div class="business-modern-content">

        <h2>
          ${escapeHtml(business.name)}
        </h2>

        <p class="business-category">
          ${formatCategory(business.category)}
        </p>

        <p class="business-description">
          ${
            escapeHtml(
              business.description ||
              "Keine Beschreibung vorhanden."
            )
          }
        </p>

        <div class="business-info-list">

          ${
            business.plz
            ? `
              <div class="business-info-item">
                <strong>PLZ:</strong>
                <span>${escapeHtml(business.plz)}</span>
              </div>
            `
            : ""
          }

        </div>

        <div class="business-button-row">

          ${
            business.website
            ? `
              <a
                href="${escapeHtml(business.website)}"
                target="_blank"
                class="business-link-btn"
              >
                Website
              </a>
            `
            : ""
          }

          ${
            business.discord
            ? `
              <a
                href="${escapeHtml(business.discord)}"
                target="_blank"
                class="business-link-btn discord-btn"
              >
                Verteiler
              </a>
            `
            : ""
          }

          ${
            business.applications_enabled &&
            business.applications_open
            ? `
              <a
                href="v2-bewerbung.html?id=${business.id}"
                class="business-apply-btn"
              >
                Bewerben
              </a>
            `
            : ""
          }

        </div>

        ${
          business.applications_enabled &&
          !business.applications_open
          ? `
            <div class="applications-closed">
              Bewerbungen aktuell geschlossen
            </div>
          `
          : ""
        }

      </div>
    `;

    list.appendChild(card);
  });
}

function filterBusinesses(){

  const search =
  document.getElementById("searchInput")
  .value
  .trim()
  .toLowerCase();

  const category =
  document.getElementById("categoryFilter")
  .value;

  const filtered =
  businessesCache.filter(business => {

    const matchesSearch =
    !search ||
    business.name.toLowerCase().includes(search) ||
    (
      business.description &&
      business.description.toLowerCase().includes(search)
    );

    const matchesCategory =
    !category ||
    business.category === category;

    return matchesSearch && matchesCategory;
  });

  renderBusinesses(filtered);
}

function formatCategory(category){

  switch(category){

    case "food":
      return "Essen & Lieferung";

    case "service":
      return "Unternehmen & Service";

    case "government":
      return "Behörde";

    case "workshop":
      return "Werkstatt";

    default:
      return "Unternehmen";
  }
}

async function logoutUser(){

  await supabaseClient.auth.signOut();

  window.location.href =
  "v2-login.html";
}

function goDashboard(){

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