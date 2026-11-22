if (window.location.hostname.includes("cigarpage.com")) {
  let blockedBrands = [];
  let blockedSkus = [];
  let sizeFilter = "";
  let maxRingGauge = "";
  let exactRingGauge = "";
  let blockVaries = false;

  function injectStyles() {
    if (document.getElementById("cp-blocker-styles")) return;
    const style = document.createElement("style");
    style.id = "cp-blocker-styles";
    style.textContent = `
      .cp-hidden-listing,
      tr.cp-hidden-listing,
      li.cp-hidden-listing {
        height: 0px !important;
        min-height: 0px !important;
        max-height: 0px !important;
        padding: 0px !important;
        margin: 0px !important;
        border: none !important;
        border-width: 0px !important;
        font-size: 0px !important;
        line-height: 0 !important;
        overflow: hidden !important;
        visibility: hidden !important;
        pointer-events: none !important;
        opacity: 0 !important;
      }
      tr.cp-hidden-listing > td,
      tr.cp-hidden-listing > th {
        height: 0px !important;
        min-height: 0px !important;
        max-height: 0px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
        margin: 0px !important;
        border: none !important;
        font-size: 0px !important;
        line-height: 0 !important;
        overflow: hidden !important;
      }
      .cp-hidden-listing * {
        max-height: 0px !important;
        min-height: 0px !important;
        padding-top: 0px !important;
        padding-bottom: 0px !important;
        margin-top: 0px !important;
        margin-bottom: 0px !important;
        border: none !important;
        line-height: 0 !important;
      }
      li.cp-hidden-listing {
        width: 0px !important;
        min-width: 0px !important;
        max-width: 0px !important;
        flex: 0 0 0px !important;
      }
      ul.productGrid:has(li.cp-hidden-listing) {
        display: flex !important;
        flex-wrap: wrap !important;
      }
    `;
    (document.head || document.documentElement).appendChild(style);
  }

  function normalizeSize(str) {
    return (str || "").toLowerCase().replace(/["'\s]/g, "");
  }

  function extractRingGauges(text) {
    const rx = /(\d+(?:\.\d+)?)\s*["']?\s*x\s*(\d{1,3})\b/gi;
    const results = [];
    for (const m of text.matchAll(rx)) {
      const len = parseFloat(m[1]);
      const rg = parseInt(m[2], 10);
      if (len > 0 && rg > 0) {
        results.push(rg);
      }
    }
    return results;
  }

  function hasVariesSize(card, fullCardText, gauges) {
    if (/size:\s*\(?varies\)?/i.test(fullCardText)) return true;
    if (/0\s*["']?\s*x\s*0\b/i.test(fullCardText)) return true;

    const fields = card.querySelectorAll(".product-custom-field");
    for (const f of fields) {
      const txt = f.textContent.toLowerCase();
      if (txt.includes("size") && (txt.includes("varies") || /0\s*["']?\s*x\s*0\b/.test(txt))) {
        return true;
      }
    }

    return gauges.length === 0 && (/\bvaries\b/i.test(fullCardText) || /0\s*["']?\s*x\s*0\b/i.test(fullCardText));
  }

  function makeBtn(label, bg, hover, cls, onClick) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = cls;
    btn.textContent = label;

    Object.assign(btn.style, {
      padding: "3px 7px",
      fontSize: "11px",
      lineHeight: "1.2",
      backgroundColor: bg,
      color: "#fff",
      border: "none",
      borderRadius: "3px",
      cursor: "pointer",
      zIndex: "10",
      position: "relative"
    });

    btn.onmouseenter = () => (btn.style.backgroundColor = hover);
    btn.onmouseleave = () => (btn.style.backgroundColor = bg);
    btn.onclick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      onClick();
    };

    return btn;
  }

  function injectRingGaugeAccordion() {
    const list = document.querySelector("#facetedSearch-navList .accordion--navList");
    if (!list || document.getElementById("cp-ring-accordion-block")) return;

    const presets = [
      ["44", "Under 44 (Lancero / Panetela)"],
      ["48", "Under 48 (Corona / Lonsdale)"],
      ["50", "50 & Under (Robusto)"],
      ["52", "52 & Under (Toro / Belicoso)"],
      ["54", "54 & Under (No Gordos)"]
    ];

    const presetHtml = presets
      .map(([rg, text]) => `
        <li class="navList-item">
          <a href="#" class="navList-action navList-action--checkbox cp-ring-option" data-ring="${rg}">
            ${text}
            <span class="navList-action-close" aria-hidden="true">
              <svg class="icon"><use href="#icon-close"></use></svg>
            </span>
          </a>
        </li>`)
      .join("");

    const block = document.createElement("div");
    block.className = "accordion-block";
    block.id = "cp-ring-accordion-block";

    block.innerHTML = `
      <div class="accordion-nav-clear-holder">
        <button type="button" class="accordion-navigation toggleLink is-open" id="cp-ring-acc-btn" aria-expanded="true">
          <span class="accordion-title">Ring Gauge &amp; Size</span>
          <span>
            <svg class="icon accordion-indicator toggleLink-text toggleLink-text--off" style="display:none;">
              <use href="#icon-add"></use>
            </svg>
            <svg class="icon accordion-indicator toggleLink-text toggleLink-text--on" style="display:inline-block;">
              <use href="#icon-remove"></use>
            </svg>
          </span>
        </button>
      </div>
      <div id="facetedSearch-content--ringgauge" class="accordion-content is-open" style="display:block;">
        <ul id="facetedSearch-navList--ringgauge" class="navList">
          <li class="navList-item" style="border-bottom:1px solid #eee;padding-bottom:6px;margin-bottom:6px;">
            <a href="#" class="navList-action navList-action--checkbox" id="cp-block-varies-toggle">
              Hide Most Samplers
              <span class="navList-action-close" aria-hidden="true">
                <svg class="icon"><use href="#icon-close"></use></svg>
              </span>
            </a>
          </li>
          ${presetHtml}
          <li class="navList-item" style="margin-top:8px;padding-top:6px;border-top:1px solid #eee;">
            <div style="display:flex;align-items:center;gap:5px;">
              <input type="number" id="cp-accordion-exact-rg" placeholder="Exact RG (e.g. 52)" min="20" max="100"
                style="width:100%;padding:4px 6px;border:1px solid #ccc;border-radius:3px;font-size:12px;" />
              <button type="button" id="cp-accordion-clear-rg"
                style="padding:4px 7px;background:#666;color:#fff;border:none;border-radius:3px;font-size:11px;cursor:pointer;">
                Reset
              </button>
            </div>
          </li>
        </ul>
      </div>
    `;

    list.prepend(block);

    const toggleBtn = block.querySelector("#cp-ring-acc-btn");
    const contentDiv = block.querySelector("#facetedSearch-content--ringgauge");
    const plusIcon = block.querySelector(".toggleLink-text--off");
    const minusIcon = block.querySelector(".toggleLink-text--on");
    const variesLink = block.querySelector("#cp-block-varies-toggle");
    const exactInput = block.querySelector("#cp-accordion-exact-rg");
    const clearBtn = block.querySelector("#cp-accordion-clear-rg");

    toggleBtn.onclick = () => {
      const isOpen = contentDiv.classList.contains("is-open");
      contentDiv.classList.toggle("is-open", !isOpen);
      toggleBtn.classList.toggle("is-open", !isOpen);
      contentDiv.style.display = isOpen ? "none" : "block";
      plusIcon.style.display = isOpen ? "inline-block" : "none";
      minusIcon.style.display = isOpen ? "none" : "inline-block";
    };

    variesLink.onclick = (e) => {
      e.preventDefault();
      blockVaries = !blockVaries;
      chrome.storage.local.set({ blockVaries });
      applyFilters();
    };

    block.querySelectorAll(".cp-ring-option").forEach((link) => {
      link.onclick = (e) => {
        e.preventDefault();
        const chosen = link.getAttribute("data-ring");
        maxRingGauge = String(maxRingGauge) === chosen ? "" : chosen;
        if (maxRingGauge) {
          exactRingGauge = "";
          exactInput.value = "";
        }
        chrome.storage.local.set({ maxRingGauge, exactRingGauge });
        applyFilters();
      };
    });

    exactInput.oninput = () => {
      exactRingGauge = exactInput.value;
      if (exactRingGauge) {
        maxRingGauge = "";
      }
      chrome.storage.local.set({ exactRingGauge, maxRingGauge });
      applyFilters();
    };

    clearBtn.onclick = () => {
      maxRingGauge = "";
      exactRingGauge = "";
      sizeFilter = "";
      blockVaries = false;
      exactInput.value = "";
      chrome.storage.local.set({ maxRingGauge: "", exactRingGauge: "", sizeFilter: "", blockVaries: false });
      applyFilters();
    };
  }

  function syncAccordionUI() {
    const exactInput = document.getElementById("cp-accordion-exact-rg");
    if (exactInput && document.activeElement !== exactInput) {
      exactInput.value = exactRingGauge;
    }

    const variesLink = document.getElementById("cp-block-varies-toggle");
    if (variesLink) {
      variesLink.classList.toggle("is-selected", Boolean(blockVaries));
    }

    document.querySelectorAll(".cp-ring-option").forEach((link) => {
      const isSelected = !exactRingGauge && maxRingGauge && String(maxRingGauge) === link.getAttribute("data-ring");
      link.classList.toggle("is-selected", isSelected);
    });
  }

  function injectButtons(card, brand, sku) {
    if (!brand && !sku) return;

    let btnBar = card.querySelector(".cp-blocker-bar");
    if (!btnBar) {
      const anchor =
        card.querySelector(".information-preview") ||
        card.querySelector(".card-body") ||
        card.querySelector(".product-name") ||
        card.querySelector("td");

      if (!anchor) return;

      btnBar = document.createElement("div");
      btnBar.className = "cp-blocker-bar";
      Object.assign(btnBar.style, {
        display: "flex",
        flexWrap: "wrap",
        gap: "4px",
        marginTop: "6px"
      });

      if (anchor.classList.contains("information-preview")) {
        anchor.insertAdjacentElement("afterend", btnBar);
      } else {
        anchor.appendChild(btnBar);
      }
    }

    if (brand && !btnBar.querySelector(".cp-block-brand-btn")) {
      const bBtn = makeBtn(`Block "${brand}"`, "#8b0000", "#b30000", "cp-block-brand-btn", () => {
        chrome.storage.local.get({ blockedBrands: ["teufel hund"] }, (data) => {
          const updated = data.blockedBrands;
          if (!updated.includes(brand)) {
            updated.push(brand);
            chrome.storage.local.set({ blockedBrands: updated });
          }
        });
      });
      bBtn.style.textTransform = "capitalize";
      btnBar.appendChild(bBtn);
    }

    if (sku && !btnBar.querySelector(".cp-block-sku-btn")) {
      const sBtn = makeBtn(`Block SKU (${sku.toUpperCase()})`, "#444", "#222", "cp-block-sku-btn", () => {
        chrome.storage.local.get({ blockedSkus: [] }, (data) => {
          const updated = data.blockedSkus;
          if (!updated.includes(sku)) {
            updated.push(sku);
            chrome.storage.local.set({ blockedSkus: updated });
          }
        });
      });
      btnBar.appendChild(sBtn);
    }
  }

  function setCardHidden(card, hide) {
    if (hide) {
      if (!card.classList.contains("cp-hidden-listing")) {
        card.classList.add("cp-hidden-listing");
      }
    } else {
      if (card.classList.contains("cp-hidden-listing")) {
        card.classList.remove("cp-hidden-listing");
      }
    }
  }

  function applyFilters() {
    injectStyles();
    injectRingGaugeAccordion();
    syncAccordionUI();

    const cards = document.querySelectorAll("tr.deals-card, li.product, .productGrid .product");
    const cleanQuery = normalizeSize(sizeFilter);
    const maxRing = parseInt(maxRingGauge, 10);
    const exactRing = parseInt(exactRingGauge, 10);

    cards.forEach((card) => {
      const brandEl = card.hasAttribute("data-product-brand")
        ? card
        : card.querySelector("[data-product-brand]");
      const brandTextEl = card.querySelector('[data-test-info-type="brandName"]');

      const attrBrand = (
        (brandEl ? brandEl.getAttribute("data-product-brand") : "") ||
        (brandTextEl ? brandTextEl.innerText : "")
      ).toLowerCase().trim();

      const skuEl = card.hasAttribute("data-member-price-sku")
        ? card
        : card.querySelector("[data-member-price-sku], [data-product-sku]");

      const attrSku = (
        skuEl ? skuEl.getAttribute("data-member-price-sku") || skuEl.getAttribute("data-product-sku") : ""
      ).toLowerCase().trim();

      const fullText = card.textContent.toLowerCase();
      const normText = normalizeSize(fullText);
      const gauges = extractRingGauges(fullText);

      injectButtons(card, attrBrand, attrSku);

      const isBrandBlocked = blockedBrands.some(
        (b) => (attrBrand && attrBrand.includes(b)) || fullText.includes(b)
      );
      const isSkuBlocked = attrSku && blockedSkus.includes(attrSku);
      const isSizeMismatch = cleanQuery && !normText.includes(cleanQuery);
      const isVariesBlocked = blockVaries && hasVariesSize(card, fullText, gauges);

      let isRingMismatch = false;
      if (!isNaN(exactRing) && exactRing > 0) {
        isRingMismatch = gauges.length === 0 || !gauges.includes(exactRing);
      } else if (!isNaN(maxRing) && maxRing > 0 && gauges.length > 0) {
        isRingMismatch = gauges.every((rg) => rg > maxRing);
      }

      const shouldHide = Boolean(
        isBrandBlocked || isSkuBlocked || isSizeMismatch || isRingMismatch || isVariesBlocked
      );

      setCardHidden(card, shouldHide);
    });
  }

  chrome.storage.local.get(
    {
      blockedBrands: [],
      blockedSkus: [],
      sizeFilter: "",
      maxRingGauge: "",
      exactRingGauge: "",
      blockVaries: false
    },
    (data) => {
      blockedBrands = data.blockedBrands;
      blockedSkus = data.blockedSkus;
      sizeFilter = data.sizeFilter;
      maxRingGauge = data.maxRingGauge;
      exactRingGauge = data.exactRingGauge;
      blockVaries = data.blockVaries;
      applyFilters();
    }
  );

  chrome.storage.onChanged.addListener((changes) => {
    if (changes.blockedBrands) blockedBrands = changes.blockedBrands.newValue || [];
    if (changes.blockedSkus) blockedSkus = changes.blockedSkus.newValue || [];
    if (changes.sizeFilter !== undefined) sizeFilter = changes.sizeFilter.newValue || "";
    if (changes.maxRingGauge !== undefined) maxRingGauge = changes.maxRingGauge.newValue || "";
    if (changes.exactRingGauge !== undefined) exactRingGauge = changes.exactRingGauge.newValue || "";
    if (changes.blockVaries !== undefined) blockVaries = changes.blockVaries.newValue;
    applyFilters();
  });

  let filterScheduled = false;
  function scheduleApplyFilters() {
    if (filterScheduled) return;
    filterScheduled = true;
    requestAnimationFrame(() => {
      filterScheduled = false;
      applyFilters();
    });
  }

  const observer = new MutationObserver(scheduleApplyFilters);
  observer.observe(document.body, {
    childList: true,
    subtree: true,
    characterData: true
  });

  window.addEventListener("scroll", scheduleApplyFilters, { passive: true });
  setInterval(applyFilters, 1000);
}








