const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function registerUser(){

  const loginName =
  document.getElementById("registerLoginName")
  .value
  .trim()
  .toLowerCase();

  const displayName =
  document.getElementById("registerDisplayName")
  .value
  .trim();

  const password =
  document.getElementById("registerPassword")
  .value;

  const passwordRepeat =
  document.getElementById("registerPasswordRepeat")
  .value;

  if(
    !loginName ||
    !displayName ||
    !password ||
    !passwordRepeat
  ){

    alert("Bitte alle Felder ausfüllen");

    return;
  }

  if(password.length < 6){

    alert("Das Passwort muss mindestens 6 Zeichen haben");

    return;
  }

  if(password !== passwordRepeat){

    alert("Die Passwörter stimmen nicht überein");

    return;
  }

  const fakeEmail =
  loginName +
  "@businesshub.local";

  const { data: existingProfile } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("login_name", loginName)
  .maybeSingle();

  if(existingProfile){

    alert("Der Loginname existiert bereits");

    return;
  }

  const { data, error } =
  await supabaseClient.auth.signUp({
    email:fakeEmail,
    password:password
  });

  if(error){

    alert(error.message);

    console.error(error);

    return;
  }

  if(data.user){

    const { error: profileError } =
    await supabaseClient
    .from("profiles")
    .insert({
      user_id:data.user.id,
      email:fakeEmail,
      login_name:loginName,
      display_name:displayName,
      global_role:"user",
      approved:false,
      blocked:false
    });

    if(profileError){

      alert(
        "Account erstellt, aber Profil konnte nicht gespeichert werden"
      );

      console.error(profileError);

      return;
    }
  }

  alert(
    "Registrierung erfolgreich.\n\nEin Guide oder Superadmin muss deinen Account jetzt freischalten."
  );

  window.location.href =
  "v2-login.html";
}

async function loginUser(){

  const loginName =
  document.getElementById("loginLoginname")
  .value
  .trim()
  .toLowerCase();

  const password =
  document.getElementById("loginPassword")
  .value;

  if(!loginName || !password){

    alert("Bitte Loginname und Passwort eingeben");

    return;
  }

  const { data: profile, error: profileError } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .eq("login_name", loginName)
  .maybeSingle();

  if(profileError || !profile){

    alert("Loginname nicht gefunden");

    return;
  }

  if(profile.blocked === true){

    alert("Dein Account wurde gesperrt.");

    return;
  }

  if(profile.approved !== true){

    alert("Dein Account wurde noch nicht freigeschaltet.");

    return;
  }

  if(!profile.email){

    alert("Bei diesem Account fehlt die E-Mail im Profil.");

    return;
  }

  const { error } =
  await supabaseClient.auth.signInWithPassword({
    email:profile.email,
    password:password
  });

  if(error){

    alert("Falsches Passwort");

    console.error(error);

    return;
  }

  window.location.href = "v2-firmen.html";
}

async function checkDashboard(){

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

    document.getElementById("welcomeText").innerText =
    "Eingeloggt, aber kein Profil gefunden.";

    return;
  }

  if(profile.blocked === true){

    await supabaseClient.auth.signOut();

    alert("Dein Account wurde gesperrt.");

    window.location.href =
    "v2-login.html";

    return;
  }

  if(profile.approved !== true){

    await supabaseClient.auth.signOut();

    alert("Dein Account ist noch nicht freigeschaltet.");

    window.location.href =
    "v2-login.html";

    return;
  }

  document.getElementById("welcomeTitle").innerText =
  "Willkommen, " + profile.display_name + "!";

  document.getElementById("welcomeText").innerText =
  "Loginname: " + profile.login_name;

  const { data: roles } =
  await supabaseClient
  .from("user_roles")
  .select("*")
  .eq("user_id", data.user.id);

  const roleNames =
  roles
  ? roles.map(role => role.role_name)
  : [];

  if(
    profile.global_role === "superadmin" ||
    roleNames.includes("superadmin")
  ){

    document
    .getElementById("superadminLink")
    .classList
    .remove("hidden");
  }

  if(
    roleNames.includes("guide") ||
    roleNames.includes("superadmin")
  ){

    document
    .getElementById("userManagementLink")
    .classList
    .remove("hidden");
  }

  const { data: memberships, error: memberError } =
  await supabaseClient
  .from("business_members")
  .select("*")
  .eq("user_id", data.user.id)
  .eq("member_role", "inhaber");

  if(!memberError && memberships && memberships.length > 0){

    document
    .getElementById("ownerLink")
    .classList
    .remove("hidden");
  }
}

async function logoutUser(){

  await supabaseClient.auth.signOut();

  window.location.href =
  "v2-login.html";
}