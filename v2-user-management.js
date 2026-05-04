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
let currentRoles = [];

async function checkUserManagementAccess(){

  const { data } =
  await supabaseClient.auth.getUser();

  if(!data.user){

    window.location.href =
    "v2-login.html";

    return;
  }

  currentUser =
  data.user;

  const { data: roles } =
  await supabaseClient
  .from("user_roles")
  .select("*")
  .eq("user_id", currentUser.id);

  currentRoles =
  roles
  ? roles.map(role => role.role_name)
  : [];

  if(
    !currentRoles.includes("guide") &&
    !currentRoles.includes("superadmin")
  ){

    alert("Keine Berechtigung");

    window.location.href =
    "v2-dashboard.html";

    return;
  }

  document
  .getElementById("userSearch")
  .addEventListener(
    "input",
    loadUsers
  );

  await loadUsers();
}

async function loadUsers(){

  const search =
  document
  .getElementById("userSearch")
  .value
  .trim()
  .toLowerCase();

  const { data, error } =
  await supabaseClient
  .from("profiles")
  .select("*")
  .order("display_name");

  if(error){

    console.error(error);

    return;
  }

  const pendingBox =
  document.getElementById("pendingUsers");

  const approvedBox =
  document.getElementById("approvedUsers");

  const blockedBox =
  document.getElementById("blockedUsers");

  pendingBox.innerHTML = "";
  approvedBox.innerHTML = "";
  blockedBox.innerHTML = "";

  const filtered =
  (data || []).filter(profile => {

    const text =
    (
      (profile.display_name || "") +
      " " +
      (profile.login_name || "")
    ).toLowerCase();

    return text.includes(search);
  });

  for(const profile of filtered){

    const roles =
    await loadUserRoles(profile.user_id);

    const card =
    createUserCard(profile, roles);

    if(profile.blocked){

      blockedBox.appendChild(card);

    }else if(!profile.approved){

      pendingBox.appendChild(card);

    }else{

      approvedBox.appendChild(card);
    }
  }

  fillEmpty(
    pendingBox,
    "Keine wartenden User"
  );

  fillEmpty(
    approvedBox,
    "Keine freigeschalteten User"
  );

  fillEmpty(
    blockedBox,
    "Keine gesperrten User"
  );
}

function fillEmpty(container, text){

  if(container.children.length === 0){

    container.innerHTML =
    `<p class="muted">${text}</p>`;
  }
}

async function loadUserRoles(userId){

  const { data } =
  await supabaseClient
  .from("user_roles")
  .select("*")
  .eq("user_id", userId);

  return data || [];
}

function createUserCard(profile, roles){

  const div =
  document.createElement("div");

  div.className =
  "usermgmt-user";

  const roleText =
  roles.length > 0
  ? roles.map(role =>
      role.role_name
    ).join(", ")
  : "Keine Rollen";

  div.innerHTML = `
    <strong>
      ${escapeHtml(profile.display_name)}
    </strong>

    <p>
      Login:
      ${escapeHtml(profile.login_name)}
    </p>

    <p>
      Rollen:
      ${escapeHtml(roleText)}
    </p>

    <div class="usermgmt-actions">

      ${
        !profile.approved
        ? `
          <button onclick="approveUser('${profile.user_id}')">
            Freischalten
          </button>
        `
        : ""
      }

      ${
        !profile.blocked
        ? `
          <button
            class="danger-btn"
            onclick="blockUser('${profile.user_id}')"
          >
            Sperren
          </button>
        `
        : ""
      }

      ${
        profile.blocked &&
        currentRoles.includes("superadmin")
        ? `
          <button onclick="unblockUser('${profile.user_id}')">
            Entsperren
          </button>
        `
        : ""
      }

      ${
        currentRoles.includes("superadmin")
        ? `
          <button
            class="owner-gray-btn"
            onclick="openRoleModal('${profile.user_id}')"
          >
            Rollen
          </button>

          <button
            class="owner-gray-btn"
            onclick="resetPassword('${profile.user_id}')"
          >
            Passwort reset
          </button>

          <button
            class="danger-btn"
            onclick="deleteUser('${profile.user_id}')"
          >
            User l&ouml;schen
          </button>
        `
        : ""
      }

    </div>
  `;

  return div;
}

