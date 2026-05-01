const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";
const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

let businessesData = [];
let commentsData = [];
let activeBusiness = null;

function filterCards() {
    const activeButton = document.querySelector(".filter-bar button.active-filter");
    const filter = activeButton ? activeButton.dataset.filter : "all";
    const search = document.getElementById("searchInput")?.value.toLowerCase().trim() || "";

    document.querySelectorAll(".card").forEach(card => {
        const category = card.dataset.category;
        const name = card.querySelector("h3").innerText.toLowerCase();

        const matchesFilter = filter === "all" || category === filter;
        const matchesSearch = name.includes(search);

        card.style.display = matchesFilter && matchesSearch ? "block" : "none";
    });
}

function setupFilter() {
    const buttons = document.querySelectorAll(".filter-bar button");
    const searchInput = document.getElementById("searchInput");

    buttons.forEach(button => {
        button.addEventListener("click", () => {
            buttons.forEach(btn => btn.classList.remove("active-filter"));
            button.classList.add("active-filter");
            filterCards();
        });
    });

    if (searchInput) {
        searchInput.addEventListener("input", filterCards);
    }
}

function shuffleCards() {
    const grid = document.getElementById("businessGrid");
    if (!grid) return;

    const cards = Array.from(grid.querySelectorAll(".card"));
    const offene = [];
    const geschlossene = [];

    cards.forEach(card => {
        const status = card.querySelector(".status");

        if (status.classList.contains("open")) {
            offene.push(card);
        } else {
            geschlossene.push(card);
        }
    });

    offene.sort(() => Math.random() - 0.5);
    geschlossene.sort(() => Math.random() - 0.5);

    [...offene, ...geschlossene].forEach(card => {
        grid.appendChild(card);
    });
}

async function ladeDaten() {
    const { data, error } = await supabaseClient
        .from("businesses")
        .select("*");

    if (error) {
        console.error("Supabase Fehler:", error);
        return;
    }

    businessesData = data;

    const taxiOnline = data.some(b =>
        b.name.toLowerCase() === "los santos taxi" &&
        b.open === true
    );

    document.querySelectorAll(".card").forEach(card => {
        const title = card.querySelector("h3").innerText.trim().toLowerCase();

        const business = data.find(b =>
            b.name.toLowerCase() === title
        );

        if (!business) return;

        const status = card.querySelector(".status");
        const delivery = card.querySelector(".delivery");
        const buttons = card.querySelectorAll(".buttons a");
        const info = card.querySelector(".image-info");
        const plzText = card.querySelector(".plz-text");

        if (business.open === true) {
            status.innerText = "Offen";
            status.classList.remove("closed");
            status.classList.add("open");
        } else {
            status.innerText = "Geschlossen";
            status.classList.remove("open");
            status.classList.add("closed");
        }

        if (delivery) {
            const deliveryActive =
                business.open === true &&
                (
                    business.delivery === true ||
                    (
                        taxiOnline &&
                        business.category &&
                        business.category.toLowerCase() === "food"
                    )
                );

            if (deliveryActive) {
                delivery.innerText = "Lieferung aktiv";
                delivery.classList.remove("no");
                delivery.classList.add("yes");
            } else {
                delivery.innerText = "Keine Lieferung";
                delivery.classList.remove("yes");
                delivery.classList.add("no");
            }
        }

        if (info) {
            info.innerText = business.description || "Keine Beschreibung vorhanden.";
        }

        if (plzText) {
            plzText.innerText = business.plz ? "PLZ: " + business.plz : "";
        }

        if (buttons[0]) {
            if (business.website && business.website.trim() !== "") {
                buttons[0].style.display = "block";
                buttons[0].href = business.website;
                buttons[0].target = "_blank";
            } else {
                buttons[0].style.display = "none";
            }
        }

        if (buttons[1]) {
            if (business.discord && business.discord.trim() !== "") {
                buttons[1].style.display = "block";
                buttons[1].href = business.discord;
                buttons[1].target = "_blank";
            } else {
                buttons[1].style.display = "none";
            }
        }
    });

    shuffleCards();
    filterCards();
}

async function openComments(businessName) {
    activeBusiness = businessesData.find(b => b.name === businessName);

    if (!activeBusiness) {
        alert("Unternehmen nicht gefunden");
        return;
    }

    document.getElementById("modalBusinessName").innerText =
        "Kommentare zu " + activeBusiness.name;

    document.getElementById("commentModal").classList.remove("hidden");

    await loadComments();
}

function closeComments() {
    document.getElementById("commentModal").classList.add("hidden");
    activeBusiness = null;
}

async function loadComments() {
    if (!activeBusiness) return;

    const { data, error } = await supabaseClient
        .from("comments")
        .select("*")
        .eq("business_id", activeBusiness.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error(error);
        return;
    }

    commentsData = data;

    const list = document.getElementById("commentsList");
    list.innerHTML = "";

    if (data.length === 0) {
        list.innerHTML = "<p>Noch keine Kommentare.</p>";
        return;
    }

    data.forEach(comment => {
        const div = document.createElement("div");
        div.className = "comment-item";

        div.innerHTML = `
            <strong>${escapeHtml(comment.author)}</strong>
            <p>${escapeHtml(comment.message)}</p>
            ${
                comment.owner_reply
                ? `<div class="owner-reply"><strong>Antwort:</strong><br>${escapeHtml(comment.owner_reply)}</div>`
                : ""
            }
        `;

        list.appendChild(div);
    });
}

async function sendComment() {
    if (!activeBusiness) return;

    const author = document.getElementById("commentAuthor").value.trim();
    const message = document.getElementById("commentMessage").value.trim();

    if (!author || !message) {
        alert("Bitte Name und Kommentar eintragen");
        return;
    }

    const { error } = await supabaseClient
        .from("comments")
        .insert({
            business_id: activeBusiness.id,
            author: author,
            message: message
        });

    if (error) {
        alert("Kommentar konnte nicht gespeichert werden");
        console.error(error);
        return;
    }

    document.getElementById("commentMessage").value = "";
    await loadComments();
}

function escapeHtml(text) {
    return String(text || "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

shuffleCards();
setupFilter();
ladeDaten();

setInterval(ladeDaten, 300000);