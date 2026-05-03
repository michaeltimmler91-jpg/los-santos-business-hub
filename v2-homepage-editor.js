const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentBusiness = null;
let companyMemberships = [];

async function checkHomepageEditorAccess(){

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href = "v2-login.html";
    return;
  }

  currentUser = data.user;

  const { data: memberships, error } =
  await supabaseClient
  .from("business_members")
  .select(`
    *,
    businesses_v2(*)
  `)
  .eq("user_id", currentUser.id)
  .eq("member_role", "inhaber");

  if(error || !memberships || memberships.length === 0){
    alert("Du bist bei keiner Firma Inhaber.");
    window.location.href = "v2-dashboard.html";
    return;
  }

  companyMemberships =
  memberships
  .filter(item => item.businesses_v2);

  fillBusinessSelect();

  document
  .getElementById("businessSelect")
  .addEventListener("change", async function(){
    await loadBusiness(this.value);
  });

  await loadBusiness(companyMemberships[0].business_id);
}

function fillBusinessSelect(){

  const select =
  document.getElementById("businessSelect");

  select.innerHTML = "";

  companyMemberships.forEach(membership => {

    const option =
    document.createElement("option");

    option.value =
    membership.business_id;

    option.innerText =
    membership.businesses_v2.name;

    select.appendChild(option);
  });
}

async function loadBusiness(businessId){

  const membership =
  companyMemberships.find(item =>
    Number(item.business_id) === Number(businessId)
  );

  if(!membership){
    return;
  }

  currentBusiness =
  membership.businesses_v2;

  document
  .getElementById("homepageContent")
  .classList
  .remove("hidden");

  document.getElementById("businessTitle").innerText =
  currentBusiness.name;

  document.getElementById("businessSelect").value =
  currentBusiness.id;

  await loadHomepageBlocks();
}

async function loadHomepageBlocks(){

  const list =
  document.getElementById("homepageBlocksList");

  list.innerHTML =
  "<p class='muted'>Lade Bl&ouml;cke...</p>";

  const { data, error } =
  await supabaseClient
  .from("business_homepage_blocks")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("sort_order", {
    ascending:true
  });

  if(error){
    console.error(error);
    list.innerHTML =
    "<p class='muted'>Bl&ouml;cke konnten nicht geladen werden.</p>";
    return;
  }

  if(!data || data.length === 0){
    list.innerHTML =
    "<p class='muted'>Noch keine Homepage-Bl&ouml;cke vorhanden.</p>";
    return;
  }

  list.innerHTML = "";

  data.forEach(block => {

    const div =
    document.createElement("div");

    div.className =
    "homepage-block-item";

    div.innerHTML = `
      <div class="homepage-block-top">

        <div>
          <h3>
            ${escapeHtml(block.title)}
          </h3>

          <p>
            Typ:
            ${escapeHtml(formatBlockType(block.type))}
            |
            Reihenfolge:
            ${escapeHtml(block.sort_order)}
            |
            ${
  			block.visible
  			? "<span class='hub-badge hub-open'>Sichtbar</span>"
  			: "<span class='hub-badge hub-closed'>Versteckt</span>"
			}
          </p>
        </div>

        <div class="homepage-block-actions">

          <button
            onclick="editHomepageBlock(${block.id})"
          >
            Bearbeiten
          </button>

          <button
            class="danger-btn"
            onclick="deleteHomepageBlock(${block.id})"
          >
            L&ouml;schen
          </button>

        </div>

      </div>

      ${
        block.image_url
        ? `
          <img
            src="${escapeHtml(block.image_url)}"
            class="homepage-preview-image"
          >
        `
        : ""
      }

      <div class="homepage-preview-content">
        ${escapeHtml(block.content || "")}
      </div>
    `;

    list.appendChild(div);
  });
}

async function createHomepageBlock(){

  const type =
  document.getElementById("homepageBlockType").value;

  const title =
  document.getElementById("homepageBlockTitle")
  .value
  .trim();

  const image =
  document.getElementById("homepageBlockImage")
  .value
  .trim();

  const content =
  document.getElementById("homepageBlockContent")
  .value
  .trim();

  const order =
  Number(
    document.getElementById("homepageBlockOrder").value
  );

  const visible =
  document.getElementById("homepageBlockVisible")
  .checked;

  if(!title){
    alert("Titel fehlt");
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_homepage_blocks")
  .insert({
    business_id:currentBusiness.id,
    type:type,
    title:title,
    image_url:image,
    content:content,
    sort_order:order,
    visible:visible
  });

  if(error){
    alert("Block konnte nicht erstellt werden");
    console.error(error);
    return;
  }

  document.getElementById("homepageBlockTitle").value = "";
  document.getElementById("homepageBlockImage").value = "";
  document.getElementById("homepageBlockContent").value = "";
  document.getElementById("homepageBlockOrder").value = "1";
  document.getElementById("homepageBlockVisible").checked = true;

  await loadHomepageBlocks();

  alert("Block erstellt");
}

async function editHomepageBlock(blockId){

  const { data: block, error } =
  await supabaseClient
  .from("business_homepage_blocks")
  .select("*")
  .eq("id", blockId)
  .eq("business_id", currentBusiness.id)
  .single();

  if(error || !block){
    alert("Block nicht gefunden");
    return;
  }

  const newTitle =
  prompt("Titel:", block.title || "");

  if(newTitle === null){
    return;
  }

  const newContent =
  prompt("Inhalt:", block.content || "");

  if(newContent === null){
    return;
  }

  const newOrder =
  prompt("Reihenfolge:", block.sort_order || 1);

  if(newOrder === null){
    return;
  }

  const visible =
  confirm(
    "Soll der Block sichtbar sein?\n\nOK = sichtbar\nAbbrechen = versteckt"
  );

  const { error: updateError } =
  await supabaseClient
  .from("business_homepage_blocks")
  .update({
    title:newTitle.trim(),
    content:newContent.trim(),
    sort_order:Number(newOrder),
    visible:visible
  })
  .eq("id", blockId)
  .eq("business_id", currentBusiness.id);

  if(updateError){
    alert("Block konnte nicht gespeichert werden");
    console.error(updateError);
    return;
  }

  await loadHomepageBlocks();

  alert("Block gespeichert");
}

async function deleteHomepageBlock(blockId){

  if(!confirm("Block wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_homepage_blocks")
  .delete()
  .eq("id", blockId)
  .eq("business_id", currentBusiness.id);

  if(error){
    alert("Block konnte nicht gel&ouml;scht werden");
    console.error(error);
    return;
  }

  await loadHomepageBlocks();
}

function formatBlockType(type){

  switch(type){

    case "text":
      return "Textblock";

    case "image":
      return "Bild + Text";

    case "price":
      return "Preisliste";

    case "rules":
      return "Hausordnung / Regeln";

    case "event":
      return "Event / Ank&uuml;ndigung";

    default:
      return type || "Block";
  }
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