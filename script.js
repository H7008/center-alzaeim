
let games = [];
let selectedGames = [];
let activeCategory = "all";
let currentSlide = 0;

// توحيد أسماء الأجهزة
function normalizePlatform(value) {
  const platform = String(value || "")
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/-/g, "");

  if (["ps2", "playstation2", "بلي2", "بلاي2"].includes(platform)) {
    return "ps2";
  }

  if (["ps4", "playstation4", "بلي4", "بلاي4"].includes(platform)) {
    return "ps4";
  }

  if (["ps5", "playstation5", "بلي5", "بلاي5"].includes(platform)) {
    return "ps5";
  }

  return platform;
}

// تحميل البنرات الثلاثة من Supabase
function loadBanners() {
  if (!window.supabaseClient) {
    console.error("Supabase غير متصل، تعذر تحميل البنرات");
    return;
  }

  const slides = document.querySelectorAll(".slider-images .slide");

  slides.forEach((slide, index) => {
    const number = index + 1;

    const { data } = window.supabaseClient.storage
      .from("game-images")
      .getPublicUrl("banners/banner" + number + ".jpg");

    slide.src = data.publicUrl + "?v=" + Date.now();
  });
}

// تحميل الألعاب من Supabase
async function loadGames() {
  const grid = document.getElementById("gamesGrid");

  try {
    if (!window.supabaseClient) {
      throw new Error("Supabase غير متصل");
    }

    if (grid) grid.textContent = "جاري تحميل الألعاب...";

    const { data, error } = await window.supabaseClient
      .from("games")
      .select("id, name, platform, image_url, created_at");

    if (error) throw error;

    games = (data || []).map((game, index) => ({
      id: String(game.id || index + 1),
      name: game.name || "بدون اسم",
      platform: normalizePlatform(game.platform),
      image: game.image_url || "",
      createdAt: game.created_at
    }));

    console.log("عدد الألعاب:", games.length);
    console.log("تصنيفات الألعاب:", games.map(g => g.platform));

    searchGames();
    updateCart();

  } catch (error) {
    console.error("خطأ تحميل الألعاب:", error);
    if (grid) grid.textContent = "تعذر تحميل الألعاب";
  }
}

// عرض الألعاب
function displayGames(list) {
  const grid = document.getElementById("gamesGrid");
  if (!grid) return;

  grid.innerHTML = "";

  const count = document.getElementById("gameCount");
  if (count) count.textContent = list.length + " لعبة";

  if (!list.length) {
    grid.textContent = "ماكو ألعاب تطابق البحث.";
    return;
  }

  list.forEach(game => {
    const card = document.createElement("div");
    card.className = "game-card";

    const cover = document.createElement("div");
    cover.className = "game-cover";

    const img = document.createElement("img");
    img.src = game.image;
    img.alt = game.name;
    img.loading = "lazy";
    img.style.width = "100%";
    img.style.height = "100%";
    img.style.objectFit = "contain";
    img.style.background = "#101522";

    cover.appendChild(img);

    const info = document.createElement("div");
    info.className = "game-info";

    const title = document.createElement("h3");
    title.textContent = game.name;

    const details = document.createElement("p");
    details.textContent = "رقم اللعبة: " + game.id;

    const button = document.createElement("button");
    const isSelected = selectedGames.some(g => g.id === game.id);

    button.textContent = isSelected
      ? "تم الاختيار ✓"
      : "＋ إضافة للقائمة";

    button.className = isSelected ? "selected-btn" : "add-btn";
    button.onclick = () => toggleGame(game.id);

    info.append(title, details, button);
    card.append(cover, info);
    grid.appendChild(card);
  });
}

// إضافة أو إزالة لعبة من القائمة
function toggleGame(id) {
  const game = games.find(g => g.id === id);
  if (!game) return;

  if (selectedGames.some(g => g.id === id)) {
    selectedGames = selectedGames.filter(g => g.id !== id);
  } else {
    selectedGames.push(game);
  }

  updateCart();
  searchGames();
}

// تحديث عدد الألعاب المختارة
function updateCart() {
  const count = document.getElementById("cartCount");
  if (count) count.textContent = selectedGames.length;
}

// البحث والتصفية والترتيب
function searchGames() {
  const input = document.getElementById("searchInput");
  const query = input ? input.value.trim().toLowerCase() : "";

  let filtered = games.filter(game =>
    game.name.toLowerCase().includes(query) ||
    game.id.includes(query)
  );

  if (activeCategory !== "all") {
    filtered = filtered.filter(game =>
      game.platform === normalizePlatform(activeCategory)
    );
  }

  // ترتيب الألعاب حسب تاريخ الإضافة
  const sortSelect = document.getElementById("sortGames");
  const sortOrder = sortSelect ? sortSelect.value : "newest";

  filtered.sort((a, b) => {
    const dateA = new Date(a.createdAt || 0).getTime();
    const dateB = new Date(b.createdAt || 0).getTime();

    return sortOrder === "oldest"
      ? dateA - dateB
      : dateB - dateA;
  });

  displayGames(filtered);
}

// تصفية الألعاب حسب المنصة
function filterGames(category, button) {
  activeCategory = category;

  document.querySelectorAll(".categories button").forEach(btn => {
    btn.classList.remove("active");
  });

  if (button) button.classList.add("active");

  searchGames();
}

// إرسال القائمة إلى واتساب
function sendWhatsApp() {
  if (!selectedGames.length) {
    alert("اختار لعبة واحدة على الأقل");
    return;
  }

  let message = "السلام عليكم، هاي الألعاب اللي اخترتها من مركز الزعيم:\n\n";

  selectedGames.forEach(game => {
    message += "🎮 " + game.name + " | رقم: " + game.id + "\n";
  });

  window.open(
    "https://wa.me/9647888721000?text=" + encodeURIComponent(message),
    "_blank"
  );
}

// القائمة الجانبية
function toggleMenu() {
  const categories = document.getElementById("categories");
  if (categories) categories.classList.toggle("show-menu");
}

// البنرات
function showSlide(index) {
  const slides = document.querySelectorAll(".slide");
  if (!slides.length) return;

  slides.forEach(slide => slide.classList.remove("active"));

  currentSlide = (index + slides.length) % slides.length;
  slides[currentSlide].classList.add("active");
}

function moveSlide(direction) {
  showSlide(currentSlide + direction);
}

// تشغيل الموقع
function startWebsite() {
  loadBanners();
  loadGames();

  const searchInput = document.getElementById("searchInput");
  if (searchInput) {
    searchInput.addEventListener("input", searchGames);
  }

  const slides = document.querySelectorAll(".slide");

  if (slides.length) {
    showSlide(0);
    setInterval(() => moveSlide(1), 5000);
  }
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", startWebsite);
} else {
  startWebsite();
}
