const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let currentUser = null;
let currentBusiness = null;
let ownerBusinesses = [];

async function checkOwner(){

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
    alert("Keine Firmen gefunden");
    window.location.href = "v2-dashboard.html";
    return;
  }

  ownerBusinesses =
  memberships
  .map(item => item.businesses_v2)
  .filter(Boolean);

  fillBusinessSelect();

  document
  .getElementById("businessSelect")
  .addEventListener("change", async function(){
    await loadBusiness(this.value);
  });

  await loadBusiness(ownerBusinesses[0].id);
}

function fillBusinessSelect(){

  const select =
  document.getElementById("businessSelect");

  select.innerHTML = "";

  ownerBusinesses.forEach(business => {

    const option =
    document.createElement("option");

    option.value = business.id;
    option.innerText = business.name;

    select.appendChild(option);
  });
}

async function loadBusiness(businessId){

  const business =
  ownerBusinesses.find(item =>
    Number(item.id) === Number(businessId)
  );

  if(!business) return;

  currentBusiness = business;

  document.getElementById("ownerContent").classList.remove("hidden");

  document.getElementById("businessTitle").innerText =
  business.name;

  document.getElementById("businessSelect").value =
  business.id;

  document.getElementById("businessPlz").value =
  business.plz || "";

  document.getElementById("businessDescription").value =
  business.description || "";

  document.getElementById("businessWebsite").value =
  business.website || "";

  document.getElementById("businessDiscord").value =
  business.discord || "";

  document.getElementById("applicationsEnabled").checked =
  business.applications_enabled === true;

  document.getElementById("applicationsOpen").checked =
  business.applications_open === true;

  document.getElementById("applicationNote").value =
  business.application_note || "";

  updateStatus();
  toggleDeliveryArea();

  await loadEmployees();
  await loadAvailableUsers();
  await loadQuestions();
  await loadApplications();
}

function updateStatus(){

  document.getElementById("openStatus").innerText =
  currentBusiness.open ? "Geöffnet" : "Geschlossen";

  document.getElementById("deliveryStatus").innerText =
  currentBusiness.delivery ? "Aktiv" : "Inaktiv";
}

function toggleDeliveryArea(){

  const controls =
  document.getElementById("deliveryControls");

  const card =
  document.getElementById("deliveryStatusCard");

  if(currentBusiness.has_delivery){
    controls.classList.remove("hidden");
    card.classList.remove("hidden");
  }else{
    controls.classList.add("hidden");
    card.classList.add("hidden");
  }
}

async function setOpen(state){

  const updateData = {
    open: state
  };

  if(state === false){
    updateData.delivery = false;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updateData)
  .eq("id", currentBusiness.id);

  if(error){
    alert("Status konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  Object.assign(currentBusiness, updateData);

  updateStatus();
}

async function setDelivery(state){

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    delivery: state
  })
  .eq("id", currentBusiness.id);

  if(error){
    alert("Lieferung konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  currentBusiness.delivery = state;

  updateStatus();
}

async function saveBusinessData(){

  const updateData = {
    plz: document.getElementById("businessPlz").value.trim(),
    description: document.getElementById("businessDescription").value.trim(),
    website: document.getElementById("businessWebsite").value.trim(),
    discord: document.getElementById("businessDiscord").value.trim()
  };

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updateData)
  .eq("id", currentBusiness.id);

  if(error){
    alert("Firmendaten konnten nicht gespeichert werden");
    console.error(error);
    return;
  }

  Object.assign(currentBusiness, updateData);

  alert("Gespeichert");
}

async function saveApplicationSettings(){

  const updateData = {
    applications_enabled: document.getElementById("applicationsEnabled").checked,
    applications_open: document.getElementById("applicationsOpen").checked,
    application_note: document.getElementById("applicationNote").value.trim()
  };

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updateData)
  .eq("id", currentBusiness.id);

  if(error){
    alert("Bewerbungseinstellungen konnten nicht gespeichert werden");
    console.error(error);
    return;
  }

  Object.assign(currentBusiness, updateData);

  alert("Gespeichert");
}

async function loadEmployees(){

  const list =
  document.getElementById("employeeList");

  list.innerHTML = "";

  const { data, error } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", currentBusiness.id);

  if(error){
    console.error(error);
    return;
  }

  if(!data || data.length === 0){
    list.innerHTML = "<p class='muted'>Noch keine Mitarbeiter.</p>";
    return;
  }

  for(const member of data){

    const profile =
    await getProfileByUserId(member.user_id);

    const div =
    document.createElement("div");

    div.className = "business-item";

    div.innerHTML = `
      <strong>
        ${escapeHtml(profile ? profile.display_name : "Unbekannt")}
      </strong>

      <p>
        Login:
        ${escapeHtml(profile ? profile.login_name : "-")}
      </p>

      <p>
        Rolle:
        ${escapeHtml(member.member_role)}
      </p>

      <button
        class="danger-btn"
        onclick="removeEmployee(${member.id})"
      >
        Mitarbeiter entfernen
      </button>
    `;

    list.appendChild(div);
  }
}

async function removeEmployee(memberId){

  if(!confirm("Mitarbeiter wirklich aus dieser Firma entfernen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .delete()
  .eq("id", memberId);

  if(error){
    alert("Mitarbeiter konnte nicht entfernt werden");
    console.error(error);
    return;
  }

  alert("Mitarbeiter entfernt");

  await loadEmployees();
}

async function loadAvailableUsers(){

  const select =
  document.getElementById("employeeUserSelect");

  if(!select){
    return;
  }

  select.innerHTML = `
    <option value="">
      User auswählen
    </option>
  `;

  const { data, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("approved", true)
  .eq("blocked", false)
  .order("display_name");

  if(error){
    console.error(error);
    return;
  }

  (data || []).forEach(profile => {

    const option =
    document.createElement("option");

    option.value =
    profile.user_id;

    option.innerText =
    profile.display_name +
    " (" +
    profile.login_name +
    ")";

    select.appendChild(option);
  });
}

async function addEmployee(){

  const userId =
  document.getElementById("employeeUserSelect")
  .value;

  const role =
  document.getElementById("employeeRole")
  .value;

  if(!userId){
    alert("Bitte User auswählen");
    return;
  }

  const { data: existingMember } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .eq("user_id", userId)
  .maybeSingle();

  if(existingMember){

    const { error } =
    await supabaseClient
    .from("business_members")
    .update({
      member_role: role
    })
    .eq("id", existingMember.id);

    if(error){
      alert("Mitarbeiter konnte nicht aktualisiert werden");
      console.error(error);
      return;
    }

  }else{

    const { error } =
    await supabaseClient
    .from("business_members")
    .insert({
      business_id: currentBusiness.id,
      user_id: userId,
      member_role: role
    });

    if(error){
      alert("Mitarbeiter konnte nicht hinzugefügt werden");
      console.error(error);
      return;
    }
  }

  document.getElementById("employeeUserSelect").value = "";

  await loadEmployees();

  alert("Mitarbeiter gespeichert");
}

async function loadQuestions(){

  const list =
  document.getElementById("questionList");

  list.innerHTML = "";
}