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

async function loadBusiness(){

  const { data: userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  const { data: business, error } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .eq("id", businessId)
  .single();

  if(error || !business){

    alert("Firma nicht gefunden");

    window.location.href =
    "v2-firmen.html";

    return;
  }

  renderBusiness(business);
}

function renderBusiness(business){

  document.getElementById("businessTitle").innerText =
  business.name;

  document.getElementById("businessImage").src =
  business.image_url || "";

  document.getElementById("businessLocation").innerHTML =
  "?? " +
  escapeHtml(
    business.plz ||
    "Kein Standort"
  );

  document.getElementById("businessDescription").innerText =
  business.description ||
  "Keine Beschreibung vorhanden.";

  const openBadge =
  document.getElementById("openBadge");

  openBadge.innerText =
  business.open
  ? "Offen"
  : "Geschlossen";

  openBadge.className =
  business.open
  ? "hub-badge hub-open"
  : "hub-badge hub-closed";

  const deliveryBadge =
  document.getElementById("deliveryBadge");

  if(business.has_delivery){

    deliveryBadge.style.display =
    "inline-flex";

    deliveryBadge.innerText =
    business.delivery
    ? "Lieferung aktiv"
    : "Keine Lieferung";

    deliveryBadge.className =
    business.delivery
    ? "hub-badge hub-delivery-on"
    : "hub-badge hub-delivery-off";

  }else{

    deliveryBadge.style.display =
    "none";
  }

  const buttons =
  document.getElementById("businessButtons");

  buttons.innerHTML =
  "";

  if(business.website){

    buttons.innerHTML += `
      <a
        href="${escapeHtml(business.website)}"
        target="_blank"
      >
        Website
      </a>
    `;
  }

  if(business.discord){

    buttons.innerHTML += `
      <a
        href="${escapeHtml(business.discord)}"
        target="_blank"
      >
        Verteiler
      </a>
    `;
  }

  if(
    business.applications_enabled &&
    business.applications_open
  ){

    buttons.innerHTML += `
      <a href="v2-bewerbung.html?id=${business.id}">
        Bewerben
      </a>
    `;
  }
}

function goBack(){

  window.location.href =
  "v2-firmen.html";
}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}