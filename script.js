const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

async function ladeDaten() {

    const { data, error } = await supabaseClient
        .from("businesses")
        .select("*");

    if (error) {
        console.error("Supabase Fehler:", error);
        return;
    }

    console.log("Supabase Daten:", data);

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

        const websiteBtn = card.querySelector(".website-btn");
        const discordBtn = card.querySelector(".discord-btn");

        /*
        =========================
        STATUS
        =========================
        */

        if (business.open === true) {

            status.innerText = "Offen";

            status.classList.remove("closed");
            status.classList.add("open");

        } else {

            status.innerText = "Geschlossen";

            status.classList.remove("open");
            status.classList.add("closed");
        }

        /*
        =========================
        LIEFERUNG
        =========================
        */

        if (delivery) {

            const lieferungMoeglich =
                business.open === true &&
                (
                    business.delivery === true ||

                    (
                        taxiOnline &&
                        business.category &&
                        business.category.toLowerCase() === "food"
                    )
                );

            if (lieferungMoeglich) {

                delivery.innerText = "Lieferung aktiv";

                delivery.classList.remove("no");
                delivery.classList.add("yes");

            } else {

                delivery.innerText = "Keine Lieferung";

                delivery.classList.remove("yes");
                delivery.classList.add("no");
            }
        }

        /*
        =========================
        WEBSITE BUTTON
        =========================
        */

        if (websiteBtn) {

            if (business.website && business.website !== "") {

                websiteBtn.style.display = "inline-block";

                websiteBtn.onclick = () => {
                    window.open(business.website, "_blank");
                };

            } else {

                websiteBtn.style.display = "none";
            }
        }

        /*
        =========================
        DISCORD BUTTON
        =========================
        */

        if (discordBtn) {

            if (business.discord && business.discord !== "") {

                discordBtn.style.display = "inline-block";

                discordBtn.onclick = () => {
                    window.open(business.discord, "_blank");
                };

            } else {

                discordBtn.style.display = "none";
            }
        }
    });

    filterCards();
}

/*
=========================
FILTER
=========================
*/

function filterCards() {

    const filter = document
        .getElementById("categoryFilter")
        ?.value?.toLowerCase() || "all";

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {

        const category = card.dataset.category?.toLowerCase();

        if (filter === "all" || category === filter) {

            card.style.display = "block";

        } else {

            card.style.display = "none";
        }
    });
}

/*
=========================
RANDOM SORT
=========================
*/

function shuffleCards() {

    const container = document.querySelector(".cards-container");

    if (!container) return;

    const cards = Array.from(container.children);

    cards.sort(() => Math.random() - 0.5);

    cards.forEach(card => {
        container.appendChild(card);
    });
}

/*
=========================
START
=========================
*/

shuffleCards();

ladeDaten();

setInterval(ladeDaten, 5000);