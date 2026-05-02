const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const params =
new URLSearchParams(window.location.search);

const businessId =
params.get("id");

loadFirma();

async function loadFirma(){

  const container =
  document.getElementById("firmaHome");

  container.innerHTML =
  "Lade Firma...";

  const { data: business } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .eq("id", businessId)
  .single();

  if(!business){

    container.innerHTML =
    "Firma nicht gefunden";

    return;
  }

  const { data: blocks } =
  await supabaseClient
  .from("business_homepage_blocks")
  .select("*")
  .eq("business_id", business.id)
  .eq("visible", true)
  .order("sort_order", {
    ascending:true
  });

  let html = `

    <div class="firma-home-header">

      <div class="firma-home-top">

        <img
          src="${
            business.image_url ||
            "./img/default-business.png"
          }"
          class="firma-home-logo"
        >

        <div>

          <h1>
            ${escapeHtml(business.name)}
          </h1>

          <div class="firma-home-meta">

            <span>
              ?? Standort:
              ${
                business.plz ||
                "Nicht eingetragen"
              }
            </span>

            <span>
              ?? Status:
              ${
                business.status ||
                "Unbekannt"
              }
            </span>

            <span>
              ?? Lieferung:
              ${
                business.delivery_enabled
                ? "Ja"
                : "Nein"
              }
            </span>

          </div>

        </div>

      </div>

    </div>

  `;

  for(const block of blocks){

    html += `

      <div class="firma-home-block">

        <h2>
          ${escapeHtml(block.title)}
        </h2>

        ${
          block.image_url
          ? `
            <img
              src="${block.image_url}"
              class="firma-home-image"
            >
          `
          : ""
        }

        <div class="firma-home-content">
          ${formatText(block.content)}
        </div>

      </div>

    `;
  }

  container.innerHTML = html;
}

function formatText(text){

  if(!text){
    return "";
  }

  return escapeHtml(text)
  .replace(/\n/g, "<br>");
}

function escapeHtml(text){

  if(!text){
    return "";
  }

  return text
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}