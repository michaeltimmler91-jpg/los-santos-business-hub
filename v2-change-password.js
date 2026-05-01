const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

async function changePassword(){

  const password =
  document.getElementById("newPassword")
  .value;

  const passwordRepeat =
  document.getElementById("newPasswordRepeat")
  .value;

  if(!password || !passwordRepeat){

    alert("Bitte beide Felder ausf\u00fcllen");

    return;
  }

  if(password.length < 6){

    alert("Das Passwort muss mindestens 6 Zeichen haben");

    return;
  }

  if(password !== passwordRepeat){

    alert("Die Passw\u00f6rter stimmen nicht \u00fcberein");

    return;
  }

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){

    alert("Du bist nicht eingeloggt");

    window.location.href =
    "v2-login.html";

    return;
  }

  const { error } =
  await supabaseClient.auth.updateUser({
    password:password
  });

  if(error){

    alert("Passwort konnte nicht ge\u00e4ndert werden");

    console.error(error);

    return;
  }

  alert("Passwort wurde ge\u00e4ndert");

  window.location.href =
  "v2-dashboard.html";
}