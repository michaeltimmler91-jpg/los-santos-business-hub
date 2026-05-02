const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentUser = null;
let currentBusiness = null;
let currentMembership = null;
let companyMemberships = [];

async function checkCompanyAccess(){

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
  .eq("user_id", currentUser.id);

  if(error || !memberships || memberships.length === 0){
    alert("Du bist keiner Firma zugeordnet.");
    window.location.href = "v2-dashboard.html";
    return;
  }

  companyMemberships =
  memberships.filter(item =>
    item.businesses_v2 &&
    (
      item.member_role === "inhaber" ||
      item.member_role === "mitarbeiter"
    )
  );

  if(companyMemberships.length === 0){
    alert("Du hast keine Firmenberechtigung.");
    window.location.href = "v2-dashboard.html";
    return;
  }

  fillBusinessSelect();

  document
  .getElementById("businessSelect")
  .addEventListener("change", async function(){
    await loadBusiness(this.value);
  });

  await loadBusiness(companyMemberships[0].business_id);
}

function fillBusinessSelect(){

  const select =
  document.getElementById("businessSelect");

  select.innerHTML = "";

  companyMemberships.forEach(membership => {

    const option =
    document.createElement("option");

    option.value =
    membership.business_id;

    option.innerText =
    membership.businesses_v2.name +
    " (" +
    formatMemberRole(membership.member_role) +
    ")";

    select.appendChild(option);
  });
}

async function loadBusiness(businessId){

  currentMembership =
  companyMemberships.find(item =>
    Number(item.business_id) === Number(businessId)
  );

  if(!currentMembership){
    return;
  }

  currentBusiness =
  currentMembership.businesses_v2;

  document.getElementById("companyContent").classList.remove("hidden");

  document.getElementById("businessTitle").innerText =
  currentBusiness.name;

  document.getElementById("businessSelect").value =
  currentBusiness.id;

  document.getElementById("roleInfo").innerHTML =
  "<strong>Deine Rolle:</strong> " +
  formatMemberRole(currentMembership.member_role);

  updateStatus();
  toggleDeliveryArea();
  toggleOwnerAreas();

  if(isOwner()){
    fillOwnerFields();

    await loadEmployees();
    await loadAvailableUsers();
    await loadQuestions();
    await loadApplications();
    await loadCompanyReviews();
  }

  await loadBoardPosts();
}

function isOwner(){

  return currentMembership &&
  currentMembership.member_role === "inhaber";
}

function toggleOwnerAreas(){

  const ownerAreas =
  document.querySelectorAll(".owner-only");

  ownerAreas.forEach(area => {

    if(isOwner()){
      area.classList.remove("hidden");
    }else{
      area.classList.add("hidden");
    }
  });
}

function fillOwnerFields(){

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
}

