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

async function loadAccount(){

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  currentUser =
  data.user;

  const { data: profile, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("user_id", currentUser.id)
  .single();

  if(error || !profile){

    alert("Profil konnte nicht geladen werden");

    console.error(error);

    return;
  }

  currentProfile =
  profile;

  document.getElementById("displayName").value =
  profile.display_name || "";
}

async function saveDisplayName(){

  const newName =
  document.getElementById("displayName")
  .value
  .trim();

  if(!newName){

    alert("Bitte Anzeigenamen eingeben");

    return;
  }

  if(newName.length < 3){

    alert(
      "Anzeigename muss mindestens 3 Zeichen haben"
    );

    return;
  }

  const { error } =
  await supabaseClient
  .from("profiles")
  .update({
    display_name:newName
  })
  .eq("user_id", currentUser.id);

  if(error){

    alert(
      "Anzeigename konnte nicht gespeichert werden"
    );

    console.error(error);

    return;
  }

  alert("Anzeigename gespeichert");
}

async function changePassword(){

  const pw1 =
  document.getElementById("newPassword").value;

  const pw2 =
  document.getElementById("newPasswordRepeat").value;

  if(!pw1 || !pw2){

    alert(
      "Bitte beide Passwortfelder ausfüllen"
    );

    return;
  }

  if(pw1 !== pw2){

    alert(
      "Passwörter stimmen nicht überein"
    );

    return;
  }

  if(pw1.length < 6){

    alert(
      "Passwort muss mindestens 6 Zeichen haben"
    );

    return;
  }

  const { error } =
  await supabaseClient.auth.updateUser({
    password:pw1
  });

  if(error){

    alert(
      "Passwort konnte nicht geändert werden"
    );

    console.error(error);

    return;
  }

  document.getElementById("newPassword").value = "";
  document.getElementById("newPasswordRepeat").value = "";

  alert("Passwort geändert");
}