async function approveUser(userId){

  const { error } =
  await supabaseClient
  .from("profiles")
  .update({
    approved:true
  })
  .eq("user_id", userId);

  if(error){

    alert("User konnte nicht freigeschaltet werden");

    console.error(error);

    return;
  }

  await loadUsers();
}

async function blockUser(userId){

  const { error } =
  await supabaseClient
  .from("profiles")
  .update({
    blocked:true
  })
  .eq("user_id", userId);

  if(error){

    alert("User konnte nicht gesperrt werden");

    console.error(error);

    return;
  }

  await loadUsers();
}

async function unblockUser(userId){

  const { error } =
  await supabaseClient
  .from("profiles")
  .update({
    blocked:false
  })
  .eq("user_id", userId);

  if(error){

    alert("User konnte nicht entsperrt werden");

    console.error(error);

    return;
  }

  await loadUsers();
}

async function openRoleModal(userId){

  const role =
  prompt(
    "Neue Rolle eingeben:\n\nsuperadmin\nguide"
  );

  if(!role){
    return;
  }

  const cleanRole =
  role.trim().toLowerCase();

  if(
    cleanRole !== "superadmin" &&
    cleanRole !== "guide"
  ){

    alert("Ungültige Rolle");

    return;
  }

  const { data: existing } =
  await supabaseClient
  .from("user_roles")
  .select("*")
  .eq("user_id", userId)
  .eq("role_name", cleanRole)
  .maybeSingle();

  if(existing){

    const remove =
    confirm(
      "Rolle existiert bereits.\nEntfernen?"
    );

    if(remove){

      const { error } =
      await supabaseClient
      .from("user_roles")
      .delete()
      .eq("id", existing.id);

      if(error){

        alert("Rolle konnte nicht entfernt werden");

        console.error(error);

        return;
      }

      alert("Rolle entfernt");
    }

  }else{

    await supabaseClient
    .from("user_roles")
    .insert({
      user_id:userId,
      role_name:cleanRole
    });
  }

  await loadUsers();
}

async function resetPassword(userId){

  const newPassword =
  prompt(
    "Neues Passwort eingeben:"
  );

  if(!newPassword){
    return;
  }

  if(newPassword.length < 6){

    alert(
      "Passwort muss mindestens 6 Zeichen haben"
    );

    return;
  }

  const {
    data: sessionData
  } =
  await supabaseClient.auth.getSession();

  const accessToken =
  sessionData?.session?.access_token;

  if(!accessToken){

    alert("Nicht eingeloggt");

    return;
  }

  const response =
  await fetch(
    "https://eulfqqkxqxjgszqdffhy.functions.supabase.co/reset-user-password",
    {
      method:"POST",

      headers:{
        "Content-Type":"application/json",
        "Authorization":"Bearer " + accessToken
      },

      body:JSON.stringify({
        user_id:userId,
        new_password:newPassword
      })
    }
  );

  const result =
  await response.json();

  if(!response.ok){

    alert(
      result.error ||
      "Passwort konnte nicht geändert werden"
    );

    console.error(result);

    return;
  }

  alert("Passwort wurde geändert");
}

async function deleteUser(userId){

  const confirmDelete =
  confirm(
    "User wirklich komplett löschen?\n\nDas entfernt:\n- Bewerbungen\n- Nachrichten\n- Rollen\n- Profil\n\nWichtig: Der Login-Account in Supabase Auth bleibt bestehen, falls keine Edge Function genutzt wird.\n\nDieser Vorgang kann NICHT rückgängig gemacht werden."
  );

  if(!confirmDelete){
    return;
  }

  const deleteSteps = [
    {
      table:"application_messages",
      column:"sender_user_id",
      label:"Nachrichten"
    },
    {
      table:"applications",
      column:"user_id",
      label:"Bewerbungen"
    },
    {
      table:"user_roles",
      column:"user_id",
      label:"Rollen"
    },
    {
      table:"profiles",
      column:"user_id",
      label:"Profil"
    }
  ];

  for(const step of deleteSteps){

    const { error } =
    await supabaseClient
    .from(step.table)
    .delete()
    .eq(step.column, userId);

    if(error){

      console.error(
        "Fehler beim Löschen:",
        step.label,
        error
      );

      alert(
        step.label +
        " konnten nicht gelöscht werden.\n\nFehler:\n" +
        error.message
      );

      return;
    }
  }

  alert("User wurde aus der Userverwaltung gelöscht");

  await loadUsers();
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