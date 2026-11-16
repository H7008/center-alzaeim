let games = [];
let names = {};
let currentPage = 1;
const pageSize = 30;

async function loadAdmin() {
  const status = document.getElementById("status");

  try {
    const imagesResponse = await fetch("./images-list.json");

    if (!imagesResponse.ok) {
      throw new Error("لم يتم العثور على images-list.json");
    }

    const files = await imagesResponse.json();

    const namesResponse = await fetch("./games.json");

    if (!namesResponse.ok) {
      throw new Error("لم يتم العثور على games.json");
    }

    names = await namesResponse.json();

    games = files.map((file, index) => {
      const data = names[file];

      return {
        id: String(index + 1).padStart(3, "0"),
        filename: file,
        name: typeof data === "string"
          ? data
          : data?.name || "",
        platform: typeof data === "object" && data !== null
          ? data.platform || ""
          : ""
      };
    });

    createTools();
    displayGames();

  } catch (error) {
    console.error("Admin Error:", error);
    status.textContent = "خطأ في تحميل الألعاب: " + error.message;
  }
}

function createTools() {
  const toolbar = document.querySelector(".toolbar");

  const saveButton = document.createElement("button");
  saveButton.textContent = "حفظ ملف الألعاب";
  saveButton.style.background = "#d6a735";
  saveButton.style.color = "#111";
  saveButton.style.cursor = "pointer";
  saveButton.onclick = saveGames;

  const previousButton = document.createElement("button");
  previousButton.textContent = "السابق";
  previousButton.onclick = () => {
    if (currentPage > 1) {
      currentPage--;
      displayGames();
    }
  };

  const nextButton = document.createElement("button");
  nextButton.textContent = "التالي";
  nextButton.onclick = () => {
    const total = Math.ceil(getFilteredGames().length / pageSize);
    if (currentPage < total) {
      currentPage++;
      displayGames();
    }
  };

  const pageInfo = document.createElement("span");
  pageInfo.id = "pageInfo";
  pageInfo.style.alignSelf = "center";

  toolbar.append(saveButton, previousButton, nextButton, pageInfo);

  document.getElementById("search").addEventListener("input", () => {
    currentPage = 1;
    displayGames();
  });
}

function getFilteredGames() {
  const query = document.getElementById("search").value
    .trim()
    .toLowerCase();

  return games.filter(game =>
    game.name.toLowerCase().includes(query) ||
    game.id.includes(query) ||
    game.filename.toLowerCase().includes(query)
  );
}

function displayGames() {
  const container = document.getElementById("games");
  const filtered = getFilteredGames();

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  if (currentPage > totalPages) {
    currentPage = totalPages;
  }

  const start = (currentPage - 1) * pageSize;
  const pageGames = filtered.slice(start, start + pageSize);

  document.getElementById("pageInfo").textContent =
    "صفحة " + currentPage + " من " + totalPages;

  document.getElementById("status").textContent =
    "إجمالي الألعاب: " + games.length +
    " | نتائج البحث: " + filtered.length;

  container.innerHTML = "";

  pageGames.forEach(game => {
    const card = document.createElement("div");
    card.className = "game";

    const img = document.createElement("img");
    img.src = "./images/" + game.filename;
    img.alt = game.name;

    const number = document.createElement("p");
    number.textContent = "رقم اللعبة: " + game.id;

    const nameInput = document.createElement("input");
    nameInput.placeholder = "اكتب اسم اللعبة";
    nameInput.value = game.name;

    nameInput.addEventListener("input", () => {
      game.name = nameInput.value;
    });

    const platform = document.createElement("select");

    const options = [
      ["", "اختر الجهاز"],
      ["ps2", "PS2"],
      ["ps4", "PS4"],
      ["ps5", "PS5"]
    ];

    options.forEach(item => {
      const option = document.createElement("option");
      option.value = item[0];
      option.textContent = item[1];
      platform.appendChild(option);
    });platform.value = game.platform;

    platform.addEventListener("change", () => {
      game.platform = platform.value;
    });

    card.append(img, number, nameInput, platform);
    container.appendChild(card);
  });
}

function saveGames() {
  games.forEach(game => {
    if (game.name.trim() || game.platform) {
      names[game.filename] = {
        name: game.name.trim(),
        platform: game.platform
      };
    } else {
      delete names[game.filename];
    }
  });

  const blob = new Blob(
    [JSON.stringify(names, null, 2)],
    { type: "application/json" }
  );

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = "games.json";
  document.body.appendChild(link);
  link.click();
  link.remove();

  setTimeout(() => URL.revokeObjectURL(url), 1000);

  alert("تم تنزيل ملف الألعاب الجديد. استبدل به games.json القديم.");
}

loadAdmin();