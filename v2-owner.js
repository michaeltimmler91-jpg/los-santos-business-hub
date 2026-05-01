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

/* START */

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

/* FIRMEN DROPDOWN */

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

/* FIRMA LADEN */

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

  await loadQuestions();

  await loadApplications();
}

/* STATUS */

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

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    open:state
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Fehler");

    return;
  }

  currentBusiness.open =
  state;

  updateStatus();
}

async function setDelivery(state){

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    delivery:state
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Fehler");

    return;
  }

  currentBusiness.delivery =
  state;

  updateStatus();
}

/* FIRMENDATEN */

async function saveBusinessData(){

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

    return;
  }

  Object.assign(
    currentBusiness,
    updateData
  );

  alert("Gespeichert");
}

/* BEWERBUNGSEINSTELLUNGEN */

async function saveApplicationSettings(){

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

    return;
  }

  Object.assign(
    currentBusiness,
    updateData
  );

  alert("Gespeichert");
}

/* MITARBEITER */

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

    return;
  }

  document.getElementById("employeeLoginName").value =
  "";

  await loadEmployees();
}

/* FRAGEN */

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

    return;
  }

  document.getElementById("questionText").value =
  "";

  await loadQuestions();
}

async function deleteQuestion(questionId){

  await supabaseClient
  .from("business_application_questions")
  .delete()
  .eq("id", questionId);

  await loadQuestions();
}

/* BEWERBUNGEN */

async function loadApplications(){

  const list =
  document.getElementById("applicationList");

  list.innerHTML =
  "";

  const { data, error } =
  await supabaseClient
  .from("business_applications")
  .select(`
    *,
    profiles(*)
  `)
  .eq("business_id", currentBusiness.id)
  .order("created_at", {
    ascending:false
  });

  if(error){

    console.error(error);

    return;
  }

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Keine Bewerbungen vorhanden.</p>";

    return;
  }

  for(const application of data){

    const card =
    document.createElement("div");

    card.className =
    "application-card";

    card.innerHTML = `
      <div class="application-head">

        <div>

          <strong>
            ${
              escapeHtml(
                application.profiles?.display_name ||
                "Unbekannt"
              )
            }
          </strong>

          <p>
            ${
              escapeHtml(
                application.profiles?.login_name ||
                "-"
              )
            }
          </p>

        </div>

        <div class="
          application-status
          status-${application.status}
        ">
          ${formatStatus(application.status)}
        </div>

      </div>

      <div class="application-message">

        <strong>Nachricht</strong>

        <p>
          ${escapeHtml(application.message || "-")}
        </p>

      </div>

      <div class="application-actions">

        <select
          id="status-${application.id}"
        >

          <option value="offen">
            Offen
          </option>

          <option value="in_bearbeitung">
            In Bearbeitung
          </option>

          <option value="angenommen">
            Angenommen
          </option>

          <option value="abgelehnt">
            Abgelehnt
          </option>

        </select>

        <textarea
          id="reply-${application.id}"
          placeholder="Antwort schreiben..."
        ></textarea>

        <button
          onclick="saveApplicationStatus(${application.id})"
        >
          Speichern
        </button>

      </div>
    `;

    list.appendChild(card);

    document.getElementById(
      `status-${application.id}`
    ).value =
    application.status || "offen";

    await loadApplicationThread(application.id);
  }
}

async function loadApplicationThread(applicationId){

  const card =
  [...document.querySelectorAll(".application-card")]
  .find(item =>
    item.innerHTML.includes(`reply-${applicationId}`)
  );

  if(!card){
    return;
  }

  const threadBox =
  document.createElement("div");

  threadBox.className =
  "application-thread";

  threadBox.innerHTML =
  "<strong>Nachrichten</strong>";

  const { data, error } =
  await supabaseClient
  .from("business_application_messages")
  .select(`
    *,
    profiles(*)
  `)
  .eq("application_id", applicationId)
  .order("created_at");

  if(!error && data){

    data.forEach(message => {

      const div =
      document.createElement("div");

      div.className =
      "thread-message " +
      (
        message.user_id === currentUser.id
        ? "thread-own"
        : "thread-other"
      );

      div.innerHTML = `
        <div class="thread-meta">
          ${
            escapeHtml(
              message.profiles?.display_name ||
              "Unbekannt"
            )
          }
        </div>

        <div class="thread-text">
          ${escapeHtml(message.message)}
        </div>
      `;

      threadBox.appendChild(div);
    });
  }

  card.appendChild(threadBox);
}

async function saveApplicationStatus(applicationId){

  const status =
  document.getElementById(
    `status-${applicationId}`
  ).value;

  const reply =
  document.getElementById(
    `reply-${applicationId}`
  ).value
  .trim();

  await supabaseClient
  .from("business_applications")
  .update({
    status:status
  })
  .eq("id", applicationId);

  if(reply){

    await supabaseClient
    .from("business_application_messages")
    .insert({
      application_id:applicationId,
      user_id:currentUser.id,
      message:reply
    });
  }

  await loadApplications();
}

/* STATUS TEXT */

function formatStatus(status){

  switch(status){

    case "offen":
      return "Offen";

    case "in_bearbeitung":
      return "In Bearbeitung";

    case "angenommen":
      return "Angenommen";

    case "abgelehnt":
      return "Abgelehnt";

    default:
      return status;
  }
}

/* LOGOUT */

async function logoutUser(){

  await supabaseClient.auth.signOut();

  window.location.href =
  "v2-login.html";
}

/* ESCAPE */

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}