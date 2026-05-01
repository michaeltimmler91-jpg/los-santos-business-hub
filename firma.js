const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const params =
    new URLSearchParams(window.location.search);

const businessId =
    params.get("id");

let activeBusiness = null;

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

    document.title =
        data.name;

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

    const imageName =
        getImageName(data.name);

    document.getElementById("firmaImage")
        .src = "bilder/" + imageName;

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

    if(data.category.toLowerCase() === "food"){

        if(data.delivery){

            delivery.innerText = "Lieferung aktiv";

            delivery.classList.remove("no");
            delivery.classList.add("yes");

        }else{

            delivery.innerText = "Keine Lieferung";

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

    if(data.website){

        websiteBtn.href = data.website;

    }else{

        websiteBtn.style.display = "none";

    }

    if(data.discord){

        discordBtn.href = data.discord;

    }else{

        discordBtn.style.display = "none";

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
        "Los Santos Taxi":"taxi.png"

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

    list.innerHTML = "";

    if(data.length === 0){

        list.innerHTML =
            "<p>Noch keine Kommentare.</p>";

        return;
    }

    data.forEach(comment => {

        const div =
            document.createElement("div");

        div.className = "comment";

        div.innerHTML = `
            <strong>${escapeHtml(comment.author)}</strong>
            <p>${escapeHtml(comment.message)}</p>

            ${
                comment.owner_reply
                ? `
                <div class="owner-reply">
                    <strong>Antwort vom Unternehmen:</strong>
                    <p>${escapeHtml(comment.owner_reply)}</p>
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

    if(!author || !message){

        alert("Bitte alles ausfüllen");

        return;
    }

    const { error } =
        await supabaseClient
            .from("comments")
            .insert({

                business_id: businessId,
                author: author,
                message: message

            });

    if(error){

        alert("Kommentar konnte nicht gespeichert werden");

        console.error(error);

        return;
    }

    document.getElementById("commentMessage")
        .value = "";

    ladeKommentare();

}

function escapeHtml(text){

    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");

}

ladeFirma();