const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const params =
new URLSearchParams(window.location.search);

const businessId =
params.get("id");

let currentUser = null;
let currentBusiness = null;
let questionsCache = [];

async function loadApplicationPage(){

  const { data: userData } =
  await supabaseClient.auth.getUser();

  if(!userData.user){
    window.location.href = "v2-login.html";
    return;
  }

  currentUser =
  userData.user;

  const { data: business, error: businessError } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .eq("id", businessId)
  .single();

  if(businessError || !business){
    alert("Firma nicht gefunden");
    window.location.href = "v2-firmen.html";
    return;
  }

  currentBusiness =
  business;

  if(!business.applications_enabled || !business.applications_open){
    alert("Bewerbungen sind aktuell geschlossen");
    window.location.href = "v2-firmen.html";
    return;
  }

  document.getElementById("businessTitle").innerText =
  "Bewerbung bei " + business.name;

  document.getElementById("applicationNote").innerText =
  business.application_note || "";

  await loadQuestions();
}

async function loadQuestions(){

  const { data, error } =
  await supabaseClient
  .from("application_questions")
  .select("*")
  .eq("business_id", businessId)
  .order("sort_order");

  if(error){
    console.error(error);
    return;
  }

  questionsCache =
  data || [];

  const box =
  document.getElementById("questionsBox");

  box.innerHTML = "";

  if(questionsCache.length === 0){

    box.innerHTML =
    "<p class='muted'>Diese Firma hat noch keine eigenen Fragen hinterlegt.</p>";

    return;
  }

  questionsCache.forEach(question => {

    const div =
    document.createElement("div");

    div.className =
    "question-box";

    div.innerHTML = `
      <label>
        ${escapeHtml(question.question_text)}
      </label>

      <textarea
        id="question-${question.id}"
        placeholder="Antwort eingeben"
      ></textarea>
    `;

    box.appendChild(div);
  });
}

async function sendApplication(){

  for(const question of questionsCache){

    const field =
    document.getElementById("question-" + question.id);

    if(question.required && (!field || field.value.trim() === "")){

      alert("Bitte alle Pflichtfragen beantworten");

      return;
    }
  }

  const message =
  document.getElementById("messageText")
  .value
  .trim();

  const { data: existingApplication } =
  await supabaseClient
  .from("applications")
  .select("*")
  .eq("business_id", businessId)
  .eq("user_id", currentUser.id)
  .eq("status", "offen")
  .maybeSingle();

  if(existingApplication){

    alert("Du hast bei dieser Firma bereits eine offene Bewerbung");

    return;
  }

  const { data: application, error } =
  await supabaseClient
  .from("applications")
  .insert({
    business_id:Number(businessId),
    user_id:currentUser.id,
    status:"offen",
    message:message
  })
  .select()
  .single();

  if(error || !application){

    alert("Bewerbung konnte nicht gespeichert werden");

    console.error(error);

    return;
  }

  for(const question of questionsCache){

    const answer =
    document.getElementById("question-" + question.id)
    .value
    .trim();

    await supabaseClient
    .from("application_answers")
    .insert({
      application_id:application.id,
      question_id:question.id,
      answer_text:answer
    });
  }

  alert("Bewerbung wurde abgeschickt");

  window.location.href =
  "v2-firmen.html";
}

function goBack(){

  window.location.href =
  "v2-firmen.html";
}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}