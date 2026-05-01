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
let currentProfile = null;
let currentBusiness = null;
let currentMembership = null;

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

  const { data: profile, error: profileError } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", currentUser.id)
  .single();

  if(profileError || !profile){

    alert("Profil nicht gefunden");

    window.location.href =
    "v2-login.html";

    return;
  }

  currentProfile =
  profile;

  const { data: membership, error: memberError } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("user_id", currentUser.id)
  .eq("member_role", "inhaber")
  .maybeSingle();

  if(memberError || !membership){

    alert("Du bist kein Firmeninhaber");

    window.location.href =
    "v2-dashboard.html";

    return;
  }

  currentMembership =
  membership;

  const { data: business, error: businessError } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .eq("id", membership.business_id)
  .single();

  if(businessError || !business){

    alert("Firma nicht gefunden");

    window.location.href =
    "v2-dashboard.html";

    return;
  }

  currentBusiness =
  business;

  updateUI();

  loadEmployees();

  loadQuestions();

  loadApplications();
}

function updateUI(){

  document.getElementById("businessTitle").innerText =
  currentBusiness.name;

  document.getElementById("openStatus").innerText =
  currentBusiness.open
  ? "Offen"
  : "Geschlossen";

  document.getElementById("deliveryStatus").innerText =
  currentBusiness.delivery
  ? "Aktiv"
  : "Inaktiv";

  document.getElementById("businessPlz").value =
  currentBusiness.plz || "";

  document.getElementById("businessDescription").value =
  currentBusiness.description || "";

  document.getElementById("businessWebsite").value =
  currentBusiness.website || "";

  document.getElementById("businessDiscord").value =
  currentBusiness.discord || "";

  document.getElementById("applicationsEnabled").checked =
  currentBusiness.applications_enabled === true;

  document.getElementById("applicationsOpen").checked =
  currentBusiness.applications_open === true;

  document.getElementById("applicationNote").value =
  currentBusiness.application_note || "";

  const deliveryControls =
  document.getElementById("deliveryControls");

  const deliveryStatusCard =
  document.getElementById("deliveryStatusCard");

  if(currentBusiness.has_delivery === true){

    deliveryControls.style.display =
    "block";

    deliveryStatusCard.style.display =
    "block";

  }else{

    deliveryControls.style.display =
    "none";

    deliveryStatusCard.style.display =
    "none";
  }
}

