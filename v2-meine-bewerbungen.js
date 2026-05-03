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
let profilesCache = [];

async function loadMyApplications(){

  const { data: userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  currentUser =
  userData.user;

  await loadProfiles();

  const { data, error } =
  await supabaseClient
  .from("applications")
  .select(`
    id,
    business_id,
    user_id,
    status,
    message,
    owner_reply,
    created_at,
    businesses_v2 (
      name
    )
  `)
  .eq("user_id", currentUser.id)
  .order("created_at", {
    ascending:false
  });

  if(error){

    console.error(error);

    document.getElementById("applicationList").innerHTML =
    "<p class='muted'>Bewerbungen konnten nicht geladen werden.</p>";

    return;
  }

  const list =
  document.getElementById("applicationList");

  list.innerHTML =
  "";
  
  updateApplicationStats(data || []);
  
  if(!data || data.length === 0){

  updateApplicationStats(data);

    list.innerHTML =
    "<p class='muted'>Du hast noch keine Bewerbungen geschrieben.</p>";

    return;
  }

  for(const application of data){

    const messages =
    await loadApplicationMessages(application.id);

    const created =
    application.created_at
    ? new Date(application.created_at).toLocaleString("de-DE")
    : "-";

    const businessName =
    application.businesses_v2 && application.businesses_v2.name
    ? application.businesses_v2.name
    : "Unbekannte Firma";

    const div =
    document.createElement("div");

    div.className =
    "application-card";

    div.innerHTML = `
      <div class="application-head">

        <div>

          <strong>
            ${escapeHtml(businessName)}
          </strong>

          <p>
            Gesendet:
            ${escapeHtml(created)}
          </p>

        </div>

        <span class="application-status status-${escapeHtml(application.status)}">
          ${escapeHtml(application.status)}
        </span>

      </div>

      <div class="application-message">

        <strong>
          Deine urspr&uuml;ngliche Nachricht:
        </strong>

        <p>
          ${escapeHtml(application.message || "-")}
        </p>

      </div>

      <div class="application-thread">

        <strong>
          Nachrichtenverlauf:
        </strong>

        ${
          messages.length > 0
          ? messages.map(message => renderMessage(message)).join("")
          : "<p class='muted'>Noch keine Nachrichten im Verlauf.</p>"
        }

      </div>

      <div class="application-actions">

        <textarea
          id="message-${application.id}"
          placeholder="Antwort schreiben"
        ></textarea>

        <button onclick="sendApplicantMessage(${application.id})">
          Antwort senden
        </button>

      </div>
    `;

    list.appendChild(div);
  }
}

async function loadProfiles(){

  const { data, error } =
  await supabaseClient
  .from("profiles")
  .select("*");

  if(error){

    console.error(error);

    profilesCache =
    [];

    return;
  }

  profilesCache =
  data || [];
}

function getProfileByUserId(userId){

  return profilesCache.find(profile =>
    profile.user_id === userId
  );
}

async function loadApplicationMessages(applicationId){

  const { data, error } =
  await supabaseClient
  .from("application_messages")
  .select("*")
  .eq("application_id", applicationId)
  .order("created_at", {
    ascending:true
  });

  if(error){

    console.error(error);

    return [];
  }

  return data || [];
}

function renderMessage(message){

  const profile =
  getProfileByUserId(message.sender_user_id);

  const senderName =
  profile
  ? profile.display_name
  : "Unbekannt";

  const created =
  message.created_at
  ? new Date(message.created_at).toLocaleString("de-DE")
  : "-";

  const isMine =
  currentUser &&
  message.sender_user_id === currentUser.id;

  return `
    <div class="thread-message ${isMine ? "thread-own" : "thread-other"}">

      <div class="thread-meta">
        ${escapeHtml(senderName)}
        &middot;
        ${escapeHtml(created)}
      </div>

      <div class="thread-text">
        ${escapeHtml(message.message_text)}
      </div>

    </div>
  `;
}

async function sendApplicantMessage(applicationId){

  const field =
  document.getElementById("message-" + applicationId);

  const messageText =
  field.value.trim();

  if(!messageText){

    alert("Bitte eine Nachricht eingeben");

    return;
  }

  const { error } =
  await supabaseClient
  .from("application_messages")
  .insert({
    application_id:applicationId,
    sender_user_id:currentUser.id,
    message_text:messageText
  });

  if(error){

    alert("Nachricht konnte nicht gesendet werden");

    console.error(error);

    return;
  }

  field.value =
  "";

  await loadMyApplications();
}

function goBack(){

  window.location.href =
  "v2-dashboard.html";
}

function updateApplicationStats(applications){

  const open =
  applications.filter(app =>
    normalizeStatus(app.status) === "offen"
  ).length;

  const progress =
  applications.filter(app =>
    normalizeStatus(app.status) === "inbearbeitung"
  ).length;

  const accepted =
  applications.filter(app =>
    normalizeStatus(app.status) === "angenommen"
  ).length;

  const rejected =
  applications.filter(app =>
    normalizeStatus(app.status) === "abgelehnt"
  ).length;

  document.getElementById("openApplications").innerText =
  open;

  document.getElementById("progressApplications").innerText =
  progress;

  document.getElementById("acceptedApplications").innerText =
  accepted;

  document.getElementById("rejectedApplications").innerText =
  rejected;
}

function normalizeStatus(status){

  return String(status || "")
    .toLowerCase()
    .replaceAll("_","")
    .replaceAll(" ","");
}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}