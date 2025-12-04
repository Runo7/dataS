// Datum oben automatisch setzen + Datum im Unterschriftsbereich vorbelegen
(function () {
  const today = new Date();
  const formatted = today.toLocaleDateString("de-DE");

  const todaySpan = document.getElementById("today-date");
  if (todaySpan) {
    todaySpan.textContent = formatted;
  }

  const sigDateInput = document.getElementById("signature-date");
  if (sigDateInput && !sigDateInput.value.trim()) {
    sigDateInput.value = formatted;
  }
})();

// Signatur-Setup
function initSignatureCanvas(canvasId) {
  const canvas = document.getElementById(canvasId);
  const placeholder = canvas.parentElement.querySelector(".sign-placeholder");
  const ctx = canvas.getContext("2d");

  let hasDrawn = false;

  function resizeCanvas() {
    const rect = canvas.getBoundingClientRect();
    const ratio = window.devicePixelRatio || 1;

    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reset
    canvas.width = rect.width * ratio;
    canvas.height = rect.height * ratio;
    ctx.scale(ratio, ratio);
    ctx.lineWidth = 1.8;
    ctx.lineCap = "round";
    ctx.strokeStyle = "#111827";
  }

  resizeCanvas();
  window.addEventListener("resize", resizeCanvas);

  let drawing = false;
  let lastX = 0;
  let lastY = 0;

  function startDrawing(x, y) {
    drawing = true;
    lastX = x;
    lastY = y;
    hasDrawn = true;
    if (placeholder) placeholder.style.display = "none";
  }

  function draw(x, y) {
    if (!drawing) return;
    ctx.beginPath();
    ctx.moveTo(lastX, lastY);
    ctx.lineTo(x, y);
    ctx.stroke();
    lastX = x;
    lastY = y;
  }

  function stopDrawing() {
    drawing = false;
  }

  // Maus
  canvas.addEventListener("mousedown", (e) => {
    const rect = canvas.getBoundingClientRect();
    startDrawing(e.clientX - rect.left, e.clientY - rect.top);
  });

  canvas.addEventListener("mousemove", (e) => {
    if (!drawing) return;
    const rect = canvas.getBoundingClientRect();
    draw(e.clientX - rect.left, e.clientY - rect.top);
  });

  window.addEventListener("mouseup", stopDrawing);

  // Touch
  canvas.addEventListener(
    "touchstart",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      startDrawing(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchmove",
    (e) => {
      e.preventDefault();
      const rect = canvas.getBoundingClientRect();
      const touch = e.touches[0];
      draw(touch.clientX - rect.left, touch.clientY - rect.top);
    },
    { passive: false }
  );

  canvas.addEventListener(
    "touchend",
    (e) => {
      e.preventDefault();
      stopDrawing();
    },
    { passive: false }
  );

  return {
    clear() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      canvas.width = rect.width * ratio;
      canvas.height = rect.height * ratio;
      ctx.scale(ratio, ratio);
      ctx.lineWidth = 1.8;
      ctx.lineCap = "round";
      ctx.strokeStyle = "#111827";
      hasDrawn = false;
      if (placeholder) placeholder.style.display = "flex";
    },
    hasSignature() {
      return hasDrawn;
    }
  };
}

const signatureCustomer = initSignatureCanvas("signature-customer");

// Clear-Button
document.querySelectorAll("[data-clear]").forEach((btn) => {
  btn.addEventListener("click", () => {
    const targetId = btn.getAttribute("data-clear");
    if (targetId === "signature-customer") signatureCustomer.clear();
  });
});

// "Done" -> Export als Bild (Download)
const saveButton = document.getElementById("save-button");

saveButton.addEventListener("click", async () => {
  const consentElement = document.getElementById("consent-form");
  const customerNameInput = document.getElementById("customer-name");

  if (!signatureCustomer.hasSignature()) {
    alert("Bitte unterschreiben Sie zuerst im Unterschriftsfeld.");
    return;
  }

  try {
    const canvas = await html2canvas(consentElement, {
      scale: 2,
      backgroundColor: "#ffffff"
    });

    const dataUrl = canvas.toDataURL("image/png");

    const dateStr = new Date().toISOString().slice(0, 10); // yyyy-mm-dd
    const customerName = (customerNameInput?.value || "ohne-name").trim();
    const safeName = customerName.replace(/[^a-zA-Z0-9_-]/g, "-") || "ohne-name";
    const filename = `Datenschutzerklaerung_${dateStr}_${safeName}.png`;

    const link = document.createElement("a");
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    alert(
      "Die unterschriebene Datenschutzerklärung wurde als Bild gespeichert. Bitte zusammen mit dem Arbeitsnachweis / Abnahmeprotokoll ablegen."
    );
  } catch (error) {
    console.error(error);
    alert("Fehler beim Export. Prüfe die Browser-Konsole für Details.");
  }
});
