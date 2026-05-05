const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";


const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

let eventsCache = [];

async function loadEvents(){

  const { data:userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  const today =
  new Date().toISOString().split("T")[0];

  const { data, error } =
  await supabaseClient
  .from("business_events")
  .select(`
    *,
    businesses_v2(*)
  `)
  .eq("visible", true)
  .gte("event_date", today)
  .order("event_date", {
    ascending:true
  })
  .order("event_time", {
    ascending:true
  });

  if(error){

    console.error(error);

    document.getElementById("eventsList").innerHTML =
    "<p class='muted'>Events konnten nicht geladen werden.</p>";

    return;
  }

  eventsCache =
  data || [];

  renderNextEvent(eventsCache);
  renderEvents(eventsCache);
}

function renderNextEvent(events){

  const box =
  document.getElementById("nextEventBox");

  if(!events || events.length === 0){

    box.innerHTML =
    "";

    return;
  }

  const event =
  events[0];

  const business =
  event.businesses_v2 || {};

  box.innerHTML = `
    <section class="next-event-card">

      <span class="hub-kicker">
        N&auml;chstes Event
      </span>

      <h2>
        ${escapeHtml(event.title)}
      </h2>

      <div class="next-event-meta">

        <span>
          ${formatDate(event.event_date)}
        </span>

        <span>
          ${formatTime(event.event_time)}
        </span>

        <span>
          ${escapeHtml(event.location || business.name || "Los Santos")}
        </span>

      </div>

      <p>
        ${escapeHtml(event.description || "Keine Beschreibung vorhanden.")}
      </p>

      <div class="hub-buttons">

        <a href="v2-firma-home.html?id=${event.business_id}">
          Zur Firma
        </a>

      </div>

    </section>
  `;
}

function renderEvents(events){

  const list =
  document.getElementById("eventsList");

  list.innerHTML =
  "";

  if(!events || events.length === 0){

    list.innerHTML =
    "<p class='muted'>Keine kommenden Events gefunden.</p>";

    return;
  }

  events.forEach(event => {

    const business =
    event.businesses_v2 || {};

    const card =
    document.createElement("div");

    card.className =
    "event-card";

    card.innerHTML = `
      <div class="event-date-box">

        <strong>
          ${formatDay(event.event_date)}
        </strong>

        <span>
          ${formatMonth(event.event_date)}
        </span>

      </div>

      <div class="event-card-content">

        <span class="hub-kicker">
          ${escapeHtml(business.name || "Firma")}
        </span>

        <h2>
          ${escapeHtml(event.title)}
        </h2>

        <div class="event-meta">

          <span>
            ${formatDate(event.event_date)}
          </span>

          <span>
            ${formatTime(event.event_time)}
          </span>

          <span>
            ${escapeHtml(event.location || "-")}
          </span>

        </div>

        <p>
          ${escapeHtml(event.description || "")}
        </p>

        <div class="hub-buttons">

          <a href="v2-firma-home.html?id=${event.business_id}">
            Firmenseite
          </a>

        </div>

      </div>
    `;

    list.appendChild(card);
  });
}

function filterEvents(){

  const search =
  document.getElementById("eventSearch")
  .value
  .trim()
  .toLowerCase();

  const range =
  document.getElementById("eventRange")
  .value;

  const now =
  new Date();

  const todayString =
  now.toISOString().split("T")[0];

  const weekEnd =
  new Date();

  weekEnd.setDate(now.getDate() + 7);

  const weekEndString =
  weekEnd.toISOString().split("T")[0];

  const filtered =
  eventsCache.filter(event => {

    const business =
    event.businesses_v2 || {};

    const haystack =
    (
      event.title + " " +
      event.description + " " +
      event.location + " " +
      business.name
    )
    .toLowerCase();

    const matchesSearch =
    !search ||
    haystack.includes(search);

    let matchesRange = true;

    if(range === "today"){
      matchesRange =
      event.event_date === todayString;
    }

    if(range === "week"){
      matchesRange =
      event.event_date >= todayString &&
      event.event_date <= weekEndString;
    }

    return matchesSearch && matchesRange;
  });

  renderNextEvent(filtered);
  renderEvents(filtered);
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

function formatDay(dateString){

  if(!dateString){
    return "--";
  }

  return new Date(dateString).toLocaleDateString("de-DE", {
    day:"2-digit"
  });
}

function formatMonth(dateString){

  if(!dateString){
    return "---";
  }

  return new Date(dateString).toLocaleDateString("de-DE", {
    month:"short"
  });
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

