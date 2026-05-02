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
Number(params.get("id"));

loadFirma();

async function loadFirma(){

  const container =
  document.getElementById("firmaHome");

  container.innerHTML =
  "<p class='muted'>Lade Firma...</p>";

  const { data: business, error } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .eq("id", businessId)
  .single();

  if(error || !business){

    container.innerHTML =
    "<p class='muted'>Firma nicht gefunden.</p>";

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
    <div class="firma-public-hero">

      <div class="firma-public-header">

        <img
          src="${escapeHtml(business.image_url || "./img/default-business.png")}"
          class="firma-public-logo"
          alt="Firmenlogo"
        >

        <div class="firma-public-title">

          <h1>
            ${escapeHtml(business.name)}
          </h1>

          <div class="firma-public-badges">

            <span class="${business.open ? "hub-badge hub-open" : "hub-badge hub-closed"}">
              ${business.open ? "Ge&ouml;ffnet" : "Geschlossen"}
            </span>

            ${
              business.has_delivery
              ? `
                <span class="${business.delivery ? "hub-badge hub-delivery-on" : "hub-badge hub-delivery-off"}">
                  ${business.delivery ? "Lieferung aktiv" : "Keine Lieferung"}
                </span>
              `
              : ""
            }

          </div>

        </div>

      </div>

      <div class="firma-public-info">

        <div>
          <strong>Standort</strong>
          <span>${escapeHtml(business.plz || "Nicht eingetragen")}</span>
        </div>

        ${
          business.website
          ? `
            <a href="${escapeHtml(business.website)}" target="_blank">
              Website
            </a>
          `
          : ""
        }

        ${
          business.discord
          ? `
            <a href="${escapeHtml(business.discord)}" target="_blank">
              Verteiler
            </a>
          `
          : ""
        }

        ${
          business.applications_enabled && business.applications_open
          ? `
            <a href="v2-bewerbung.html?id=${business.id}">
              Bewerben
            </a>
          `
          : ""
        }

        <a href="v2-firmen.html">
          Zur&uuml;ck zur &Uuml;bersicht
        </a>

      </div>

    </div>
  `;

  if(business.description){

    html += `
      <section class="firma-home-block firma-home-intro">
        <h2>&Uuml;ber uns</h2>
        <div class="firma-home-content">
          ${formatText(business.description)}
        </div>
      </section>
    `;
  }

  if(!blocks || blocks.length === 0){

    html += `
      <section class="firma-home-block">
        <h2>Noch keine Inhalte</h2>
        <div class="firma-home-content">
          Diese Firma hat noch keine Homepage-Inhalte erstellt.
        </div>
      </section>
    `;

  }else{

    for(const block of blocks){

      html += renderBlock(block);
    }
  }

  container.innerHTML =
  html;
}

function renderBlock(block){

  const typeClass =
  "firma-block-" + escapeHtml(block.type || "text");

  const label =
  getBlockLabel(block.type);

  return `
    <section class="firma-home-block ${typeClass}">

      <div class="firma-block-label">
        ${label}
      </div>

      <h2>
        ${escapeHtml(block.title)}
      </h2>

      ${
        block.image_url
        ? `
          <img
            src="${escapeHtml(block.image_url)}"
            class="firma-home-image"
            alt="Bild"
          >
        `
        : ""
      }

      <div class="firma-home-content">
        ${formatText(block.content)}
      </div>

    </section>
  `;
}

function getBlockLabel(type){

  switch(type){

    case "price":
      return "Preisliste";

    case "rules":
      return "Hausordnung";

    case "event":
      return "Ank&uuml;ndigung";

    case "image":
      return "Bild &amp; Info";

    default:
      return "Info";
  }
}

function formatText(text){

  if(!text){
    return "";
  }

  return escapeHtml(text)
  .replace(/\n/g, "<br>");
}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}