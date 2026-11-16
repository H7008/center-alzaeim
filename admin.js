
const client = window.supabaseClient;

let games = [];

const get = (id) => document.getElementById(id);

function status(message) {
  get("status").textContent = message;
}

function loginStatus(message) {
  get("loginStatus").textContent = message;
}

// تسجيل الدخول
async function checkLogin() {
  const { data, error } = await client.auth.getSession();

  if (error) {
    loginStatus(error.message);
    return;
  }

  const loggedIn = !!data.session;

  get("loginPanel").classList.toggle("hidden", loggedIn);
  get("adminPanel").classList.toggle("hidden", !loggedIn);

  if (loggedIn) {
    await loadGames();
  }
}

get("loginButton").addEventListener("click", async () => {
  const email = get("email").value.trim();
  const password = get("password").value;

  if (!email || !password) {
    loginStatus("اكتب الإيميل وكلمة المرور");
    return;
  }

  const button = get("loginButton");
  button.disabled = true;
  loginStatus("جاري تسجيل الدخول...");

  try {
    const { error } = await client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;

    loginStatus("");
    await checkLogin();

  } catch (error) {
    loginStatus("خطأ: " + error.message);
  } finally {
    button.disabled = false;
  }
});

// تسجيل الخروج
get("logoutButton").addEventListener("click", async () => {
  const { error } = await client.auth.signOut();

  if (error) {
    alert(error.message);
    return;
  }

  get("adminPanel").classList.add("hidden");
  get("loginPanel").classList.remove("hidden");
  loginStatus("تم تسجيل الخروج");
});

// تحميل الألعاب
async function loadGames() {
  status("جاري تحميل الألعاب...");

  try {
    const { data, error } = await client
      .from("games")
      .select("id, name, platform, image_url")
      .order("id");

    if (error) throw error;

    games = data || [];
    displayGames();

  } catch (error) {
    status("خطأ تحميل الألعاب: " + error.message);
  }
}

// رفع الصور إلى Supabase
async function uploadImage(file) {
  if (!file || !file.type.startsWith("image/")) {
    throw new Error("اختار صورة صحيحة");
  }

  const extension = file.name.split(".").pop().toLowerCase();
  const fileName = crypto.randomUUID() + "." + extension;

  const { error } = await client.storage
    .from("game-images")
    .upload(fileName, file);

  if (error) throw error;

  const { data } = client.storage
    .from("game-images")
    .getPublicUrl(fileName);

  return data.publicUrl;
}

// عرض الألعاب
function displayGames() {
  const container = get("games");
  const query = get("search").value.trim().toLowerCase();

  container.replaceChildren();

  const filtered = games.filter(game =>
    (game.name || "").toLowerCase().includes(query) ||
    String(game.id).includes(query)
  );

  status("إجمالي الألعاب: " + games.length);

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
    ].forEach(item => {
      const option = document.createElement("option");
      option.value = item[0];
      option.textContent = item[1];
      platform.appendChild(option);
    });

    platform.value = game.platform || "غير محدد";

    const imageInput = document.createElement("input");
    imageInput.type = "file";
    imageInput.accept = "image/*";

    const saveButton = document.createElement("button");
    saveButton.textContent = "حفظ التعديلات";

    saveButton.onclick = async () => {
      saveButton.disabled = true;

      try {
        let imageUrl = game.image_url;

        if (imageInput.files.length > 0) {
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
      } finally {
        saveButton.disabled = false;
      }
    };

    const deleteButton = document.createElement("button");
    deleteButton.textContent = "حذف اللعبة";
    deleteButton.style.background = "#b83232";
    deleteButton.style.color = "white";

    deleteButton.onclick = async () => {
      if (!confirm("هل أنت متأكد من حذف اللعبة؟")) return;

      deleteButton.disabled = true;

      const { error } = await client
        .from("games")
        .delete()
        .eq("id", game.id);

      if (error) {
        alert("تعذر الحذف: " + error.message);
        deleteButton.disabled = false;
        return;
      }

      alert("تم حذف اللعبة");
      await loadGames();
    };

    card.append(
      img,
      name,
      platform,
      imageInput,
      saveButton,
      deleteButton
    );

    container.appendChild(card);
  });
}

// فتح وإغلاق إضافة لعبة
get("addButton").addEventListener("click", () => {
  get("addPanel").classList.toggle("hidden");
});

// إضافة لعبة جديدة
get("saveNewButton").addEventListener("click", async () => {
  const name = get("newName").value.trim();
  const platform = get("newPlatform").value;
  const file = get("newImage").files[0];

  if (!name || !platform || !file) {
    alert("اكتب اسم اللعبة واختر الجهاز والصورة");
    return;
  }

  const button = get("saveNewButton");
  button.disabled = true;
  button.textContent = "جاري الحفظ...";

  try {
    const imageUrl = await uploadImage(file);

    const { error } = await client
      .from("games")
      .insert([{
        name: name,
        platform: platform,
        image_url: imageUrl
      }]);

    if (error) throw error;

    alert("تمت إضافة اللعبة بنجاح");

    get("newName").value = "";
    get("newPlatform").value = "";
    get("newImage").value = "";
    get("addPanel").classList.add("hidden");

    await loadGames();

  } catch (error) {
    alert("تعذر إضافة اللعبة: " + error.message);
  } finally {
    button.disabled = false;
    button.textContent = "حفظ اللعبة";
  }
});

// البحث
get("search").addEventListener("input", displayGames);

// بدء لوحة الإدارة
checkLogin();
