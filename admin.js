const client = window.supabaseClient;

let games = [];

const $ = (id) => document.getElementById(id);

function showStatus(message) {
  $("status").textContent = message;
}

function showLoginStatus(message) {
  $("loginStatus").textContent = message;
}

async function checkLogin() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    showLoginStatus(error.message);
    return;
  }

  if (data.session) {
    $("loginPanel").classList.add("hidden");
    $("adminPanel").classList.remove("hidden");
    await loadGames();
  } else {
    $("loginPanel").classList.remove("hidden");
    $("adminPanel").classList.add("hidden");
  }
}

$("loginButton").onclick = async () => {
  const email = $("email").value.trim();
  const password = $("password").value;

  if (!email || !password) {
    showLoginStatus("اكتب الإيميل وكلمة المرور");
    return;
  }

  showLoginStatus("جاري تسجيل الدخول...");

  const { error } = await client.auth.signInWithPassword({
    email,
    password
  });

  if (error) {
    showLoginStatus("تعذر تسجيل الدخول: " + error.message);
    return;
  }

  showLoginStatus("");
  await checkLogin();
};

$("logoutButton").onclick = async () => {
  await client.auth.signOut();
  $("adminPanel").classList.add("hidden");
  $("loginPanel").classList.remove("hidden");
  showLoginStatus("تم تسجيل الخروج");
};

async function loadGames() {
  showStatus("جاري تحميل الألعاب...");

  const { data, error } = await client
    .from("games")
    .select("id, name, platform, image_url")
    .order("id");

  if (error) {
    showStatus("خطأ تحميل الألعاب: " + error.message);
    return;
  }

  games = data || [];
  displayGames();
}

function displayGames() {
  const container = $("games");
  const query = $("search").value.trim().toLowerCase();

  container.replaceChildren();

  const filtered = games.filter(game =>
    (game.name  "").toLowerCase().includes(query) 
    String(game.id).includes(query)
  );

  showStatus("عدد الألعاب: " + games.length);

  filtered.forEach(game => {
    const card = document.createElement("div");
    card.className = "game";

    const img = document.createElement("img");
    img.src = game.image_url || "";
    img.alt = game.name || "لعبة";

    const name = document.createElement("input");
    name.value = game.name || "";
    name.placeholder = "اسم اللعبة";

    const platform = document.createElement("select");

    [
      ["ps2", "PS2"],
      ["ps4", "PS4"],
      ["ps5", "PS5"],
      ["غير محدد", "غير محدد"]
    ].forEach(([value, label]) => {
      const option = document.createElement("option");
      option.value = value;
      option.textContent = label;
      platform.appendChild(option);
    });

    platform.value = game.platform || "غير محدد";

    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";

    const save = document.createElement("button");
    save.textContent = "حفظ التعديلات";

    save.onclick = async () => {
      save.disabled = true;
      save.textContent = "جاري الحفظ...";

      try {
        let imageUrl = game.image_url;

        if (imageInput.files[0]) {
          imageUrl = await uploadImage(imageInput.files[0]);
        }

        const { error } = await client
          .from("games")
          .update({
            name: name.value.trim(),
            platform: platform.value,
            image_url: imageUrl
          })
          .eq("id", game.id);

        if (error) throw error;

        alert("تم تعديل اللعبة بنجاح");
        await loadGames();

      } catch (error) {
        alert("خطأ: " + error.message);
        save.disabled = false;
        save.textContent = "حفظ التعديلات";
      }
    };

    const remove = document.createElement("button");
    remove.textContent = "حذف اللعبة";
    remove.style.background = "#b83232";
    remove.style.color = "white";

    remove.onclick = async () => {
      if (!confirm("متأكد تريد حذف هذه اللعبة؟")) return;const { error } = await client
        .from("games")
        .delete()
        .eq("id", game.id);

      if (error) {
        alert("تعذر الحذف: " + error.message);
        return;
      }

      alert("تم حذف اللعبة");
      await loadGames();
    };

    card.append(img, name, platform, imageInput, save, remove);
    container.appendChild(card);
  });
}

async function uploadImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("اختار صورة صحيحة");
  }

  const extension = file.name.split(".").pop().toLowerCase();
  const fileName = crypto.randomUUID() + "." + extension;
  const filePath = fileName;

  const { error } = await client.storage
    .from("game-images")
    .upload(filePath, file, {
      upsert: false
    });

  if (error) throw error;

  const { data } = client.storage
    .from("game-images")
    .getPublicUrl(filePath);

  return data.publicUrl;
}

$("addButton").onclick = () => {
  $("addPanel").classList.toggle("hidden");
};

$("saveNewButton").onclick = async () => {
  const name = $("newName").value.trim();
  const platform = $("newPlatform").value;
  const file = $("newImage").files[0];

  if (!name  !platform  !file) {
    alert("اكتب اسم اللعبة واختر الجهاز والصورة");
    return;
  }

  $("saveNewButton").disabled = true;
  $("saveNewButton").textContent = "جاري الحفظ...";

  try {
    const imageUrl = await uploadImage(file);

    const { error } = await client
      .from("games")
      .insert([{
        name,
        platform,
        image_url: imageUrl
      }]);

    if (error) throw error;

    alert("تمت إضافة اللعبة بنجاح");

    $("newName").value = "";
    $("newPlatform").value = "";
    $("newImage").value = "";
    $("addPanel").classList.add("hidden");

    await loadGames();

  } catch (error) {
    alert("تعذر إضافة اللعبة: " + error.message);
  } finally {
    $("saveNewButton").disabled = false;
    $("saveNewButton").textContent = "حفظ اللعبة";
  }
};

$("search").addEventListener("input", displayGames);

checkLogin();
