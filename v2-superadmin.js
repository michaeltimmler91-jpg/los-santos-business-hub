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

async function checkSuperadmin(){

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){
    window.location.href = "v2-login.html";
    return;
  }

  const { data: profile } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", data.user.id)
  .single();

  if(!profile || profile.global_role !== "superadmin"){
    window.location.href = "v2-dashboard.html";
    return;
  }

  await loadProfiles();
  await loadBusinesses();
}

async function loadProfiles(){

  const { data } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .order("display_name");

  profilesCache = data || [];
}

function getProfileByUserId(userId){

  return profilesCache.find(profile =>
    profile.user_id === userId
  );
}

async function createBusiness(){

  const name =
  document.getElementById("businessName").value.trim();

  const category =
  document.getElementById("businessCategory").value;

  const description =
  document.getElementById("businessDescription").value.trim();

  const plz =
  document.getElementById("businessPlz").value.trim();

  const hasDelivery =
  document.getElementById("businessHasDelivery").checked;

  const imageFile =
  document.getElementById("businessImage").files[0];

  if(!name){
    alert("Bitte Firmenname eingeben");
    return;
  }

  let imageUrl = "";

  if(imageFile){
    imageUrl = await uploadBusinessImage(imageFile, name);
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
    has_delivery:hasDelivery,
    open:false,
    delivery:false
  });

  if(error){
    alert("Firma konnte nicht erstellt werden");
    console.error(error);
    return;
  }

  alert("Firma erstellt");

  loadBusinesses();
}

async function uploadBusinessImage(file, businessName){

  const fileExt =
  file.name.split(".").pop();

  const fileName =
  businessName.toLowerCase().replaceAll(" ","-")
  + "-"
  + Date.now()
  + "."
  + fileExt;

  const { error } =
  await supabaseClient.storage
  .from("business-images")
  .upload(fileName, file);

  if(error){
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

  const { data } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .order("name");

  businessesCache = data || [];

  const list =
  document.getElementById("businessList");

  list.innerHTML = "";

  for(const business of businessesCache){

    const members =
    await loadBusinessMembers(business.id);

    const owner =
    members.find(member =>
      member.member_role === "inhaber"
    );

    const ownerProfile =
    owner
    ? getProfileByUserId(owner.user_id)
    : null;

    const div =
    document.createElement("div");

    div.className =
    "business-item";

    div.innerHTML = `
      <div class="business-row">

        <div class="business-preview">
          ${
            business.image_url
            ? `<img src="${escapeHtml(business.image_url)}">`
            : `<div class="no-image">Kein Bild</div>`
          }
        </div>

        <div class="business-info">

          <strong>
            ${escapeHtml(business.name)}
          </strong>

          <p>
            Lieferung erlaubt:
            ${business.has_delivery ? "Ja" : "Nein"}
          </p>

          <p>
            Inhaber:
            ${
              ownerProfile
              ? escapeHtml(ownerProfile.display_name)
              : "Kein Inhaber"
            }
          </p>

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

  const { data } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", businessId);

  return data || [];
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

async function openEditModal(businessId){

  const business =
  businessesCache.find(item =>
    Number(item.id) === Number(businessId)
  );

  currentEditBusiness =
  business;

  const members =
  await loadBusinessMembers(business.id);

  const currentOwner =
  members.find(member =>
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

  document.getElementById("editBusinessHasDelivery").checked =
  business.has_delivery === true;

  fillEditOwnerSelect(
    currentOwner
    ? currentOwner.user_id
    : ""
  );

  document
  .getElementById("editModal")
  .classList
  .remove("hidden");
}

function closeEditModal(){

  currentEditBusiness = null;

  document
  .getElementById("editModal")
  .classList
  .add("hidden");
}

async function saveBusinessEdit(){

  const id =
  Number(document.getElementById("editBusinessId").value);

  const name =
  document.getElementById("editBusinessName").value.trim();

  const category =
  document.getElementById("editBusinessCategory").value;

  const description =
  document.getElementById("editBusinessDescription").value.trim();

  const plz =
  document.getElementById("editBusinessPlz").value.trim();

  const hasDelivery =
  document.getElementById("editBusinessHasDelivery").checked;

  const ownerUserId =
  document.getElementById("editOwnerSelect").value;

  let imageUrl =
  currentEditBusiness.image_url || "";

  const imageFile =
  document.getElementById("editBusinessImage").files[0];

  if(imageFile){
    imageUrl = await uploadBusinessImage(imageFile, name);
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    name:name,
    category:category,
    description:description,
    plz:plz,
    has_delivery:hasDelivery,
    image_url:imageUrl
  })
  .eq("id", id);

  if(error){
    console.error(error);
    alert("Fehler beim Speichern");
    return;
  }

  await supabaseClient
  .from("business_members")
  .delete()
  .eq("business_id", id)
  .eq("member_role", "inhaber");

  if(ownerUserId){

    await supabaseClient
    .from("business_members")
    .insert({
      business_id:id,
      user_id:ownerUserId,
      member_role:"inhaber"
    });
  }

  alert("Firma gespeichert");

  closeEditModal();

  loadBusinesses();
}

async function deleteBusiness(){

  if(!confirm("Firma wirklich löschen?")){
    return;
  }

  await supabaseClient
  .from("businesses_v2")
  .delete()
  .eq("id", currentEditBusiness.id);

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
  .replaceAll(">", "&gt;");
}