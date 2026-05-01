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

    window.location.href =
    "v2-login.html";

    return;
  }

  currentUser =
  data.user;

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

    window.location.href =
    "v2-dashboard.html";

    return;
  }

  ownerBusinesses =
  memberships
  .map(item => item.businesses_v2)
  .filter(Boolean);

  fillBusinessSelect();

  if(ownerBusinesses.length > 0){

    await loadBusiness(
      ownerBusinesses[0].id
    );
  }

  document
  .getElementById("businessSelect")
  .addEventListener(
    "change",
    async function(){

      await loadBusiness(this.value);
    }
  );
}

function fillBusinessSelect(){

  const select =
  document.getElementById("businessSelect");

  select.innerHTML =
  "";

  ownerBusinesses.forEach(business => {

    const option =
    document.createElement("option");

    option.value =
    business.id;

    option.innerText =
    business.name;

    select.appendChild(option);
  });
}

async function loadBusiness(businessId){

  const business =
  ownerBusinesses.find(item =>
    Number(item.id) === Number(businessId)
  );

  if(!business){
    return;
  }

  currentBusiness =
  business;

  document
  .getElementById("ownerContent")
  .classList
  .remove("hidden");

  document.getElementById("businessTitle").innerText =
  business.name;

  document.getElementById("businessSelect").value =
  business.id;

  updateStatus();

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

  toggleDeliveryArea();

  await loadEmployees();

  await loadQuestions();

  await loadApplications();
}

function updateStatus(){

  document.getElementById("openStatus").innerText =
  currentBusiness.open
  ? "Geöffnet"
  : "Geschlossen";

  document.getElementById("deliveryStatus").innerText =
  currentBusiness.delivery
  ? "Aktiv"
  : "Inaktiv";
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

  if(!currentBusiness){
    return;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    open:state
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Fehler");

    console.error(error);

    return;
  }

  currentBusiness.open =
  state;

  updateStatus();
}

async function setDelivery(state){

  if(!currentBusiness){
    return;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    delivery:state
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Fehler");

    console.error(error);

    return;
  }

  currentBusiness.delivery =
  state;

  updateStatus();
}

async function saveBusinessData(){

  if(!currentBusiness){
    return;
  }

  const updateData = {

    plz:
    document.getElementById("businessPlz").value.trim(),

    description:
    document.getElementById("businessDescription").value.trim(),

    website:
    document.getElementById("businessWebsite").value.trim(),

    discord:
    document.getElementById("businessDiscord").value.trim()
  };

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updateData)
  .eq("id", currentBusiness.id);

  if(error){

    alert("Fehler");

    console.error(error);

    return;
  }

  Object.assign(
    currentBusiness,
    updateData
  );

  alert("Gespeichert");
}

async function saveApplicationSettings(){

  if(!currentBusiness){
    return;
  }

  const updateData = {

    applications_enabled:
    document.getElementById("applicationsEnabled").checked,

    applications_open:
    document.getElementById("applicationsOpen").checked,

    application_note:
    document.getElementById("applicationNote").value.trim()
  };

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updateData)
  .eq("id", currentBusiness.id);

  if(error){

    alert("Fehler");

    console.error(error);

    return;
  }

  Object.assign(
    currentBusiness,
    updateData
  );

  alert("Gespeichert");
}

async function loadEmployees(){

  const list =
  document.getElementById("employeeList");

  list.innerHTML =
  "";

  const { data, error } =
  await supabaseClient
  .from("business_members")
  .select(`
    *,
    profiles(*)
  `)
  .eq("business_id", currentBusiness.id);

  if(error){

    console.error(error);

    return;
  }

  data.forEach(member => {

    const div =
    document.createElement("div");

    div.className =
    "member-pill";

    div.innerHTML = `
      ${escapeHtml(
        member.profiles?.display_name ||
        "Unbekannt"
      )}

      <span>
        ${escapeHtml(member.member_role)}
      </span>
    `;

    list.appendChild(div);
  });
}

async function addEmployee(){

  const loginName =
  document
  .getElementById("employeeLoginName")
  .value
  .trim();

  const role =
  document
  .getElementById("employeeRole")
  .value;

  if(!loginName){

    alert("Loginname fehlt");

    return;
  }

  const { data: profile } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("login_name", loginName)
  .maybeSingle();

  if(!profile){

    alert("User nicht gefunden");

    return;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .insert({
    business_id:currentBusiness.id,
    user_id:profile.user_id,
    member_role:role
  });

  if(error){

    alert("Fehler");

    console.error(error);

    return;
  }

  document.getElementById("employeeLoginName").value =
  "";

  await loadEmployees();
}

async function loadQuestions(){

  const list =
  document.getElementById("questionList");

  list.innerHTML =
  "";

  const { data, error } =
  await supabaseClient
  .from("business_application_questions")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("id");

  if(error){

    console.error(error);

    return;
  }

  data.forEach(question => {

    const div =
    document.createElement("div");

    div.className =
    "question-box";

    div.innerHTML = `
      <label>
        ${escapeHtml(question.question)}
      </label>

      <button
        class="danger-btn"
        onclick="deleteQuestion(${question.id})"
      >
        Löschen
      </button>
    `;

    list.appendChild(div);
  });
}

async function addQuestion(){

  const question =
  document
  .getElementById("questionText")
  .value
  .trim();

  if(!question){

    alert("Frage fehlt");

    return;
  }

  const { error } =
  await supabaseClient
  .from("business_application_questions")
  .insert({
    business_id:currentBusiness.id,
    question:question
  });

  if(error){

    alert("Fehler");

    console.error(error);

    return;
  }

  document.getElementById("questionText").value =
  "";

  await loadQuestions();
}

async function deleteQuestion(questionId){

  const { error } =
  await supabaseClient
  .from("business_application_questions")
  .delete()
  .eq("id", questionId);

  if(error){

    console.error(error);

    return;
  }

  await loadQuestions();
}

async function loadApplications(){

  const list =
  document.getElementById("applicationList");

  list.innerHTML =
  "<p class='muted'>Lade Bewerbungen...</p>";
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