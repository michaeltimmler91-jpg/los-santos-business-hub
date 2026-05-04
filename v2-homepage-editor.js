const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentBusiness = null;
let companyMemberships = [];
let editingBlockId = null;

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
  memberships.filter(item =>
    item.businesses_v2
  );

  fillBusinessSelect();

  document
  .getElementById("businessSelect")
  .addEventListener("change", async function(){
    resetHomepageForm();
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

    updateHomepageStats([]);

    return;
  }

  const blocks =
  data || [];

  updateHomepageStats(blocks);

  if(blocks.length === 0){

    list.innerHTML =
    "<div class='homepage-empty-box'>Noch keine Homepage-Bl&ouml;cke vorhanden.</div>";

    return;
  }

  list.innerHTML = "";

  blocks.forEach(block => {

    const div =
    document.createElement("div");

    div.className =
    "homepage-editor-block";

    div.innerHTML = `
      <div class="homepage-editor-block-head">

        <div>

          <span class="homepage-type-badge">
            ${escapeHtml(formatBlockType(block.type))}
          </span>

          <h3>
            ${escapeHtml(block.title)}
          </h3>

          <p>
            Reihenfolge:
            ${escapeHtml(block.sort_order || 0)}
            &middot;
            ${
              block.visible
              ? "<span class='hub-badge hub-open'>Sichtbar</span>"
              : "<span class='hub-badge hub-closed'>Versteckt</span>"
            }
          </p>

        </div>

        <div class="homepage-block-actions">

          <button onclick="editHomepageBlock(${block.id})">
            Bearbeiten
          </button>

          <button
            class="owner-gray-btn"
            onclick="toggleHomepageBlockVisible(${block.id}, ${block.visible ? "false" : "true"})"
          >
            ${block.visible ? "Verstecken" : "Anzeigen"}
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
            alt="Blockbild"
          >
        `
        : ""
      }

      <div class="homepage-preview-content">
        ${formatPreview(block.content || "")}
      </div>
    `;

    list.appendChild(div);
  });
}

function updateHomepageStats(blocks){

  const all =
  blocks.length;

  const visible =
  blocks.filter(block =>
    block.visible === true
  ).length;

  const hidden =
  blocks.filter(block =>
    block.visible !== true
  ).length;

  document.getElementById("blockCount").innerText =
  all;

  document.getElementById("visibleBlockCount").innerText =
  visible;

  document.getElementById("hiddenBlockCount").innerText =
  hidden;
}

async function saveHomepageBlock(){

  if(!currentBusiness){
    alert("Keine Firma ausgew&auml;hlt");
    return;
  }

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
  ) || 1;

  const visible =
  document.getElementById("homepageBlockVisible")
  .checked;

  if(!title){
    alert("Titel fehlt");
    return;
  }

  const blockData = {
    business_id:currentBusiness.id,
    type:type,
    title:title,
    image_url:image,
    content:content,
    sort_order:order,
    visible:visible
  };

  let error = null;

  if(editingBlockId){

    const result =
    await supabaseClient
    .from("business_homepage_blocks")
    .update(blockData)
    .eq("id", editingBlockId)
    .eq("business_id", currentBusiness.id);

    error =
    result.error;

  }else{

    const result =
    await supabaseClient
    .from("business_homepage_blocks")
    .insert(blockData);

    error =
    result.error;
  }

  if(error){
    alert("Block konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  resetHomepageForm();

  await loadHomepageBlocks();

  alert("Block gespeichert");
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
    console.error(error);
    return;
  }

  editingBlockId =
  block.id;

  document.getElementById("homepageBlockType").value =
  block.type || "text";

  document.getElementById("homepageBlockTitle").value =
  block.title || "";

  document.getElementById("homepageBlockImage").value =
  block.image_url || "";

  document.getElementById("homepageBlockContent").value =
  block.content || "";

  document.getElementById("homepageBlockOrder").value =
  block.sort_order || 1;

  document.getElementById("homepageBlockVisible").checked =
  block.visible === true;

  document.getElementById("editorModeLabel").innerText =
  "Bearbeiten";

  document.getElementById("editorTitle").innerText =
  "Block bearbeiten";

  document
  .querySelector(".homepage-editor-form")
  .scrollIntoView({
    behavior:"smooth",
    block:"start"
  });
}

async function toggleHomepageBlockVisible(blockId, newValue){

  const { error } =
  await supabaseClient
  .from("business_homepage_blocks")
  .update({
    visible:newValue
  })
  .eq("id", blockId)
  .eq("business_id", currentBusiness.id);

  if(error){
    alert("Sichtbarkeit konnte nicht ge&auml;ndert werden");
    console.error(error);
    return;
  }

  await loadHomepageBlocks();
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

  if(editingBlockId === blockId){
    resetHomepageForm();
  }

  await loadHomepageBlocks();
}

function resetHomepageForm(){

  editingBlockId = null;

  document.getElementById("homepageBlockType").value =
  "text";

  document.getElementById("homepageBlockTitle").value =
  "";

  document.getElementById("homepageBlockImage").value =
  "";

  document.getElementById("homepageBlockContent").value =
  "";

  document.getElementById("homepageBlockOrder").value =
  "1";

  document.getElementById("homepageBlockVisible").checked =
  true;

  document.getElementById("editorModeLabel").innerText =
  "Neuer Inhalt";

  document.getElementById("editorTitle").innerText =
  "Neuen Block erstellen";
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

function formatPreview(text){

  return escapeHtml(text)
  .replace(/\n/g, "<br>");
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