function updateStatus(){

  document.getElementById("openStatus").innerText =
  currentBusiness.open ? "Ge&ouml;ffnet" : "Geschlossen";

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

  if(!currentBusiness.has_delivery){
    return;
  }

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

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

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

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

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
      <strong>${escapeHtml(profile ? profile.display_name : "Unbekannt")}</strong>

      <p>Login: ${escapeHtml(profile ? profile.login_name : "-")}</p>

      <p>Rolle: ${escapeHtml(member.member_role)}</p>

      <button class="danger-btn" onclick="removeEmployee(${member.id})">
        Mitarbeiter entfernen
      </button>
    `;

    list.appendChild(div);
  }
}

async function removeEmployee(memberId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

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

  await reloadMemberships();
}

async function reloadMemberships(){

  const { data } =
  await supabaseClient
  .from("business_members")
  .select(`
    *,
    businesses_v2(*)
  `)
  .eq("user_id", currentUser.id);

  companyMemberships =
  (data || []).filter(item =>
    item.businesses_v2 &&
    (
      item.member_role === "inhaber" ||
      item.member_role === "mitarbeiter"
    )
  );

  fillBusinessSelect();

  if(companyMemberships.length > 0){
    await loadBusiness(companyMemberships[0].business_id);
  }else{
    alert("Keine Firmen mehr zugeordnet.");
    window.location.href = "v2-dashboard.html";
  }
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

    option.value = profile.user_id;

    option.innerText =
    profile.display_name +
    " (" +
    profile.login_name +
    ")";

    select.appendChild(option);
  });
}

async function addEmployee(){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  const userId =
  document.getElementById("employeeUserSelect").value;

  const role =
  document.getElementById("employeeRole").value;

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
      alert("Mitarbeiter konnte nicht hinzugef&uuml;gt werden");
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

  if(!data || data.length === 0){
    list.innerHTML = "<p class='muted'>Noch keine Bewerbungsfragen.</p>";
    return;
  }

  data.forEach(question => {

    const div =
    document.createElement("div");

    div.className = "question-box";

    div.innerHTML = `
      <label>${escapeHtml(question.question_text)}</label>

      <button class="danger-btn" onclick="deleteQuestion(${question.id})">
        L&ouml;schen
      </button>
    `;

    list.appendChild(div);
  });
}

async function addQuestion(){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  const questionText =
  document.getElementById("questionText")
  .value
  .trim();

  if(!questionText){
    alert("Frage fehlt");
    return;
  }

  const { data: existingQuestions } =
  await supabaseClient
  .from("application_questions")
  .select("*")
  .eq("business_id", currentBusiness.id);

  const nextOrder =
  existingQuestions ? existingQuestions.length + 1 : 1;

  const { error } =
  await supabaseClient
  .from("application_questions")
  .insert({
    business_id: currentBusiness.id,
    question_text: questionText,
    required: true,
    sort_order: nextOrder
  });

  if(error){
    alert("Frage konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  document.getElementById("questionText").value = "";

  await loadQuestions();
}

async function deleteQuestion(questionId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  if(!confirm("Frage wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("application_questions")
  .delete()
  .eq("id", questionId);

  if(error){
    alert("Frage konnte nicht gel&ouml;scht werden");
    console.error(error);
    return;
  }

  await loadQuestions();
}

async function loadApplications(){

  const list =
  document.getElementById("applicationList");

  list.innerHTML = "";

  const { data, error } =
  await supabaseClient
  .from("applications")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("created_at", {
    ascending: false
  });

  if(error){
    console.error(error);
    list.innerHTML =
    "<p class='muted'>Bewerbungen konnten nicht geladen werden.</p>";
    return;
  }

  if(!data || data.length === 0){
    list.innerHTML =
    "<p class='muted'>Keine Bewerbungen vorhanden.</p>";
    return;
  }

  for(const application of data){

    const applicantProfile =
    await getProfileByUserId(application.user_id);

    const answers =
    await loadApplicationAnswers(application.id);

    const messages =
    await loadApplicationMessages(application.id);

    const created =
    application.created_at
    ? new Date(application.created_at).toLocaleString("de-DE")
    : "-";

    const div =
    document.createElement("div");

    div.className = "application-card";

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
          ${formatStatus(application.status)}
        </span>

      </div>

      <div class="application-message">
        <strong>Zus&auml;tzliche Nachricht:</strong>
        <p>${escapeHtml(application.message || "-")}</p>
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

      <div class="application-thread">
        <strong>Nachrichtenverlauf:</strong>

        ${
          messages.length > 0
          ? messages.map(message => renderCompanyMessage(message)).join("")
          : "<p class='muted'>Noch keine Nachrichten im Verlauf.</p>"
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
          placeholder="Antwort schreiben..."
        ></textarea>

        <button onclick="sendCompanyMessage(${application.id})">
          Nachricht senden
        </button>

        <button onclick="saveApplicationStatus(${application.id})">
          Status speichern
        </button>

        <button class="danger-btn" onclick="deleteApplication(${application.id})">
          Bewerbung l&ouml;schen
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

async function loadApplicationMessages(applicationId){

  const { data, error } =
  await supabaseClient
  .from("application_messages")
  .select("*")
  .eq("application_id", applicationId)
  .order("created_at", {
    ascending: true
  });

  if(error){
    console.error(error);
    return [];
  }

  return data || [];
}

function renderCompanyMessage(message){

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
        ${isMine ? "Du" : "Bewerber"}
        &middot;
        ${escapeHtml(created)}
      </div>

      <div class="thread-text">
        ${escapeHtml(message.message_text)}
      </div>

    </div>
  `;
}

