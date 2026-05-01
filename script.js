const SUPABASE_URL = "https://eulfqqkxqxjgszqdffhy.supabase.co";

const SUPABASE_KEY = "sb_publishable_c3bjfIzI3Qz959O6e_GqKg_5XrgbD11";

const supabaseClient = supabase.createClient(
    SUPABASE_URL,
    SUPABASE_KEY
);

function filterCards() {

    const activeButton = document.querySelector(".filter-bar button.active-filter");

    const filter = activeButton
        ? activeButton.dataset.filter
        : "all";

    const search =
        document.getElementById("searchInput")
        ?.value
        .toLowerCase()
        .trim() || "";

    document.querySelectorAll(".card").forEach(card => {

        const category = card.dataset.category;

        const name = card
            .querySelector("h3")
            .innerText
            .toLowerCase();

        const matchesFilter =
            filter === "all" ||
            category === filter;

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

    if(searchInput){

        searchInput.addEventListener(
            "input",
            filterCards
        );
    }
}

function shuffleCards(){

    const grid =
        document.getElementById("businessGrid");

    if(!grid) return;

    const cards =
        Array.from(grid.querySelectorAll(".card"));

    const openCards = [];
    const closedCards = [];

    cards.forEach(card => {

        const status =
            card.querySelector(".status");

        if(status.classList.contains("open")){
            openCards.push(card);
        }else{
            closedCards.push(card);
        }

    });

    openCards.sort(() => Math.random() - 0.5);
    closedCards.sort(() => Math.random() - 0.5);

    [...openCards, ...closedCards].forEach(card => {
        grid.appendChild(card);
    });

}

async function ladeDaten(){

    const { data, error } =
        await supabaseClient
            .from("businesses")
            .select("*");

    if(error){
        console.error(error);
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

        if(!business) return;

        const status =
            card.querySelector(".status");

        const delivery =
            card.querySelector(".delivery");

        const websiteBtn =
            card.querySelector(".website-btn");

        const discordBtn =
            card.querySelector(".discord-btn");

        const plzText =
            card.querySelector(".plz-text");

        if(business.open){

            status.innerText = "Offen";

            status.classList.remove("closed");
            status.classList.add("open");

        }else{

            status.innerText = "Geschlossen";

            status.classList.remove("open");
            status.classList.add("closed");

        }

        if(delivery){

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

            if(deliveryActive){

                delivery.innerText = "Lieferung aktiv";

                delivery.classList.remove("no");
                delivery.classList.add("yes");

            }else{

                delivery.innerText = "Keine Lieferung";

                delivery.classList.remove("yes");
                delivery.classList.add("no");

            }

        }

        if(plzText){

            plzText.innerText =
                business.plz
                    ? "PLZ: " + business.plz
                    : "";

        }

        if(websiteBtn){

            if(business.website){

                websiteBtn.href = business.website;
                websiteBtn.target = "_blank";
                websiteBtn.style.display = "block";

            }else{

                websiteBtn.style.display = "none";

            }

        }

        if(discordBtn){

            if(business.discord){

                discordBtn.href = business.discord;
                discordBtn.target = "_blank";
                discordBtn.style.display = "block";

            }else{

                discordBtn.style.display = "none";

            }

        }

    });

    shuffleCards();
    filterCards();

}

setupFilter();
ladeDaten();

setInterval(ladeDaten, 300000);