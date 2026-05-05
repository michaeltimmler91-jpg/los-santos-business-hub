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
let companyMemberships = [];
let editingEventId = null;

async function checkEventsAdminAccess(){

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

    alert("Du bist bei keiner Firma Inhaber.");

    window.location.href =
    "v2-dashboard.html";

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
    resetEventForm();
    await loadBusiness(this.value);
  });

  await loadBusiness(companyMemberships[0].business_id);
}

function fillBusinessSelect(){

  const select =
  document.getElementById("businessSelect");

  select.innerHTML =
  "";

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
  .getElementById("eventAdminContent")
  .classList
  .remove("hidden");

  document.getElementById("businessTitle").innerText =
  currentBusiness.name;

  document.getElementById("businessSelect").value =
  currentBusiness.id;

  await loadEvents();
}

async function loadEvents(){

  const list =
  document.getElementById("eventsAdminList");

  list.innerHTML =
  "<p class='muted'>Lade Events...</p>";

  const { data, error } =
  await supabaseClient
  .from("business_events")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("event_date", {
    ascending:true
  })
  .order("event_time", {
    ascending:true
  });

  if(error){

    console.error(error);

    list.innerHTML =
    "<p class='muted'>Events konnten nicht geladen werden.</p>";

    return;
  }

  if(!data || data.length === 0){

    list.innerHTML =
    "<div class='homepage-empty-box'>Noch keine Events eingetragen.</div>";

    return;
  }

  list.innerHTML =
  "";

  data.forEach(event => {

    const div =
    document.createElement("div");

    div.className =
    "homepage-editor-block";

    div.innerHTML = `
      <div class="homepage-editor-block-head">

        <div>

          <span class="homepage-type-badge">
            ${event.visible ? "Sichtbar" : "Versteckt"}
          </span>

          <h3>
            ${escapeHtml(event.title)}
          </h3>

          <p>
            ${formatDate(event.event_date)}
            &middot;
            ${formatTime(event.event_time)}
            &middot;
            ${escapeHtml(event.location || "-")}
          </p>

        </div>

        <div class="homepage-block-actions">

          <button onclick="editEvent(${event.id})">
            Bearbeiten
          </button>

          <button
            class="owner-gray-btn"
            onclick="toggleEventVisible(${event.id}, ${event.visible ? "false" : "true"})"
          >
            ${event.visible ? "Verstecken" : "Anzeigen"}
          </button>

          <button
            class="danger-btn"
            onclick="deleteEvent(${event.id})"
          >
            L&ouml;schen
          </button>

        </div>

      </div>

      <div class="homepage-preview-content">
        ${formatPreview(event.description || "")}
      </div>
    `;

    list.appendChild(div);
  });
}

async function saveEvent(){

  if(!currentBusiness){

    alert("Keine Firma ausgew&auml;hlt");

    return;
  }

  const title =
  document.getElementById("eventTitle")
  .value
  .trim();

  const eventDate =
  document.getElementById("eventDate")
  .value;

  const eventTime =
  document.getElementById("eventTime")
  .value || null;

  const location =
  document.getElementById("eventLocation")
  .value
  .trim();

  const description =
  document.getElementById("eventDescription")
  .value
  .trim();

  const visible =
  document.getElementById("eventVisible")
  .checked;

  if(!title || !eventDate){

    alert("Bitte Titel und Datum eintragen.");

    return;
  }

  const eventData = {
    business_id:currentBusiness.id,
    title:title,
    event_date:eventDate,
    event_time:eventTime,
    location:location,
    description:description,
    visible:visible
  };

  let error = null;

  if(editingEventId){

    const result =
    await supabaseClient
    .from("business_events")
    .update(eventData)
    .eq("id", editingEventId)
    .eq("business_id", currentBusiness.id);

    error =
    result.error;

  }else{

    const result =
    await supabaseClient
    .from("business_events")
    .insert(eventData);

    error =
    result.error;
  }

  if(error){

    alert("Event konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  resetEventForm();

  await loadEvents();

  alert("Event gespeichert");
}

async function editEvent(eventId){

  const { data:event, error } =
  await supabaseClient
  .from("business_events")
  .select("*")
  .eq("id", eventId)
  .eq("business_id", currentBusiness.id)
  .single();

  if(error || !event){

    alert("Event nicht gefunden");

    console.error(error);

    return;
  }

  editingEventId =
  event.id;

  document.getElementById("eventTitle").value =
  event.title || "";

  document.getElementById("eventDate").value =
  event.event_date || "";

  document.getElementById("eventTime").value =
  event.event_time
  ? event.event_time.substring(0, 5)
  : "";

  document.getElementById("eventLocation").value =
  event.location || "";

  document.getElementById("eventDescription").value =
  event.description || "";

  document.getElementById("eventVisible").checked =
  event.visible === true;

  document.getElementById("eventEditorMode").innerText =
  "Bearbeiten";

  document.getElementById("eventEditorTitle").innerText =
  "Event bearbeiten";

  document
  .querySelector(".homepage-editor-form")
  .scrollIntoView({
    behavior:"smooth",
    block:"start"
  });
}

async function toggleEventVisible(eventId, newValue){

  const { error } =
  await supabaseClient
  .from("business_events")
  .update({
    visible:newValue
  })
  .eq("id", eventId)
  .eq("business_id", currentBusiness.id);

  if(error){

    alert("Sichtbarkeit konnte nicht ge&auml;ndert werden");

    console.error(error);

    return;
  }

  await loadEvents();
}

async function deleteEvent(eventId){

  if(!confirm("Event wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_events")
  .delete()
  .eq("id", eventId)
  .eq("business_id", currentBusiness.id);

  if(error){

    alert("Event konnte nicht gel&ouml;scht werden");

    console.error(error);

    return;
  }

  if(editingEventId === eventId){
    resetEventForm();
  }

  await loadEvents();
}

function resetEventForm(){

  editingEventId =
  null;

  document.getElementById("eventTitle").value =
  "";

  document.getElementById("eventDate").value =
  "";

  document.getElementById("eventTime").value =
  "";

  document.getElementById("eventLocation").value =
  "";

  document.getElementById("eventDescription").value =
  "";

  document.getElementById("eventVisible").checked =
  true;

  document.getElementById("eventEditorMode").innerText =
  "Neues Event";

  document.getElementById("eventEditorTitle").innerText =
  "Event erstellen";
}

function formatDate(dateString){

  if(!dateString){
    return "-";
  }

  return new Date(dateString).toLocaleDateString("de-DE");
}

function formatTime(timeString){

  if(!timeString){
    return "Uhrzeit offen";
  }

  return timeString.substring(0, 5) + " Uhr";
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