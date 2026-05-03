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
let reviewsCache = [];

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

  await loadReviews();

  renderBusinesses(businessesCache);
  updateLiveStats();
}

async function loadReviews(){

  const { data, error } =
  await supabaseClient
  .from("business_reviews")
  .select("*");

  if(error){

    console.error(error);

    reviewsCache = [];

    return;
  }

  reviewsCache =
  data || [];
}

function getBusinessRating(businessId){

  const reviews =
  reviewsCache.filter(review =>
    Number(review.business_id) === Number(businessId)
  );

  if(reviews.length === 0){

    return {
      count:0,
      average:0,
      stars:"&#9734;&#9734;&#9734;&#9734;&#9734;",
      text:"Noch keine Bewertung"
    };
  }

  const average =
  reviews.reduce((sum, review) =>
    sum + Number(review.rating || 0), 0
  ) / reviews.length;

  return {
    count:reviews.length,
    average:average,
    stars:renderStars(Math.round(average)),
    text:average.toFixed(1)
  };
}

function renderStars(rating){

  let stars = "";

  for(let i = 1; i <= 5; i++){

    stars += i <= rating
	? "&#9733;"
	: "&#9734;";
  }

  return stars;
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

    const rating =
    getBusinessRating(business.id);

    const card =
    document.createElement("div");

    card.className =
    "hub-card";

    card.innerHTML = `

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

        <div class="hub-rating-badge ${rating.count === 0 ? "hub-rating-empty" : ""}">
          ${
            rating.count === 0
            ? `
              <span>
                Noch keine Bewertung
              </span>
            `
            : `
              <span class="hub-rating-stars">
                <span>${rating.stars}</span>
              </span>

              <strong>
                ${rating.text}
              </strong>
            `
          }
        </div>

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

      </a>

      <div class="hub-card-content">

        <h2>
          <a href="v2-firma-home.html?id=${business.id}">
            ${escapeHtml(business.name)}
          </a>
        </h2>

        <div class="hub-location-box">
  <span>Standort</span>
  <strong>${escapeHtml(business.plz || "Nicht eingetragen")}</strong>
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

function updateLiveStats(){

  const openBusinesses =
  businessesCache.filter(item =>
    item.open === true
  ).length;

  const deliveryBusinesses =
  businessesCache.filter(item =>
    item.delivery === true
  ).length;

  const reviewCount =
  reviewsCache.length;

  document.getElementById("openCount").innerText =
  openBusinesses;

  document.getElementById("deliveryCount").innerText =
  deliveryBusinesses;

  document.getElementById("reviewCount").innerText =
  reviewCount;
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