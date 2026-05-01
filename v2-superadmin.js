const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

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

  loadBusinesses();
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
    plz:plz

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

  const list =
  document.getElementById("businessList");

  list.innerHTML = "";

  if(!data || data.length === 0){

    list.innerHTML =
    "<p>Noch keine Firmen vorhanden.</p>";

    return;
  }

  data.forEach(business => {

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

      </div>
    `;

    list.appendChild(div);

  });

}

function escapeHtml(text){

  return String(text || "")
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;")
  .replaceAll('"', "&quot;")
  .replaceAll("'", "&#039;");
}