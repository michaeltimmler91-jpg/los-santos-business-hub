const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

const sheetID = "1TaVuu1Pi1a26yKTHAXQYmXxbmnGvSVleFsPG_tl1Gd8";
const gid = "0";

const url = `https://docs.google.com/spreadsheets/d/${sheetID}/gviz/tq?tqx=out:json&gid=${gid}`;

function shuffleCards() {
    const grid = document.getElementById("businessGrid");
    const cards = Array.from(grid.querySelectorAll(".card"));

    cards.sort(() => Math.random() - 0.5);

    cards.forEach(card => grid.appendChild(card));
}

function filterCards() {
    const activeButton = document.querySelector(".filter-bar button.active-filter");
    const filter = activeButton ? activeButton.dataset.filter : "all";
    const search = document.getElementById("searchInput").value.toLowerCase().trim();

    const cards = document.querySelectorAll(".card");

    cards.forEach(card => {
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

    searchInput.addEventListener("input", filterCards);
}

function ladeDaten() {
    fetch(url + "&cachebuster=" + Date.now())
    .then(res => res.text())
    .then(text => {

        const start = text.indexOf("{");
        const end = text.lastIndexOf("}") + 1;
        const json = JSON.parse(text.substring(start, end));

        const rows = json.table.rows;

        let taxiOnline = false;

        rows.forEach(row => {
            const unternehmen = row.c[0]?.v || "";
            const offen = row.c[1]?.v || "";

            if (
                unternehmen.toLowerCase() === "taxi" &&
                offen.toLowerCase() === "ja"
            ) {
                taxiOnline = true;
            }
        });

        rows.forEach(row => {
            const unternehmen = row.c[0]?.v || "";
            const offen = row.c[1]?.v || "";
            const lieferung = row.c[2]?.v || "";
            const website = row.c[3]?.v || "#";
            const verteiler = row.c[4]?.v || "#";

            const cards = document.querySelectorAll(".card");

            cards.forEach(card => {
                const title = card.querySelector("h3").innerText;

                if (title.toLowerCase() === unternehmen.toLowerCase()) {
                    const status = card.querySelector(".status");
                    const delivery = card.querySelector(".delivery");

                    if (offen.toLowerCase() === "ja") {
                        status.innerText = "Offen";
                        status.classList.remove("closed");
                        status.classList.add("open");
                    } else {
                        status.innerText = "Geschlossen";
                        status.classList.remove("open");
                        status.classList.add("closed");
                    }

                    if (delivery) {
                        if (
                            offen.toLowerCase() === "ja" &&
                            (
                                lieferung.toLowerCase() === "ja" ||
                                (
                                    taxiOnline &&
                                    unternehmen.toLowerCase() !== "taxi"
                                )
                            )
                        ) {
                            delivery.innerText = "Lieferung aktiv";
                            delivery.classList.remove("no");
                            delivery.classList.add("yes");
                        } else {
                            delivery.innerText = "Keine Lieferung";
                            delivery.classList.remove("yes");
                            delivery.classList.add("no");
                        }
                    }

                    const buttons = card.querySelectorAll(".buttons a");

                    if (buttons[0]) buttons[0].href = website;
                    if (buttons[1]) buttons[1].href = verteiler;
                }
            });
        });

        filterCards();
    })
    .catch(error => {
        console.log("Fehler beim Laden:", error);
    });
}

shuffleCards();
setupFilter();
ladeDaten();

setInterval(ladeDaten, 30000);