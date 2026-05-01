const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const ACCESS_CODES = {
  "BURGER2026": "Burger Shot",
  "HOOKIES2026": "Hookies",
  "PEARLS2026": "Pearls",
  "LSMD2026": "LSMD",
  "LSPD2026": "LSPD",
  "BLACKLINE2026": "Blackline Tuning",
  "BENNYS2026": "Bennys",
  "SMOKEYS2026": "Smokey's Weed Shop",
  "ADLER2026": "Adler & Partner",
  "BALKAN2026": "Balkan Recordzz",
  "TAXI2026": "Los Santos Taxi"
};

const OWNER_CODES = {
  "BURGER-OWNER-2026": "Burger Shot",
  "HOOKIES-OWNER-2026": "Hookies",
  "PEARLS-OWNER-2026": "Pearls",
  "LSMD-OWNER-2026": "LSMD",
  "LSPD-OWNER-2026": "LSPD",
  "BLACKLINE-OWNER-2026": "Blackline Tuning",
  "BENNYS-OWNER-2026": "Bennys",
  "SMOKEYS-OWNER-2026": "Smokey's Weed Shop",
  "ADLER-OWNER-2026": "Adler & Partner",
  "BALKAN-OWNER-2026": "Balkan Recordzz",
  "TAXI-OWNER-2026": "Los Santos Taxi"
};

const FOOD_BUSINESSES = [
  "Burger Shot",
  "Hookies",
  "Pearls"
];

let currentBusiness = null;
let ownerUnlocked = false;

async function login(){

  const code = document
    .getElementById("codeInput")
    .value
    .trim()
    .toUpperCase();

  const businessName = ACCESS_CODES[code];

  if(!businessName){
    alert("Falscher Zugangscode");
    return;
  }

  const { data, error } = await supabaseClient
    .from("businesses")
    .select("*")
    .eq("name", businessName)
    .single();

  if(error || !data){
    alert("Firma nicht gefunden");
    console.error(error);
    return;
  }

  currentBusiness = data;
  ownerUnlocked = false;

  document.getElementById("loginBox").classList.add("hidden");
  document.getElementById("adminBox").classList.remove("hidden");

  document.getElementById("ownerLoginBox").classList.remove("hidden");
  document.getElementById("ownerPanel").classList.add("hidden");
  document.getElementById("commentsPanel").classList.add("hidden");

  updateUI();
}

function updateUI(){

  document.getElementById("businessTitle").innerText =
    currentBusiness.name;

  document.getElementById("statusText").innerText =
    "Status: " + (currentBusiness.open ? "Offen" : "Geschlossen");

  document.getElementById("deliveryText").innerText =
    "Lieferung: " + (currentBusiness.delivery ? "Ja" : "Nein");

  document.getElementById("plzInput").value =
    currentBusiness.plz || "";

  document.getElementById("descriptionInput").value =
    currentBusiness.description || "";

  document.getElementById("websiteInput").value =
    currentBusiness.website || "";

  document.getElementById("discordInput").value =
    currentBusiness.discord || "";

  const deliveryButtons = document.getElementById("deliveryButtons");
  const deliveryText = document.getElementById("deliveryText");

  if(FOOD_BUSINESSES.includes(currentBusiness.name)){
    deliveryButtons.style.display = "grid";
    deliveryText.style.display = "block";
  }else{
    deliveryButtons.style.display = "none";
    deliveryText.style.display = "none";
  }
}

async function setOpen(value){

  currentBusiness.open = value;

  if(value === false){
    currentBusiness.delivery = false;
  }

  await saveStatus();
}

async function setDelivery(value){

  currentBusiness.delivery = value;

  await saveStatus();
}

async function saveStatus(){

  const { error } = await supabaseClient
    .from("businesses")
    .update({
      open: currentBusiness.open,
      delivery: currentBusiness.delivery
    })
    .eq("id", currentBusiness.id);

  if(error){
    alert("Fehler beim Speichern");
    console.error(error);
    return;
  }

  updateUI();
}

