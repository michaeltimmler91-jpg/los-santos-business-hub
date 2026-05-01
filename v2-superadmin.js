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

async function checkSuperadmin(){

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  const { data: profile, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", data.user.id)
  .single();

  if(error || !profile){

    alert("Profil nicht gefunden");

    window.location.href =
    "v2-login.html";

    return;
  }

  if(profile.global_role !== "superadmin"){

    alert("Kein Zugriff");

    window.location.href =
    "v2-dashboard.html";

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
  .order("display_name");

  if(error){

    console.error(error);

    return;
  }

  profilesCache =
  data || [];

  fillUserSelect();
}

function fillUserSelect(){

  const select =
  document.getElementById("ownerUserSelect");

  select.innerHTML = "";

  profilesCache.forEach(profile => {

    const option =
    document.createElement("option");

    option.value =
    profile.user_id;

    option.innerText =
    profile.display_name + " (" + profile.login_name + ")";

    select.appendChild(option);
  });
}

async function createBusiness(){

  const name =
  document.getElementById("businessName")
  .value
  .trim();

  const category =
  document.getElementById("businessCategory")
  .value;

  const description =
  document.getElementById("businessDescription")
  .value
  .trim();

  const plz =
  document.getElementById("businessPlz")
  .value
  .trim();

  if(!name){

    alert("Bitte Firmenname eingeben");

    return;
  }

  const { error } =
  await supabaseClient
  .from("businesses_v2")
  .insert({
    name:name,
    category:category,
    description:description,
    plz:plz,
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

  loadBusinesses();
}

async function loadBusinesses(){

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

  fillBusinessSelect();

  const list =
  document.getElementById("businessList");

  list.innerHTML = "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p>Noch keine Firmen vorhanden.</p>";

    return;
  }

  for(const business of data){

    const members =
    await loadBusinessMembers(business.id);

    const div =
    document.createElement("div");

    div.className = "business-item";

    div.innerHTML = `
      <div>

        <strong>
          ${escapeHtml(business.name)}
        </strong>

        <p>
          Kategorie:
          ${escapeHtml(business.category)}
        </p>

        <p>
          PLZ:
          ${escapeHtml(business.plz || "-")}
        </p>

        <p>
          Mitarbeiter:
        </p>

        <div class="member-list">
          ${
            members.length > 0
            ? members.map(member => `
                <div class="member-pill">
                  ${escapeHtml(member.profiles?.display_name || "Unbekannt")}
                  <span>
                    ${escapeHtml(member.member_role)}
                  </span>
                </div>
              `).join("")
            : "<span class='muted'>Noch keine Mitarbeiter</span>"
          }
        </div>

      </div>
    `;

    list.appendChild(div);
  }
}

async function loadBusinessMembers(businessId){

  const { data, error } =
  await supabaseClient
  .from("business_members")
  .select(`
    id,
    member_role,
    profiles (
      display_name,
      login_name
    )
  `)
  .eq("business_id", businessId);

  if(error){

    console.error(error);

    return [];
  }

  return data || [];
}

function fillBusinessSelect(){

  const select =
  document.getElementById("ownerBusinessSelect");

  select.innerHTML = "";

  businessesCache.forEach(business => {

    const option =
    document.createElement("option");

    option.value =
    business.id;

    option.innerText =
    business.name;

    select.appendChild(option);
  });
}

async function assignOwner(){

  const businessId =
  document.getElementById("ownerBusinessSelect")
  .value;

  const userId =
  document.getElementById("ownerUserSelect")
  .value;

  if(!businessId || !userId){

    alert("Bitte Firma und User ausw\u00e4hlen");

    return;
  }

  const { error } =
  await supabaseClient
  .from("business_members")
  .insert({
    business_id:Number(businessId),
    user_id:userId,
    member_role:"inhaber"
  });

  if(error){

    alert("Inhaber konnte nicht zugewiesen werden");

    console.error(error);

    return;
  }

  alert("Inhaber wurde zugewiesen");

  loadBusinesses();
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