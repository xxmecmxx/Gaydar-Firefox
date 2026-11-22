const brandInput = document.getElementById("brandInput");
const addBrandBtn = document.getElementById("addBrandBtn");
const brandList = document.getElementById("brandList");

const skuInput = document.getElementById("skuInput");
const addSkuBtn = document.getElementById("addSkuBtn");
const skuList = document.getElementById("skuList");

// Load initial lists
chrome.storage.local.get({ blockedBrands: ["teufel hund"], blockedSkus: [] }, (data) => {
  renderList(brandList, data.blockedBrands, "blockedBrands", "brand-item");
  renderList(skuList, data.blockedSkus, "blockedSkus", "sku-item");
});

addBrandBtn.addEventListener("click", () => addItem(brandInput, "blockedBrands", brandList, "brand-item"));
brandInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addItem(brandInput, "blockedBrands", brandList, "brand-item");
});

addSkuBtn.addEventListener("click", () => addItem(skuInput, "blockedSkus", skuList, "sku-item"));
skuInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") addItem(skuInput, "blockedSkus", skuList, "sku-item");
});

function addItem(inputEl, storageKey, listEl, itemClass) {
  const val = inputEl.value.trim().toLowerCase();
  if (!val) return;

  chrome.storage.local.get({ [storageKey]: [] }, (data) => {
    const items = data[storageKey];
    if (!items.includes(val)) {
      items.push(val);
      chrome.storage.local.set({ [storageKey]: items }, () => {
        inputEl.value = "";
        renderList(listEl, items, storageKey, itemClass);
      });
    } else {
      inputEl.value = "";
    }
  });
}

function removeItem(valToRemove, storageKey, listEl, itemClass) {
  chrome.storage.local.get({ [storageKey]: [] }, (data) => {
    const updated = data[storageKey].filter((item) => item !== valToRemove);
    chrome.storage.local.set({ [storageKey]: updated }, () => {
      renderList(listEl, updated, storageKey, itemClass);
    });
  });
}

function renderList(listEl, items, storageKey, itemClass) {
  listEl.innerHTML = "";
  items.forEach((item) => {
    const li = document.createElement("li");
    li.className = itemClass;
    li.textContent = item;

    const removeBtn = document.createElement("button");
    removeBtn.textContent = "X";
    removeBtn.className = "remove-btn";
    removeBtn.onclick = () => removeItem(item, storageKey, listEl, itemClass);

    li.appendChild(removeBtn);
    listEl.appendChild(li);
  });
}

