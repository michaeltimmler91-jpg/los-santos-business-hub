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
  .order("open", {
    ascending:false
  })
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
    "business-row-card";

    card.innerHTML = `
      <div class="business-row-left">

        ${
          business.image_url
          ? `
            <img
              src="${escapeHtml(business.image_url)}"
              class="business-row-image"
              alt="Firmenbild"
            >
          `
          : `
            <div class="business-row-noimage">
              Kein Bild
            </div>
          `
        }

      </div>

      <div class="business-row-middle">

        <div class="business-row-header">

          <h2>
            ${escapeHtml(business.name)}
          </h2>

          <div class="business-badge-wrap">

            <span class="
              business-badge
              ${business.open ? "badge-open" : "badge-closed"}
            ">
              ${business.open ? "Offen" : "Geschlossen"}
            </span>

            ${
              business.has_delivery
              ? `
                <span class="
                  business-badge
                  ${business.delivery ? "badge-delivery-on" : "badge-delivery-off"}
                ">
                  ${
                    business.delivery
                    ? "Lieferung"
                    : "Keine Lieferung"
                  }
                </span>
              `
              : ""
            }

          </div>

        </div>

        <div class="business-location">
          ??
          ${
            escapeHtml(
              business.plz ||
              "Kein Standort"
            )
          }
        </div>

        <div class="business-category-small">
          ${formatCategory(business.category)}
        </div>

        <div class="business-description-small">
          ${
            escapeHtml(
              business.description ||
              "Keine Beschreibung vorhanden."
            )
          }
        </div>

        <div class="business-buttons-small">

          ${
            business.website
            ? `
              <a
                href="${escapeHtml(business.website)}"
                target="_blank"
                class="small-btn"
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
                class="small-btn discord-small-btn"
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
                class="small-btn apply-small-btn"
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
            <div class="closed-text">
              Bewerbungen geschlossen
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