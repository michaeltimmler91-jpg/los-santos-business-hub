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

  const email =
  document.getElementById("registerEmail")
  .value
  .trim();

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
  .value
  .trim();

  if(!email || !loginName || !displayName || !password){

    alert("Bitte alle Felder ausf\u00fcllen");

    return;
  }

  const { data, error } =
  await supabaseClient.auth.signUp({
    email: email,
    password: password
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
      user_id: data.user.id,
      login_name: loginName,
      display_name: displayName,
      global_role: "user"
    });

    if(profileError){

      alert("Account wurde erstellt, aber Profil konnte nicht gespeichert werden");

      console.error(profileError);

      return;
    }
  }

  alert("Registrierung erfolgreich. Bitte best\u00e4tige deine E-Mail.");

  window.location.href = "v2-login.html";
}

async function loginUser(){

  const email =
  document.getElementById("loginEmail")
  .value
  .trim();

  const password =
  document.getElementById("loginPassword")
  .value
  .trim();

  if(!email || !password){

    alert("Bitte E-Mail und Passwort eingeben");

    return;
  }

  const { data, error } =
  await supabaseClient.auth.signInWithPassword({
    email: email,
    password: password
  });

  if(error){

    alert(error.message);

    console.error(error);

    return;
  }

  if(data.user){

    window.location.href = "v2-dashboard.html";
  }
}