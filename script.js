const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";
const SUPABASE_KEY = "HIER_DEIN_PUBLISHABLE_KEY";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function filterCards() {

    const activeButton =
        document.querySelector(".filter-bar button.active-filter");

    const filter =
        activeButton ? activeButton.dataset.filter : "all";

    const search =
        document.getElementById("searchInput")
        ?.value
        .toLowerCase()
        .trim() || "";

    document.querySelectorAll(".card").forEach(card => {

        const category = card.dataset.category;

        const name =
            card.querySelector("h3")
            .innerText
            .toLowerCase();

        const matchesFilter =
            filter === "all" || category === filter;

        const matchesSearch =
            name.includes(search);

        card.style.display =
            matchesFilter && matchesSearch
            ? "block"
            : "none";
    });
}

function setupFilter() {

    const buttons =
        document.querySelectorAll(".filter-bar button");

    const searchInput =
        document.getElementById("searchInput");

    buttons.forEach(button => {

        button.addEventListener("click", () => {

            buttons.forEach(btn =>
                btn.classList.remove("active-filter")
            );

            button.classList.add("active-filter");

            filterCards();
        });
    });

    if (searchInput) {

        searchInput.addEventListener("input", filterCards);
    }
}

function shuffleCards() {

    const grid =
        document.getElementById("businessGrid");

    if (!grid) return;

    const cards =
        Array.from(grid.querySelectorAll(".card"));

    const offene = [];
    const geschlossene = [];

    cards.forEach(card => {

        const status =
            card.querySelector(".status");

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

    const { data, error } =
        await supabaseClient
            .from("businesses")
            .select("*");

    if (error) {

        console.error("Supabase Fehler:", error);

        return;
    }

    const taxiOnline = data.some(b =>

        b.name.toLowerCase() === "los santos taxi" &&
        b.open === true
    );

    document.querySelectorAll(".card").forEach(card => {

        const title =
            card.querySelector("h3")
            .innerText
            .trim()
            .toLowerCase();

        const business =
            data.find(b =>
                b.name.toLowerCase() === title
            );

        if (!business) return;

        const status =
            card.querySelector(".status");

        const delivery =
            card.querySelector(".delivery");

        const buttons =
            card.querySelectorAll(".buttons a");

        /*
        ========================
        STATUS
        ========================
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
        ========================
        LIEFERUNG
        ========================
        */

        if (delivery) {

            const deliveryActive =

                business.open === true &&

                (

                    business.delivery === true ||

                    (

                        taxiOnline &&

                        business.category &&

                        business.category
                            .toLowerCase() === "food"
                    )
                );

            if (deliveryActive) {

                delivery.innerText =
                    "Lieferung aktiv";

                delivery.classList.remove("no");
                delivery.classList.add("yes");

            } else {

                delivery.innerText =
                    "Keine Lieferung";

                delivery.classList.remove("yes");
                delivery.classList.add("no");
            }
        }

        /*
        ========================
        WEBSITE BUTTON
        ========================
        */

        if (buttons[0]) {

            if (
                business.website &&
                business.website.trim() !== ""
            ) {

                buttons[0].style.display = "block";

                buttons[0].href =
                    business.website;

                buttons[0].target = "_blank";

            } else {

                buttons[0].style.display = "none";
            }
        }

        /*
        ========================
        DISCORD BUTTON
        ========================
        */

        if (buttons[1]) {

            if (
                business.discord &&
                business.discord.trim() !== ""
            ) {

                buttons[1].style.display = "block";

                buttons[1].href =
                    business.discord;

                buttons[1].target = "_blank";

            } else {

                buttons[1].style.display = "none";
            }
        }
    });

    shuffleCards();

    filterCards();
}

/*
========================
START
========================
*/

shuffleCards();

setupFilter();

ladeDaten();

/*
300000 ms = 5 Minuten
*/

setInterval(ladeDaten, 300000);