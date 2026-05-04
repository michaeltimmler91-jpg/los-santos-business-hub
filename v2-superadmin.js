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

  const { data: profile, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", data.user.id)
  .single();

  if(error || !profile || profile.global_role !== "superadmin"){
    window.location.href = "v2-dashboard.html";
    return;
  }

  await loadProfiles();
  await loadBusinesses();
}

async function loadProfiles(){

  const { data, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .or("deleted.is.null,deleted.eq.false")
  .order("display_name");

  if(error){
    console.error(error);
    profilesCache = [];
    return;
  }

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
    delivery:false,
    applications_enabled:false,
    applications_open:false
  });

  if(error){
    alert("Firma konnte nicht erstellt werden");
    console.error(error);
    return;
  }

  alert("Firma erstellt");

  document.getElementById("businessName").value = "";
  document.getElementById("businessDescription").value = "";
  document.getElementById("businessPlz").value = "";
  document.getElementById("businessHasDelivery").checked = false;
  document.getElementById("businessImage").value = "";

  loadBusinesses();
}

async function uploadBusinessImage(file, businessName){

  const allowedTypes = [
    "image/jpeg",
    "image/png",
    "image/webp",
    "image/gif"
  ];

  if(!allowedTypes.includes(file.type)){
    alert("Bitte nur JPG, PNG, WEBP oder GIF hochladen.");
    return "";
  }

  const maxSize =
  5 * 1024 * 1024;

  if(file.size > maxSize){
    alert("Bild ist zu gro&szlig;. Maximal 5 MB.");
    return "";
  }

  const fileExt =
  (file.name.split(".").pop() || "png")
  .toLowerCase();

  const cleanName =
  businessName
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

  const fileName =
  "business-" +
  cleanName +
  "-" +
  Date.now() +
  "." +
  fileExt;

  const { data, error } =
  await supabaseClient.storage
  .from("business-images")
  .upload(fileName, file, {
    cacheControl:"3600",
    upsert:false
  });

  if(error){
    console.error("Upload-Fehler:", error);

    alert(
      "Bild konnte nicht hochgeladen werden.\n\n" +
      (
        error.message ||
        "Bitte pr&uuml;fe Supabase Storage Bucket und Policies."
      )
    );

    return "";
  }

  const { data:publicData } =
  supabaseClient.storage
  .from("business-images")
  .getPublicUrl(data.path);

  return publicData.publicUrl;
}

async function loadBusinesses(){

  await loadProfiles();

  const { data, error } =
  await supabaseClient
  .from("businesses_v2")
  .select("*")
  .order("name");

  if(error){
    console.error(error);
    return;
  }

  businessesCache = data || [];

  const list =
  document.getElementById("businessList");

  list.innerHTML = "";

  if(businessesCache.length === 0){

    list.innerHTML =
    "<p class='muted'>Noch keine Firmen vorhanden.</p>";

    return;
  }

  for(const business of businessesCache){

    const members =
    await loadBusinessMembers(business.id);

    const owners =
    members.filter(member =>
      member.member_role === "inhaber"
    );

    const employees =
    members.filter(member =>
      member.member_role === "mitarbeiter"
    );

    const div =
    document.createElement("div");

    div.className =
    "business-item";

    div.innerHTML = `
      <div class="business-row">

        <div class="business-preview">

          ${
            business.image_url
            ? `
              <img
                src="${escapeHtml(business.image_url)}"
                alt="Firmenbild"
              >
            `
            : `
              <div class="no-image">
                Kein Bild
              </div>
            `
          }

        </div>

        <div class="business-info">

          <strong>
            ${escapeHtml(business.name)}
          </strong>

          <p>
            Kategorie:
            ${escapeHtml(business.category || "-")}
          </p>

          <p>
            Standort:
            ${escapeHtml(business.plz || "-")}
          </p>

          <p>
            Lieferung erlaubt:
            ${business.has_delivery ? "Ja" : "Nein"}
          </p>

          <div class="owner-button-row">

            <button
              class="${business.open ? "danger-btn" : ""}"
              onclick="toggleBusinessOpen(${business.id}, ${business.open ? "false" : "true"})"
            >
              ${business.open ? "Firma schlie&szlig;en" : "Firma &ouml;ffnen"}
            </button>

            ${
              business.has_delivery
              ? `
                <button
                  class="${business.delivery ? "danger-btn" : "owner-gray-btn"}"
                  onclick="toggleBusinessDelivery(${business.id}, ${business.delivery ? "false" : "true"})"
                >
                  ${business.delivery ? "Lieferung deaktivieren" : "Lieferung aktivieren"}
                </button>
              `
              : ""
            }

          </div>

          <div class="business-admin-members">

            <div class="business-admin-member-group">

              <span class="hub-kicker">
                Inhaber
              </span>

              ${renderBusinessMemberList(owners, true)}

            </div>

            <div class="business-admin-member-group">

              <span class="hub-kicker">
                Mitarbeiter
              </span>

              ${renderBusinessMemberList(employees, true)}

            </div>

          </div>

          <button onclick="openEditModal(${business.id})">
            Firma bearbeiten
          </button>

        </div>

      </div>
    `;

    list.appendChild(div);
  }
}

