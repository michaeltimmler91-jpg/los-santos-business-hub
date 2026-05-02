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
    "hub-card";

    card.innerHTML = `
     /* <a href="v2-firma.html?id=${business.id}" class="hub-image-link"> */
     <a href="v2-firma-home.html?id=${business.id}" class="hub-image-link">

        ${
          business.image_url
          ? `
            <img
              src="${escapeHtml(business.image_url)}"
              alt="Firmenbild"
              class="hub-card-image"
            >
          `
          : `
            <div class="hub-card-noimage">
              Kein Bild
            </div>
          `
        }

      </a>

      <div class="hub-card-content">

        /*<h2>
          ${escapeHtml(business.name)}
        </h2>*/
        <h2>
  		<a href="v2-firma-home.html?id=${business.id}">
   		 ${escapeHtml(business.name)}
  		</a>
		</h2>

        <div class="hub-badges">

          <span class="
            hub-badge
            ${business.open ? "hub-open" : "hub-closed"}
          ">
            ${business.open ? "Offen" : "Geschlossen"}
          </span>

          ${
            business.has_delivery
            ? `
              <span class="
                hub-badge
                ${business.delivery ? "hub-delivery-on" : "hub-delivery-off"}
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

        <div class="hub-buttons">

          ${
            business.website
            ? `
              <a
                href="${escapeHtml(business.website)}"
                target="_blank"
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
              <a href="v2-bewerbung.html?id=${business.id}">
                Bewerben
              </a>
            `
            : ""
          }

        </div>

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
    business.name.toLowerCase().includes(search);

    const matchesCategory =
    !category ||
    business.category === category;

    return matchesSearch && matchesCategory;
  });

  renderBusinesses(filtered);
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