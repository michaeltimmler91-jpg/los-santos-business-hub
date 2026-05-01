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
let profilesCache = [];
let currentEditBusiness = null;
let currentEditMembers = [];

async function checkSuperadmin(){

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  const { data: profile, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", data.user.id)
  .single();

  if(error || !profile){

    alert("Profil nicht gefunden");

    window.location.href =
    "v2-login.html";

    return;
  }

  if(profile.global_role !== "superadmin"){

    alert("Kein Zugriff");

    window.location.href =
    "v2-dashboard.html";

    return;
  }

  await loadProfiles();

  await loadBusinesses();
}

async function loadProfiles(){

  const { data, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .order("display_name");

  if(error){

    console.error(error);

    return;
  }

  profilesCache =
  data || [];
}

async function createBusiness(){

  const name =
  document.getElementById("businessName")
  .value
  .trim();

  const category =
  document.getElementById("businessCategory")
  .value;

  const description =
  document.getElementById("businessDescription")
  .value
  .trim();

  const plz =
  document.getElementById("businessPlz")
  .value
  .trim();

  const imageFile =
  document.getElementById("businessImage")
  .files[0];

  if(!name){

    alert("Bitte Firmenname eingeben");

    return;
  }

  let imageUrl = "";

  if(imageFile){

    imageUrl =
    await uploadBusinessImage(imageFile, name);
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .insert({
    name:name,
    category:category,
    description:description,
    plz:plz,
    image_url:imageUrl,
    open:false,
    delivery:false,
    applications_enabled:false,
    applications_open:false
  });

  if(error){

    alert("Firma konnte nicht erstellt werden");

    console.error(error);

    return;
  }

  alert("Firma erstellt");

  document.getElementById("businessName").value = "";
  document.getElementById("businessDescription").value = "";
  document.getElementById("businessPlz").value = "";
  document.getElementById("businessImage").value = "";

  loadBusinesses();
}

async function uploadBusinessImage(file, businessName){

  const fileExt =
  file.name.split(".").pop();

  const cleanName =
  businessName
  .toLowerCase()
  .replaceAll(" ", "-")
  .replaceAll("&", "und")
  .replaceAll("'", "")
  .replaceAll(".", "")
  .replaceAll("/", "-");

  const fileName =
  cleanName + "-" + Date.now() + "." + fileExt;

  const { error } =
  await supabaseClient.storage
  .from("business-images")
  .upload(fileName, file, {
    cacheControl:"3600",
    upsert:false
  });

  if(error){

    alert("Bild konnte nicht hochgeladen werden");

    console.error(error);

    return "";
  }

  const { data } =
  supabaseClient.storage
  .from("business-images")
  .getPublicUrl(fileName);

  return data.publicUrl;
}

async function loadBusinesses(){

  const { data, error } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .order("name");

  if(error){

    console.error(error);

    return;
  }

  businessesCache =
  data || [];

  const list =
  document.getElementById("businessList");

  list.innerHTML = "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p>Noch keine Firmen vorhanden.</p>";

    return;
  }

  for(const business of data){

    const members =
    await loadBusinessMembers(business.id);

    const owner =
    members.find(member =>
      member.member_role === "inhaber"
    );

    const div =
    document.createElement("div");

    div.className =
    "business-item";

    div.innerHTML = `
      <div class="business-row">

        <div class="business-preview">
          ${
            business.image_url
            ? `<img src="${escapeHtml(business.image_url)}" alt="Firmenbild">`
            : `<div class="no-image">Kein Bild</div>`
          }
        </div>

        <div class="business-info">

          <strong>
            ${escapeHtml(business.name)}
          </strong>

          <p>
            Kategorie:
            ${escapeHtml(business.category)}
          </p>

          <p>
            PLZ:
            ${escapeHtml(business.plz || "-")}
          </p>

          <p>
            Inhaber:
            ${owner ? escapeHtml(owner.profiles?.display_name || "Unbekannt") : "Kein Inhaber"}
          </p>

          <p>
            Mitarbeiter:
          </p>

          <div class="member-list">
            ${
              members.length > 0
              ? members.map(member => `
                  <div class="member-pill">
                    ${escapeHtml(member.profiles?.display_name || "Unbekannt")}
                    <span>
                      ${escapeHtml(member.member_role)}
                    </span>
                  </div>
                `).join("")
              : "<span class='muted'>Noch keine Mitarbeiter</span>"
            }
          </div>

          <button onclick="openEditModal(${business.id})">
            Firma bearbeiten
          </button>

        </div>

      </div>
    `;

    list.appendChild(div);
  }
}

async function loadBusinessMembers(businessId){

  const { data, error } =
  await supabaseClient
  .from("business_members")
  .select(`
    id,
    member_role,
    user_id,
    profiles (
      display_name,
      login_name
    )
  `)
  .eq("business_id", businessId);

  if(error){

    console.error(error);

    return [];
  }

  return data || [];
}

async function openEditModal(businessId){

  const business =
  businessesCache.find(item =>
    Number(item.id) === Number(businessId)
  );

  if(!business){

    alert("Firma nicht gefunden");

    return;
  }

  currentEditBusiness =
  business;

  currentEditMembers =
  await loadBusinessMembers(business.id);

  const currentOwner =
  currentEditMembers.find(member =>
    member.member_role === "inhaber"
  );

  document.getElementById("editBusinessId").value =
  business.id;

  document.getElementById("editBusinessName").value =
  business.name || "";

  document.getElementById("editBusinessCategory").value =
  business.category || "service";

  document.getElementById("editBusinessDescription").value =
  business.description || "";

  document.getElementById("editBusinessPlz").value =
  business.plz || "";

  fillEditOwnerSelect(
    currentOwner ? currentOwner.user_id : ""
  );

  document
  .getElementById("editModal")
  .classList
  .remove("hidden");
}

function fillEditOwnerSelect(selectedUserId){

  const select =
  document.getElementById("editOwnerSelect");

  select.innerHTML =
  "<option value=''>Kein Inhaber</option>";

  profilesCache.forEach(profile => {

    const option =
    document.createElement("option");

    option.value =
    profile.user_id;

    option.innerText =
    profile.display_name + " (" + profile.login_name + ")";

    if(profile.user_id === selectedUserId){

      option.selected = true;
    }

    select.appendChild(option);
  });
}

function closeEditModal(){

  currentEditBusiness =
  null;

  currentEditMembers =
  [];

  document.getElementById("editBusinessImage").value = "";

  document
  .getElementById("editModal")
  .classList
  .add("hidden");
}

async function saveBusinessEdit(){

  if(!currentEditBusiness){

    alert("Keine Firma ausgew\u00e4hlt");

    return;
  }

  const id =
  Number(document.getElementById("editBusinessId").value);

  const name =
  document.getElementById("editBusinessName")
  .value
  .trim();

  const category =
  document.getElementById("editBusinessCategory")
  .value;

  const description =
  document.getElementById("editBusinessDescription")
  .value
  .trim();

  const plz =
  document.getElementById("editBusinessPlz")
  .value
  .trim();

  const ownerUserId =
  document.getElementById("editOwnerSelect")
  .value;

  const imageFile =
  document.getElementById("editBusinessImage")
  .files[0];

  if(!name){

    alert("Bitte Firmenname eingeben");

    return;
  }

  let imageUrl =
  currentEditBusiness.image_url || "";

  if(imageFile){

    imageUrl =
    await uploadBusinessImage(imageFile, name);
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    name:name,
    category:category,
    description:description,
    plz:plz,
    image_url:imageUrl
  })
  .eq("id", id);

  if(error){

    alert("Firma konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  const ownerChanged =
  await changeOwner(id, ownerUserId);

  if(!ownerChanged){
    return;
  }

  alert("Firma gespeichert");

  closeEditModal();

  loadBusinesses();
}

async function changeOwner(businessId, ownerUserId){

  const currentOwner =
  currentEditMembers.find(member =>
    member.member_role === "inhaber"
  );

  if(
    currentOwner &&
    currentOwner.user_id === ownerUserId
  ){
    return true;
  }

  const { error: deleteError } =
  await supabaseClient
  .from("business_members")
  .delete()
  .eq("business_id", businessId)
  .eq("member_role", "inhaber");

  if(deleteError){

    alert("Alter Inhaber konnte nicht entfernt werden");

    console.error(deleteError);

    return false;
  }

  if(!ownerUserId){
    return true;
  }

  const { data: existingMember } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", businessId)
  .eq("user_id", ownerUserId)
  .maybeSingle();

  if(existingMember){

    const { error: updateError } =
    await supabaseClient
    .from("business_members")
    .update({
      member_role:"inhaber"
    })
    .eq("id", existingMember.id);

    if(updateError){

      alert("Inhaber konnte nicht ge\u00e4ndert werden");

      console.error(updateError);

      return false;
    }

    return true;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .insert({
    business_id:businessId,
    user_id:ownerUserId,
    member_role:"inhaber"
  });

  if(error){

    alert("Inhaber konnte nicht gespeichert werden");

    console.error(error);

    return false;
  }

  return true;
}

async function deleteBusiness(){

  if(!currentEditBusiness){

    alert("Keine Firma ausgew\u00e4hlt");

    return;
  }

  if(!confirm("Firma wirklich l\u00f6schen?")){

    return;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .delete()
  .eq("id", currentEditBusiness.id);

  if(error){

    alert("Firma konnte nicht gel\u00f6scht werden");

    console.error(error);

    return;
  }

  alert("Firma gel\u00f6scht");

  closeEditModal();

  loadBusinesses();
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