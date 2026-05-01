const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
  SUPABASE_URL,
  SUPABASE_KEY
);

const SUPER_OWNER_CODE = "SUPEROWNER2026";

function login(){

  const code = document
    .getElementById("superCodeInput")
    .value
    .trim()
    .toUpperCase();

  if(code !== SUPER_OWNER_CODE){

    alert("Falscher SuperOwner-Code");

    return;
  }

  document
    .getElementById("loginBox")
    .classList
    .add("hidden");

  document
    .getElementById("panelBox")
    .classList
    .remove("hidden");

  loadComments();
}

async function loadComments(){

  const { data, error } =
    await supabaseClient
      .from("comments")
      .select(`
        id,
        author,
        message,
        rating,
        owner_reply,
        created_at,
        businesses (
          name
        )
      `)
      .order("created_at", {
        ascending:false
      });

  if(error){

    alert("Kommentare konnten nicht geladen werden");

    console.error(error);

    return;
  }

  const list =
    document.getElementById("commentsList");

  list.innerHTML = "";

  if(!data || data.length === 0){

    list.innerHTML =
      "<p>Noch keine Kommentare vorhanden.</p>";

    return;
  }

  data.forEach(comment => {

    const div =
      document.createElement("div");

    div.className = "comment";

    const firma =
      comment.businesses?.name ||
      "Unbekannte Firma";

    const datum =
      new Date(comment.created_at)
        .toLocaleString("de-DE");

    div.innerHTML = `
      <div class="business">
        Firma: ${escapeHtml(firma)}
      </div>

      <div class="meta">
        Von: ${escapeHtml(comment.author)}
        · ${datum}
      </div>

      <div class="comment-rating">
        ${renderStars(Number(comment.rating || 0))}
      </div>

      <p>
        ${escapeHtml(comment.message)}
      </p>

      ${
        comment.owner_reply
        ? `
          <div class="reply">

            <strong>
              Antwort vom Unternehmen:
            </strong>

            <p>
              ${escapeHtml(comment.owner_reply)}
            </p>

          </div>
        `
        : ""
      }

      <button
        class="red"
        onclick="deleteComment(${comment.id})"
      >
        Kommentar löschen
      </button>
    `;

    list.appendChild(div);

  });

}

async function deleteComment(commentId){

  if(!confirm("Kommentar wirklich löschen?")){
    return;
  }

  const { error } =
    await supabaseClient
      .from("comments")
      .delete()
      .eq("id", commentId);

  if(error){

    alert("Kommentar konnte nicht gelöscht werden");

    console.error(error);

    return;
  }

  loadComments();
}

function logout(){

  document
    .getElementById("superCodeInput")
    .value = "";

  document
    .getElementById("panelBox")
    .classList
    .add("hidden");

  document
    .getElementById("loginBox")
    .classList
    .remove("hidden");
}

function renderStars(rating){

  const safeRating = Math.max(0, Math.min(5, Number(rating || 0)));

  return "?".repeat(safeRating);
}

function escapeHtml(text){

  return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}