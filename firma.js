const SUPABASE_URL =
"https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY =
"sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient =
supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params =
new URLSearchParams(window.location.search);

const businessId =
params.get("id");

let activeBusiness = null;

let selectedRating = 0;

document.addEventListener(
"DOMContentLoaded",
() => {

    setupRating();

    ladeFirma();

});

function setupRating(){

    const stars =
    document.querySelectorAll(".star");

    updateStars(selectedRating);

    stars.forEach(star => {

        star.addEventListener(
        "click",
        () => {

            selectedRating =
            Number(star.dataset.value);

            updateStars(selectedRating);

        });

    });

}

function updateStars(rating){

    const stars =
    document.querySelectorAll(".star");

    stars.forEach(star => {

        const value =
        Number(star.dataset.value);

        if(value <= rating){

            star.classList.add("active");

            star.innerHTML = "&#9733;";

        }else{

            star.classList.remove("active");

            star.innerHTML = "&#9734;";
        }

    });

}

async function ladeFirma(){

    const { data, error } =
    await supabaseClient
        .from("businesses")
        .select("*")
        .eq("id", businessId)
        .single();

    if(error || !data){

        document.body.innerHTML =
        "<h1>Firma nicht gefunden</h1>";

        return;
    }

    activeBusiness = data;

    document.title = data.name;

    document.getElementById("firmaName")
    .innerText = data.name;

    document.getElementById("firmaDescription")
    .innerText =
    data.description ||
    "Keine Beschreibung vorhanden.";

    document.getElementById("firmaPlz")
    .innerText =
    data.plz
    ? "PLZ: " + data.plz
    : "";

    document.getElementById("firmaImage")
    .src =
    "bilder/" + getImageName(data.name);

    const status =
    document.getElementById("firmaStatus");

    if(data.open){

        status.innerText = "Offen";

        status.classList.remove("closed");

        status.classList.add("open");

    }else{

        status.innerText = "Geschlossen";

        status.classList.remove("open");

        status.classList.add("closed");
    }

    const delivery =
    document.getElementById("firmaDelivery");

    if(data.category &&
       data.category.toLowerCase() === "food"){

        if(data.delivery){

            delivery.innerText =
            "Lieferung aktiv";

            delivery.classList.remove("no");

            delivery.classList.add("yes");

        }else{

            delivery.innerText =
            "Keine Lieferung";

            delivery.classList.remove("yes");

            delivery.classList.add("no");
        }

    }else{

        delivery.style.display = "none";
    }

    const websiteBtn =
    document.getElementById("websiteBtn");

    const discordBtn =
    document.getElementById("discordBtn");

    if(data.website &&
       data.website.trim() !== ""){

        websiteBtn.href =
        data.website;

        websiteBtn.style.display =
        "block";

    }else{

        websiteBtn.style.display =
        "none";
    }

    if(data.discord &&
       data.discord.trim() !== ""){

        discordBtn.href =
        data.discord;

        discordBtn.style.display =
        "block";

    }else{

        discordBtn.style.display =
        "none";
    }

    ladeKommentare();

}

function getImageName(name){

    const map = {

        "Burger Shot":"burgershot.png",
        "Hookies":"hookies.png",
        "Pearls":"pearls.png",
        "LSMD":"lsmd.png",
        "LSPD":"lspd.png",
        "Bennys":"bennys.png",
        "Smokey's Weed Shop":"smokeys.png",
        "Balkan Recordzz":"balkan-recordzz.png",
        "Los Santos Taxi":"taxi.png",
        "Blackline Tuning":"blackline.png",
        "Adler & Partner":"adler-partner.png"

    };

    return map[name] || "default.png";

}

async function ladeKommentare(){

    const { data, error } =
    await supabaseClient
        .from("comments")
        .select("*")
        .eq("business_id", businessId)
        .order("created_at", {
            ascending:false
        });

    if(error){

        console.error(error);

        return;
    }

    const list =
    document.getElementById("commentsList");

    const averageBox =
    document.getElementById("averageRating");

    list.innerHTML = "";

    if(!data || data.length === 0){

        averageBox.innerHTML = "";

        list.innerHTML =
        "<p>Noch keine Kommentare.</p>";

        return;
    }

    const ratings = data
    .map(comment =>
        Number(comment.rating || 0)
    )
    .filter(rating =>
        rating > 0
    );

    if(ratings.length > 0){

        const average =
        ratings.reduce(
            (sum, rating) =>
            sum + rating,
            0
        ) / ratings.length;

        averageBox.innerHTML = `
            <div class="average-rating">

                ${renderStars(
                    Math.round(average)
                )}

                <span>

                    ${average.toFixed(1)} / 5

                    bei ${ratings.length}
                    Bewertungen

                </span>

            </div>
        `;

    }else{

        averageBox.innerHTML = "";
    }

    data.forEach(comment => {

        const div =
        document.createElement("div");

        div.className = "comment";

        div.innerHTML = `
            <strong>

                ${escapeHtml(comment.author)}

            </strong>

            <div class="comment-rating">

                ${renderStars(
                    Number(comment.rating || 0)
                )}

            </div>

            <p>

                ${escapeHtml(comment.message)}

            </p>

            ${
                comment.owner_reply
                ? `
                <div class="owner-reply">

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
        `;

        list.appendChild(div);

    });

}

async function sendComment(){

    const author =
    document.getElementById("commentAuthor")
    .value
    .trim();

    const message =
    document.getElementById("commentMessage")
    .value
    .trim();

    if(selectedRating < 1){

        alert(
        "Bitte mindestens 1 Stern auswählen"
        );

        return;
    }

    if(!author || !message){

        alert(
        "Bitte Name und Kommentar ausf&uuml;llen"
        );

        return;
    }

    const { error } =
    await supabaseClient
        .from("comments")
        .insert({

            business_id: businessId,

            author: author,

            message: message,

            rating: selectedRating

        });

    if(error){

        alert(
        "Kommentar konnte nicht gespeichert werden"
        );

        console.error(error);

        return;
    }

    document.getElementById("commentMessage")
    .value = "";

    selectedRating = 0;

    updateStars(selectedRating);

    ladeKommentare();

}

function renderStars(rating){

    const safeRating =
    Math.max(
        0,
        Math.min(
            5,
            Number(rating || 0)
        )
    );

    return "&#9733;".repeat(safeRating);

}

function escapeHtml(text){

    return String(text || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}