async function toggleBusinessOpen(businessId, newValue){

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    open:newValue
  })
  .eq("id", businessId);

  if(error){
    alert("Status konnte nicht ge&auml;ndert werden");
    console.error(error);
    return;
  }

  await loadBusinesses();
}

async function toggleBusinessDelivery(businessId, newValue){

  const business =
  businessesCache.find(item =>
    Number(item.id) === Number(businessId)
  );

  if(!business){
    alert("Firma nicht gefunden");
    return;
  }

  if(!business.has_delivery){
    alert("Diese Firma hat keine Lieferung aktiviert");
    return;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update({
    delivery:newValue
  })
  .eq("id", businessId);

  if(error){
    alert("Lieferstatus konnte nicht ge&auml;ndert werden");
    console.error(error);
    return;
  }

  await loadBusinesses();
}

async function loadBusinessMembers(businessId){

  const { data, error } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", businessId);

  if(error){
    console.error(error);
    return [];
  }

  return data || [];
}

async function openEditModal(businessId){

  const business =
  businessesCache.find(item =>
    Number(item.id) === Number(businessId)
  );

  if(!business){
    alert("Firma nicht gefunden");
    return;
  }

  currentEditBusiness = business;

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

  document.getElementById("editBusinessWebsite").value =
  business.website || "";

  document.getElementById("editBusinessDiscord").value =
  business.discord || "";

  document.getElementById("editBusinessHasDelivery").checked =
  business.has_delivery === true;

  fillEditOwnerSelect(
    currentOwner ? currentOwner.user_id : ""
  );

  renderEditBusinessMembers(members);

  document
  .getElementById("editModal")
  .classList
  .remove("hidden");
}

function renderBusinessMemberList(members, showActions){

  if(!members || members.length === 0){

    return `
      <p class="muted">
        Keine eingetragen
      </p>
    `;
  }

  return `
    <div class="business-admin-member-list">

      ${
        members.map(member => {

          const profile =
          getProfileByUserId(member.user_id);

          const displayName =
          profile
          ? profile.display_name
          : "Unbekannter User";

          const loginName =
          profile
          ? profile.login_name
          : member.user_id;

          const isOwner =
          member.member_role === "inhaber";

          return `
            <div class="business-admin-member-pill">

              <div>
                <strong>
                  ${escapeHtml(displayName)}
                </strong>

                <span>
                  ${escapeHtml(loginName || "-")}
                </span>
              </div>

              ${
                showActions
                ? `
                  <div class="owner-button-row">

                    <button
                      class="owner-gray-btn"
                      onclick="changeBusinessMemberRole(${member.id}, '${isOwner ? "mitarbeiter" : "inhaber"}')"
                    >
                      Als ${isOwner ? "Mitarbeiter" : "Inhaber"} setzen
                    </button>

                    <button
                      class="danger-btn"
                      onclick="deleteBusinessMember(${member.id})"
                    >
                      Entfernen
                    </button>

                  </div>
                `
                : ""
              }

            </div>
          `;
        }).join("")
      }

    </div>
  `;
}

function renderEditBusinessMembers(members){

  const box =
  document.getElementById("editBusinessMembersList");

  if(!box){
    return;
  }

  const owners =
  (members || []).filter(member =>
    member.member_role === "inhaber"
  );

  const employees =
  (members || []).filter(member =>
    member.member_role === "mitarbeiter"
  );

  box.innerHTML = `
    <div class="business-admin-member-group">

      <span class="hub-kicker">
        Inhaber
      </span>

      ${renderBusinessMemberList(owners, true)}

    </div>

    <div class="business-admin-member-group">

      <span class="hub-kicker">
        Mitarbeiter
      </span>

      ${renderBusinessMemberList(employees, true)}

    </div>
  `;
}

async function changeBusinessMemberRole(memberId, newRole){

  if(
    newRole !== "inhaber" &&
    newRole !== "mitarbeiter"
  ){
    alert("Ung&uuml;ltiger Rang");
    return;
  }

  const roleText =
  newRole === "inhaber"
  ? "Inhaber"
  : "Mitarbeiter";

  if(!confirm("Rang wirklich zu " + roleText + " &auml;ndern?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .update({
    member_role:newRole
  })
  .eq("id", memberId);

  if(error){
    alert("Rang konnte nicht ge&auml;ndert werden");
    console.error(error);
    return;
  }

  alert("Rang wurde ge&auml;ndert");

  if(currentEditBusiness){
    const members =
    await loadBusinessMembers(currentEditBusiness.id);

    renderEditBusinessMembers(members);
  }

  await loadBusinesses();
}

async function deleteBusinessMember(memberId){

  if(!confirm("Person wirklich aus der Firma entfernen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .delete()
  .eq("id", memberId);

  if(error){
    alert("Person konnte nicht entfernt werden");
    console.error(error);
    return;
  }

  alert("Person wurde aus der Firma entfernt");

  if(currentEditBusiness){
    const members =
    await loadBusinessMembers(currentEditBusiness.id);

    renderEditBusinessMembers(members);
  }

  await loadBusinesses();
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

function closeEditModal(){

  currentEditBusiness = null;

  document.getElementById("editBusinessImage").value = "";

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

  const website =
  document.getElementById("editBusinessWebsite").value.trim();

  const discord =
  document.getElementById("editBusinessDiscord").value.trim();

  const hasDelivery =
  document.getElementById("editBusinessHasDelivery").checked;

  const ownerUserId =
  document.getElementById("editOwnerSelect").value;

  const imageFile =
  document.getElementById("editBusinessImage").files[0];

  if(!name){
    alert("Bitte Firmenname eingeben");
    return;
  }

  let imageUrl =
  currentEditBusiness.image_url || "";

  if(imageFile){
    imageUrl = await uploadBusinessImage(imageFile, name);
  }

  const updateData = {
    name:name,
    category:category,
    description:description,
    plz:plz,
    website:website,
    discord:discord,
    has_delivery:hasDelivery,
    image_url:imageUrl
  };

  if(!hasDelivery){
    updateData.delivery = false;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .update(updateData)
  .eq("id", id);

  if(error){
    alert("Firma konnte nicht gespeichert werden");
    console.error(error);
    return;
  }

  const ownerChanged =
  await changeOwner(id, ownerUserId);

  if(!ownerChanged){
    return;
  }

  alert("Firma gespeichert");

  closeEditModal();

  loadBusinesses();
}

async function changeOwner(businessId, ownerUserId){

  const { error: deleteError } =
  await supabaseClient
  .from("business_members")
  .delete()
  .eq("business_id", businessId)
  .eq("member_role", "inhaber");

  if(deleteError){
    alert("Alter Inhaber konnte nicht entfernt werden");
    console.error(deleteError);
    return false;
  }

  if(!ownerUserId){
    return true;
  }

  const { data: existingMember } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("business_id", businessId)
  .eq("user_id", ownerUserId)
  .maybeSingle();

  if(existingMember){

    const { error: updateError } =
    await supabaseClient
    .from("business_members")
    .update({
      member_role:"inhaber"
    })
    .eq("id", existingMember.id);

    if(updateError){
      alert("Inhaber konnte nicht ge&auml;ndert werden");
      console.error(updateError);
      return false;
    }

    return true;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .insert({
    business_id:businessId,
    user_id:ownerUserId,
    member_role:"inhaber"
  });

  if(error){
    alert("Inhaber konnte nicht gespeichert werden");
    console.error(error);
    return false;
  }

  return true;
}

async function deleteBusiness(){

  if(!currentEditBusiness){
    alert("Keine Firma ausgew&auml;hlt");
    return;
  }

  if(!confirm("Firma wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .delete()
  .eq("id", currentEditBusiness.id);

  if(error){
    alert("Firma konnte nicht gel&ouml;scht werden");
    console.error(error);
    return;
  }

  alert("Firma gel&ouml;scht");

  closeEditModal();

  loadBusinesses();
}

async function loadAllReviews(){

  const list =
  document.getElementById("adminReviewsList");

  if(!list){
    return;
  }

  list.innerHTML =
  "<p class='muted'>Lade Bewertungen...</p>";

  const { data, error } =
  await supabaseClient
  .from("business_reviews")
  .select("*")
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
    "<p class='muted'>Keine Bewertungen vorhanden.</p>";

    return;
  }

  list.innerHTML = "";

  for(const review of data){

    const business =
    businessesCache.find(item =>
      Number(item.id) === Number(review.business_id)
    );

    const profile =
    getProfileByUserId(review.user_id);

    const div =
    document.createElement("div");

    div.className =
    "review-item";

    div.innerHTML = `
      <div class="review-stars">
        <span>${renderStars(review.rating)}</span>
      </div>

      <div class="review-author">

        ${escapeHtml(
          profile
          ? profile.display_name
          : "Unbekannt"
        )}

      </div>

      <p>
        Firma:
        <strong>
          ${escapeHtml(
            business
            ? business.name
            : "Unbekannt"
          )}
        </strong>
      </p>

      <div class="review-text">
        ${escapeHtml(review.comment || "-")}
      </div>

      ${
        review.company_reply
        ? `
          <div class="company-reply">

            <strong>
              Antwort vom Unternehmen
            </strong>

            <div>
              ${escapeHtml(review.company_reply)}
            </div>

          </div>
        `
        : ""
      }

      <div class="owner-button-row">

        <button
          class="danger-btn"
          onclick="deleteReview(${review.id})"
        >
          Bewertung l&ouml;schen
        </button>

        ${
          review.company_reply
          ? `
            <button
              onclick="deleteReviewReplyAdmin(${review.id})"
            >
              Antwort l&ouml;schen
            </button>
          `
          : ""
        }

      </div>
    `;

    list.appendChild(div);
  }
}

async function deleteReview(reviewId){

  if(!confirm("Bewertung wirklich l&ouml;schen?")){
    return;
  }

  const { error } =
  await supabaseClient
  .from("business_reviews")
  .delete()
  .eq("id", reviewId);

  if(error){

    alert("Bewertung konnte nicht gel&ouml;scht werden");

    console.error(error);

    return;
  }

  await loadAllReviews();
}

async function deleteReviewReplyAdmin(reviewId){

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
  .eq("id", reviewId);

  if(error){

    alert("Antwort konnte nicht gel&ouml;scht werden");

    console.error(error);

    return;
  }

  await loadAllReviews();
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