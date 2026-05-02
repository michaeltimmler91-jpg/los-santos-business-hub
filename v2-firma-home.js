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

let currentUser = null;

loadFirma();

async function loadFirma(){

  const { data: authData } =
  await supabaseClient.auth.getUser();

  currentUser =
  authData?.user || null;

  const container =
  document.getElementById("firmaHome");

  container.innerHTML =
  "<p class='muted'>Lade Firma...</p>";

  const {
    data: business,
    error
  } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .eq("id", businessId)
  .single();

  if(error || !business){

    container.innerHTML =
    "<p class='muted'>Firma nicht gefunden.</p>";

    console.error(error);

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
          src="${
            escapeHtml(
              business.image_url ||
              "./img/default-business.png"
            )
          }"
          class="firma-public-logo"
          alt="Firmenlogo"
        >

        <div class="firma-public-title">

          <h1>
            ${escapeHtml(business.name)}
          </h1>

          <div class="firma-public-badges">

            <span class="${
              business.open
              ? "hub-badge hub-open"
              : "hub-badge hub-closed"
            }">

              ${
                business.open
                ? "Geöffnet"
                : "Geschlossen"
              }

            </span>

            ${
              business.has_delivery
              ? `
                <span class="${
                  business.delivery
                  ? "hub-badge hub-delivery-on"
                  : "hub-badge hub-delivery-off"
                }">

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

      </div>

      <div class="firma-public-info">

        <div>

          <strong>
            Standort
          </strong>

          <span>
            ${
              escapeHtml(
                business.plz ||
                "Nicht eingetragen"
              )
            }
          </span>

        </div>

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

        <a href="v2-firmen.html">
          Zurück zur Übersicht
        </a>

      </div>

    </div>

  `;

  if(business.description){

    html += `

      <section class="firma-home-block firma-home-intro">

        <h2>
          Über uns
        </h2>

        <div class="firma-home-content">
          ${formatText(business.description)}
        </div>

      </section>

    `;
  }

  if(!blocks || blocks.length === 0){

    html += `

      <section class="firma-home-block">

        <h2>
          Noch keine Inhalte
        </h2>

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

  html += await renderReviews(business.id);

  container.innerHTML =
  html;
}

function renderBlock(block){

  const typeClass =
  "firma-block-" +
  escapeHtml(block.type || "text");

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
      return "Ankündigung";

    case "image":
      return "Bild & Info";

    default:
      return "Info";
  }
}

async function renderReviews(businessId){

  const {
    data: reviews,
    error
  } =
  await supabaseClient
  .from("business_reviews")
  .select("*")
  .eq("business_id", businessId)
  .order("created_at", {
    ascending:false
  });

  if(error){

    console.error(error);

    return "";
  }

  let average = 0;

  if(reviews.length > 0){

    average =
    reviews.reduce((sum, item) =>
      sum + item.rating, 0
    ) / reviews.length;
  }

  let html = `

    <section class="firma-home-block">

      <div class="review-header">

        <div>

          <div class="review-average">
            ? ${average.toFixed(1)} / 5
          </div>

          <div class="review-count">
            ${reviews.length} Bewertungen
          </div>

        </div>

      </div>

  `;

  if(currentUser){

    html += `

      <div class="review-create-box">

        <h3>
          Bewertung schreiben
        </h3>

        <select id="reviewRating">

          <option value="5">
            ?????
          </option>

          <option value="4">
            ?????
          </option>

          <option value="3">
            ?????
          </option>

          <option value="2">
            ?????
          </option>

          <option value="1">
            ?????
          </option>

        </select>

        <textarea
          id="reviewComment"
          placeholder="Deine Bewertung..."
        ></textarea>

        <button onclick="saveReview()">
          Bewertung speichern
        </button>

      </div>

    `;
  }

  if(reviews.length === 0){

    html += `

      <p class="muted">
        Noch keine Bewertungen vorhanden.
      </p>

    `;

  }else{

    for(const review of reviews){

      const profile =
      await loadProfile(review.user_id);

      html += `

        <div class="review-item">

          <div class="review-stars">
            ${renderStars(review.rating)}
          </div>

          <div class="review-author">

            ${
              escapeHtml(
                profile
                ? profile.display_name
                : "Unbekannt"
              )
            }

          </div>

          <div class="review-text">
            ${formatText(review.comment || "")}
          </div>

          ${
            review.company_reply
            ? `
              <div class="company-reply">

                <strong>
                  Antwort vom Unternehmen
                </strong>

                <div>
                  ${formatText(review.company_reply)}
                </div>

              </div>
            `
            : ""
          }

        </div>

      `;
    }
  }

  html += `
    </section>
  `;

  return html;
}

async function saveReview(){

  if(!currentUser){

    alert("Bitte einloggen");

    return;
  }

  const rating =
  Number(
    document.getElementById("reviewRating").value
  );

  const comment =
  document.getElementById("reviewComment")
  .value
  .trim();

  const { data: existing } =
  await supabaseClient
  .from("business_reviews")
  .select("*")
  .eq("business_id", businessId)
  .eq("user_id", currentUser.id)
  .maybeSingle();

  if(existing){

    const { error } =
    await supabaseClient
    .from("business_reviews")
    .update({
      rating:rating,
      comment:comment,
      updated_at:new Date().toISOString()
    })
    .eq("id", existing.id);

    if(error){

      alert(
        "Bewertung konnte nicht aktualisiert werden"
      );

      console.error(error);

      return;
    }

  }else{

    const { error } =
    await supabaseClient
    .from("business_reviews")
    .insert({
      business_id:businessId,
      user_id:currentUser.id,
      rating:rating,
      comment:comment
    });

    if(error){

      alert(
        "Bewertung konnte nicht gespeichert werden"
      );

      console.error(error);

      return;
    }
  }

  location.reload();
}

async function loadProfile(userId){

  const { data } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  return data;
}

function renderStars(rating){

  let stars = "";

  for(let i = 1; i <= 5; i++){

    if(i <= rating){
      stars += "?";
    }else{
      stars += "?";
    }
  }

  return stars;
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