async function sendCompanyMessage(applicationId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  const field =
  document.getElementById("reply-" + applicationId);

  const messageText =
  field.value.trim();

  if(!messageText){
    alert("Bitte Nachricht eingeben");
    return;
  }

  const { error } =
  await supabaseClient
  .from("application_messages")
  .insert({
    application_id: applicationId,
    sender_user_id: currentUser.id,
    message_text: messageText
  });

  if(error){
    alert("Nachricht konnte nicht gesendet werden");
    console.error(error);
    return;
  }

  field.value = "";

  await loadApplications();
}

async function saveApplicationStatus(applicationId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  const status =
  document.getElementById("status-" + applicationId).value;

  const { error } =
  await supabaseClient
  .from("applications")
  .update({
    status: status,
    updated_at: new Date().toISOString()
  })
  .eq("id", applicationId);

  if(error){
    alert("Status konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  alert("Status gespeichert");

  await loadApplications();
}

async function deleteApplication(applicationId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  if(!confirm("Bewerbung wirklich l&ouml;schen?")){
    return;
  }

  await supabaseClient
  .from("application_messages")
  .delete()
  .eq("application_id", applicationId);

  await supabaseClient
  .from("application_answers")
  .delete()
  .eq("application_id", applicationId);

  const { error } =
  await supabaseClient
  .from("applications")
  .delete()
  .eq("id", applicationId);

  if(error){
    alert("Bewerbung konnte nicht gel&ouml;scht werden");
    console.error(error);
    return;
  }

  alert("Bewerbung gel&ouml;scht");

  await loadApplications();
}

async function loadBoardPosts(){

  const list =
  document.getElementById("boardPosts");

  if(!list){
    return;
  }

  list.innerHTML =
  "<p class='muted'>Lade schwarzes Brett...</p>";

  const { data, error } =
  await supabaseClient
  .from("business_board_posts")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("pinned", {
    ascending:false
  })
  .order("created_at", {
    ascending:false
  });

  if(error){
    console.error(error);

    list.innerHTML =
    "<p class='muted'>Schwarzes Brett konnte nicht geladen werden.</p>";

    return;
  }

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Noch keine Beitr&auml;ge vorhanden.</p>";

    return;
  }

  list.innerHTML = "";

  for(const post of data){

    const author =
    await getProfileByUserId(post.author_user_id);

    const created =
    post.created_at
    ? new Date(post.created_at).toLocaleString("de-DE")
    : "-";

    const div =
    document.createElement("div");

    div.className =
    post.pinned
    ? "board-post board-post-pinned"
    : "board-post";

    div.innerHTML = `
      <div class="board-post-head">

        <div>

          ${
            post.pinned
            ? `
              <span class="board-pin">
                Angeheftet
              </span>
            `
            : ""
          }

          <h3>
            ${escapeHtml(post.title)}
          </h3>

          <p>
            Von
            ${escapeHtml(author ? author.display_name : "Unbekannt")}
            &middot;
            ${escapeHtml(created)}
          </p>

        </div>

        ${
          isOwner()
          ? `
            <button
              class="danger-btn"
              onclick="deleteBoardPost(${post.id})"
            >
              L&ouml;schen
            </button>
          `
          : ""
        }

      </div>

      <div class="board-post-content">
        ${escapeHtml(post.content)}
      </div>
    `;

    list.appendChild(div);
  }
}

async function createBoardPost(){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  const title =
  document.getElementById("boardTitle")
  .value
  .trim();

  const content =
  document.getElementById("boardContent")
  .value
  .trim();

  const pinned =
  document.getElementById("boardPinned")
  .checked;

  if(!title || !content){
    alert("Bitte Titel und Inhalt ausf&uuml;llen");
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_board_posts")
  .insert({
    business_id: currentBusiness.id,
    author_user_id: currentUser.id,
    title: title,
    content: content,
    pinned: pinned
  });

  if(error){
    alert("Beitrag konnte nicht erstellt werden");
    console.error(error);
    return;
  }

  document.getElementById("boardTitle").value = "";
  document.getElementById("boardContent").value = "";
  document.getElementById("boardPinned").checked = false;

  await loadBoardPosts();

  alert("Beitrag erstellt");
}

async function deleteBoardPost(postId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  if(!confirm("Beitrag wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_board_posts")
  .delete()
  .eq("id", postId)
  .eq("business_id", currentBusiness.id);

  if(error){
    alert("Beitrag konnte nicht gel&ouml;scht werden");
    console.error(error);
    return;
  }

  await loadBoardPosts();
}

async function loadCompanyReviews(){

  const list =
  document.getElementById("companyReviews");

  if(!list){
    return;
  }

  list.innerHTML =
  "<p class='muted'>Lade Bewertungen...</p>";

  const { data, error } =
  await supabaseClient
  .from("business_reviews")
  .select("*")
  .eq("business_id", currentBusiness.id)
  .order("created_at", {
    ascending:false
  });

  if(error){
    console.error(error);

    list.innerHTML =
    "<p class='muted'>Bewertungen konnten nicht geladen werden.</p>";

    return;
  }

  if(!data || data.length === 0){

    list.innerHTML =
    "<p class='muted'>Noch keine Bewertungen vorhanden.</p>";

    return;
  }

  list.innerHTML = "";

  for(const review of data){

    const profile =
    await getProfileByUserId(review.user_id);

    const div =
    document.createElement("div");

    div.className =
    "review-item";

    div.innerHTML = `
      <div class="review-stars">
	  <span>${renderStars(review.rating)}</span>
	  </div>

      <div class="review-author">
        ${escapeHtml(profile ? profile.display_name : "Unbekannt")}
      </div>

      <div class="review-text">
        ${escapeHtml(review.comment || "-")}
      </div>

      ${
        review.company_reply
        ? `
          <div class="company-reply">
            <strong>Antwort vom Unternehmen</strong>
            <div>${escapeHtml(review.company_reply)}</div>
          </div>
        `
        : ""
      }

      <textarea
        id="replyReview-${review.id}"
        placeholder="Antwort vom Unternehmen..."
      >${escapeHtml(review.company_reply || "")}</textarea>

      <button onclick="saveReviewReply(${review.id})">
        Antwort speichern
      </button>

      <button
        class="danger-btn"
        onclick="deleteReviewReply(${review.id})"
      >
        Antwort l&ouml;schen
      </button>
    `;

    list.appendChild(div);
  }
}

async function saveReviewReply(reviewId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  const field =
  document.getElementById("replyReview-" + reviewId);

  const reply =
  field.value.trim();

  if(!reply){
    alert("Bitte Antwort eingeben");
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_reviews")
  .update({
    company_reply:reply,
    company_reply_user_id:currentUser.id,
    company_reply_at:new Date().toISOString()
  })
  .eq("id", reviewId)
  .eq("business_id", currentBusiness.id);

  if(error){
    alert("Antwort konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  alert("Antwort gespeichert");

  await loadCompanyReviews();
}

async function deleteReviewReply(reviewId){

  if(!isOwner()){
    alert("Keine Berechtigung");
    return;
  }

  if(!confirm("Antwort wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_reviews")
  .update({
    company_reply:null,
    company_reply_user_id:null,
    company_reply_at:null
  })
  .eq("id", reviewId)
  .eq("business_id", currentBusiness.id);

  if(error){
    alert("Antwort konnte nicht gel&ouml;scht werden");
    console.error(error);
    return;
  }

  await loadCompanyReviews();
}

function renderStars(rating){

  let stars = "";

  for(let i = 1; i <= 5; i++){

    stars += i <= rating
    ? "&#9733;"
    : "&#9734;";
  }

  return stars;
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
      return status || "Offen";
  }
}

function formatMemberRole(role){

  switch(role){

    case "inhaber":
      return "Inhaber";

    case "mitarbeiter":
      return "Mitarbeiter";

    default:
      return role || "Unbekannt";
  }
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