function unlockOwner(){

  const ownerCode = document
    .getElementById("ownerCodeInput")
    .value
    .trim()
    .toUpperCase();

  const ownerBusiness = OWNER_CODES[ownerCode];

  if(
    !ownerBusiness ||
    ownerBusiness.trim().toLowerCase() !== currentBusiness.name.trim().toLowerCase()
  ){
    alert("Falscher Inhaber-Code");
    return;
  }

  ownerUnlocked = true;

  document.getElementById("ownerLoginBox").classList.add("hidden");
  document.getElementById("ownerPanel").classList.remove("hidden");
  document.getElementById("commentsPanel").classList.remove("hidden");

  loadAdminComments();
}

async function saveOwnerData(){

  if(!ownerUnlocked){
    alert("Keine Berechtigung");
    return;
  }

  currentBusiness.plz =
    document.getElementById("plzInput").value.trim();

  currentBusiness.description =
    document.getElementById("descriptionInput").value.trim();

  currentBusiness.website =
    document.getElementById("websiteInput").value.trim();

  currentBusiness.discord =
    document.getElementById("discordInput").value.trim();

  const { error } = await supabaseClient
    .from("businesses")
    .update({
      plz: currentBusiness.plz,
      description: currentBusiness.description,
      website: currentBusiness.website,
      discord: currentBusiness.discord
    })
    .eq("id", currentBusiness.id);

  if(error){
    alert("Fehler beim Speichern der Firmendaten");
    console.error(error);
    return;
  }

  alert("Firmendaten gespeichert");
  updateUI();
}

async function loadAdminComments(){

  if(!currentBusiness) return;

  const { data, error } = await supabaseClient
    .from("comments")
    .select("*")
    .eq("business_id", currentBusiness.id)
    .order("created_at", { ascending:false });

  if(error){
    console.error(error);
    return;
  }

  const list = document.getElementById("adminCommentsList");

  list.innerHTML = "";

  if(data.length === 0){
    list.innerHTML = "<p>Noch keine Kommentare.</p>";
    return;
  }

  data.forEach(comment => {

    const div = document.createElement("div");
    div.className = "comment";

    div.innerHTML = `
      <strong>${escapeHtml(comment.author)}</strong>

      <div class="comment-rating">
        ${renderStars(Number(comment.rating || 0))}
      </div>

      <p>${escapeHtml(comment.message)}</p>

      ${
        comment.owner_reply
        ? `
          <div class="reply">
            <strong>Antwort:</strong>
            <p>${escapeHtml(comment.owner_reply)}</p>
          </div>
        `
        : ""
      }

      <textarea id="reply-${comment.id}" placeholder="Antwort schreiben">${comment.owner_reply || ""}</textarea>

      <button class="blue" onclick="saveReply(${comment.id})">
        Antwort speichern
      </button>
    `;

    list.appendChild(div);
  });
}

async function saveReply(commentId){

  if(!ownerUnlocked){
    alert("Keine Berechtigung");
    return;
  }

  const reply = document
    .getElementById("reply-" + commentId)
    .value
    .trim();

  const { error } = await supabaseClient
    .from("comments")
    .update({
      owner_reply: reply
    })
    .eq("id", commentId);

  if(error){
    alert("Antwort konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  alert("Antwort gespeichert");
  loadAdminComments();
}

function logout(){

  currentBusiness = null;
  ownerUnlocked = false;

  document.getElementById("codeInput").value = "";
  document.getElementById("ownerCodeInput").value = "";

  document.getElementById("adminBox").classList.add("hidden");
  document.getElementById("loginBox").classList.remove("hidden");

  document.getElementById("ownerPanel").classList.add("hidden");
  document.getElementById("commentsPanel").classList.add("hidden");
  document.getElementById("ownerLoginBox").classList.remove("hidden");
}

function renderStars(rating){

  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));

  return "&#9733;".repeat(safeRating);
}

function escapeHtml(text){

  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}