async function setOpen(value){

  const updates = {
    open:value
  };

  if(value === false){
    updates.delivery =
    false;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updates)
  .eq("id", currentBusiness.id);

  if(error){

    alert("Status konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  currentBusiness.open =
  value;

  if(value === false){
    currentBusiness.delivery =
    false;
  }

  updateUI();
}

async function setDelivery(value){

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    delivery:value
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Lieferung konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  currentBusiness.delivery =
  value;

  updateUI();
}

async function saveBusinessData(){

  const plz =
  document.getElementById("businessPlz")
  .value
  .trim();

  const description =
  document.getElementById("businessDescription")
  .value
  .trim();

  const website =
  document.getElementById("businessWebsite")
  .value
  .trim();

  const discord =
  document.getElementById("businessDiscord")
  .value
  .trim();

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    plz:plz,
    description:description,
    website:website,
    discord:discord
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Firmendaten konnten nicht gespeichert werden");

    console.error(error);

    return;
  }

  currentBusiness.plz =
  plz;

  currentBusiness.description =
  description;

  currentBusiness.website =
  website;

  currentBusiness.discord =
  discord;

  alert("Firmendaten gespeichert");
}

async function addEmployee(){

  const loginName =
  document.getElementById("employeeLoginName")
  .value
  .trim()
  .toLowerCase();

  const role =
  document.getElementById("employeeRole")
  .value;

  if(!loginName){

    alert("Bitte Loginname eintragen");

    return;
  }

  const { data: profile, error: profileError } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("login_name", loginName)
  .single();

  if(profileError || !profile){

    alert("User nicht gefunden");

    console.error(profileError);

    return;
  }

  const { data: existingMember } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .eq("user_id", profile.user_id)
  .maybeSingle();

  if(existingMember){

    const { error: updateError } =
    await supabaseClient
    .from("business_members")
    .update({
      member_role:role
    })
    .eq("id", existingMember.id);

    if(updateError){

      alert("Mitarbeiter konnte nicht aktualisiert werden");

      console.error(updateError);

      return;
    }

    alert("Mitarbeiterrolle aktualisiert");

    document.getElementById("employeeLoginName").value =
    "";

    loadEmployees();

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

    alert("Mitarbeiter konnte nicht hinzugef\u00fcgt werden");

    console.error(error);

    return;
  }

  document.getElementById("employeeLoginName").value =
  "";

  alert("Mitarbeiter hinzugef\u00fcgt");

  loadEmployees();
}

async function loadEmployees(){

  const { data, error } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", currentBusiness.id);

  if(error){

    console.error(error);

    return;
  }

  const list =
  document.getElementById("employeeList");

  list.innerHTML =
  "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Noch keine Mitarbeiter.</p>";

    return;
  }

  for(const member of data){

    const profile =
    await getProfileByUserId(member.user_id);

    const div =
    document.createElement("div");

    div.className =
    "business-item";

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
        Entfernen
      </button>
    `;

    list.appendChild(div);
  }
}

async function getProfileByUserId(userId){

  const { data, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", userId)
  .maybeSingle();

  if(error){
    console.error(error);
    return null;
  }

  return data;
}

async function removeEmployee(memberId){

  if(!confirm("Mitarbeiter wirklich entfernen?")){

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

  loadEmployees();
}

async function saveApplicationSettings(){

  const enabled =
  document.getElementById("applicationsEnabled")
  .checked;

  const open =
  document.getElementById("applicationsOpen")
  .checked;

  const note =
  document.getElementById("applicationNote")
  .value
  .trim();

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    applications_enabled:enabled,
    applications_open:open,
    application_note:note
  })
  .eq("id", currentBusiness.id);

  if(error){

    alert("Bewerbungseinstellungen konnten nicht gespeichert werden");

    console.error(error);

    return;
  }

  currentBusiness.applications_enabled =
  enabled;

  currentBusiness.applications_open =
  open;

  currentBusiness.application_note =
  note;

  alert("Bewerbungseinstellungen gespeichert");
}

async function addQuestion(){

  const questionText =
  document.getElementById("questionText")
  .value
  .trim();

  if(!questionText){

    alert("Bitte Frage eintragen");

    return;
  }

  const { error } =
  await supabaseClient
  .from("application_questions")
  .insert({
    business_id:currentBusiness.id,
    question_text:questionText,
    required:true,
    sort_order:0
  });

  if(error){

    alert("Frage konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  document.getElementById("questionText").value =
  "";

  loadQuestions();
}

async function loadQuestions(){

  const { data, error } =
  await supabaseClient
  .from("application_questions")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("sort_order");

  if(error){

    console.error(error);

    return;
  }

  const list =
  document.getElementById("questionList");

  list.innerHTML =
  "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Noch keine Bewerbungsfragen.</p>";

    return;
  }

  data.forEach(question => {

    const div =
    document.createElement("div");

    div.className =
    "business-item";

    div.innerHTML = `
      <strong>
        ${escapeHtml(question.question_text)}
      </strong>

      <button
        class="danger-btn"
        onclick="deleteQuestion(${question.id})"
      >
        Frage l&ouml;schen
      </button>
    `;

    list.appendChild(div);
  });
}

async function deleteQuestion(questionId){

  if(!confirm("Frage wirklich l\u00f6schen?")){

    return;
  }

  const { error } =
  await supabaseClient
  .from("application_questions")
  .delete()
  .eq("id", questionId);

  if(error){

    alert("Frage konnte nicht gel\u00f6scht werden");

    console.error(error);

    return;
  }

  loadQuestions();
}

async function loadApplications(){

  const { data, error } =
  await supabaseClient
  .from("applications")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("created_at", {
    ascending:false
  });

  if(error){

    console.error(error);

    return;
  }

  const list =
  document.getElementById("applicationList");

  list.innerHTML =
  "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Noch keine Bewerbungen vorhanden.</p>";

    return;
  }

  for(const application of data){

    const applicantProfile =
    await getProfileByUserId(application.user_id);

    const answers =
    await loadApplicationAnswers(application.id);

    const created =
    application.created_at
    ? new Date(application.created_at).toLocaleString("de-DE")
    : "-";

    const div =
    document.createElement("div");

    div.className =
    "application-card";

    div.innerHTML = `
      <div class="application-head">

        <div>
          <strong>
            ${escapeHtml(applicantProfile ? applicantProfile.display_name : "Unbekannter Bewerber")}
          </strong>

          <p>
            Login:
            ${escapeHtml(applicantProfile ? applicantProfile.login_name : "-")}
          </p>

          <p>
            Eingegangen:
            ${escapeHtml(created)}
          </p>
        </div>

        <span class="application-status status-${escapeHtml(application.status)}">
          ${escapeHtml(application.status)}
        </span>

      </div>

      <div class="application-message">
        <strong>Zus&auml;tzliche Nachricht:</strong>
        <p>
          ${escapeHtml(application.message || "-")}
        </p>
      </div>

      <div class="application-answers">
        <strong>Antworten:</strong>

        ${
          answers.length > 0
          ? answers.map(answer => `
              <div class="answer-box">
                <p class="answer-question">
                  ${escapeHtml(answer.question_text || "Frage")}
                </p>

                <p>
                  ${escapeHtml(answer.answer_text || "-")}
                </p>
              </div>
            `).join("")
          : "<p class='muted'>Keine Antworten vorhanden.</p>"
        }
      </div>

      <div class="application-actions">

        <select id="status-${application.id}">
          <option value="offen" ${application.status === "offen" ? "selected" : ""}>Offen</option>
          <option value="in_bearbeitung" ${application.status === "in_bearbeitung" ? "selected" : ""}>In Bearbeitung</option>
          <option value="angenommen" ${application.status === "angenommen" ? "selected" : ""}>Angenommen</option>
          <option value="abgelehnt" ${application.status === "abgelehnt" ? "selected" : ""}>Abgelehnt</option>
        </select>

        <textarea
          id="reply-${application.id}"
          placeholder="Antwort an den Bewerber"
        >${escapeHtml(application.owner_reply || "")}</textarea>

        <button onclick="saveApplication(${application.id})">
          Bewerbung speichern
        </button>

      </div>
    `;

    list.appendChild(div);
  }
}

async function loadApplicationAnswers(applicationId){

  const { data, error } =
  await supabaseClient
  .from("application_answers")
  .select("*")
  .eq("application_id", applicationId);

  if(error){

    console.error(error);

    return [];
  }

  const result = [];

  for(const answer of data || []){

    const { data: question } =
    await supabaseClient
    .from("application_questions")
    .select("*")
    .eq("id", answer.question_id)
    .maybeSingle();

    result.push({
      question_text: question ? question.question_text : "Frage",
      answer_text: answer.answer_text || ""
    });
  }

  return result;
}

async function saveApplication(applicationId){

  const status =
  document.getElementById("status-" + applicationId)
  .value;

  const reply =
  document.getElementById("reply-" + applicationId)
  .value
  .trim();

  const { error } =
  await supabaseClient
  .from("applications")
  .update({
    status:status,
    owner_reply:reply,
    updated_at:new Date().toISOString()
  })
  .eq("id", applicationId);

  if(error){

    alert("Bewerbung konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  alert("Bewerbung gespeichert");

  loadApplications();
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