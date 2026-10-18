
"use strict";

const form = document.querySelector("#review-form");
const statusMessage = document.querySelector("#review-status");
const submitButton = document.querySelector("#submit-review");

const STORAGE_KEY = "nd-darshika-final-review";

const fields = [
  { id: "favourite", label: "Favourite part of the website" },
  { id: "gifts", label: "Gift review" },
  { id: "funniest", label: "Funniest or most irritating part" },
  { id: "improve", label: "What could be improved" },
  { id: "message", label: "Final message" }
];

let submitted = false;

function getReviewData() {
  const rating = document.querySelector(
    'input[name="overall"]:checked'
  );

  return {
    rating: rating ? rating.value : "",
    answers: fields.map((field) => ({
      label: field.label,
      value: document.getElementById(field.id).value.trim()
    })),
    date: new Date().toISOString()
  };
}

function saveReviewDraft() {
  if (submitted) return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(getReviewData()));
    statusMessage.textContent = "Draft saved on this device. ♡";
  } catch (error) {
    statusMessage.textContent =
      "Autosave unavailable. Your current answers are still on screen.";
  }
}

function restoreReviewDraft() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");

    if (!saved) return;

    if (saved.rating) {
      const ratingInput = document.querySelector(
        `input[name="overall"][value="${saved.rating}"]`
      );

      if (ratingInput) ratingInput.checked = true;
    }

    (saved.answers || []).forEach((answer) => {
      const field = fields.find((item) => item.label === answer.label);
      if (!field) return;

      const element = document.getElementById(field.id);
      if (element) element.value = answer.value || "";
    });

    updateRatingLabel();

    statusMessage.textContent =
      "Your previous review draft has been restored. ♡";
  } catch (error) {
    console.warn("Review draft could not be restored.", error);
  }
}

function updateRatingLabel() {
  const selected = document.querySelector(
    'input[name="overall"]:checked'
  );

  const ratingLabel = document.querySelector("#rating-label");

  if (!selected) {
    ratingLabel.textContent = "Select your rating, inspector.";
    return;
  }

  const labels = {
    1: "1 star — brutal honesty. Respect.",
    2: "2 stars — we need a meeting.",
    3: "3 stars — decent effort, I suppose.",
    4: "4 stars — okay, I'll take that.",
    5: "5 stars — suspicious behaviour detected."
  };

  ratingLabel.textContent = labels[selected.value];
}

fields.forEach((field) => {
  const element = document.getElementById(field.id);
  element.addEventListener("input", saveReviewDraft);
});

document.querySelectorAll('input[name="overall"]').forEach((input) => {
  input.addEventListener("change", () => {
    updateRatingLabel();
    saveReviewDraft();
  });
});

restoreReviewDraft();

/* PDF helpers */

function addPdfParagraph(doc, text, options = {}) {
  const {
    size = 11,
    bold = false,
    color = [40, 19, 30],
    gap = 7
  } = options;

  const margin = 20;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const usableWidth = pageWidth - margin * 2;

  doc.setFont("helvetica", bold ? "bold" : "normal");
  doc.setFontSize(size);
  doc.setTextColor(...color);

  const lines = doc.splitTextToSize(String(text || ""), usableWidth);
  const lineHeight = size * 0.48;

  if (typeof doc._reviewY !== "number") {
    doc._reviewY = 25;
  }

  if (doc._reviewY + lines.length * lineHeight + gap > pageHeight - 20) {
    doc.addPage();
    doc._reviewY = 25;
  }

  doc.text(lines, margin, doc._reviewY);
  doc._reviewY += lines.length * lineHeight + gap;
}

function addPdfHeading(doc, text) {
  addPdfParagraph(doc, text, {
    size: 16,
    bold: true,
    color: [173, 61, 96],
    gap: 12
  });
}

function addPdfPageNumbers(doc) {
  const total = doc.getNumberOfPages();

  for (let page = 1; page <= total; page++) {
    doc.setPage(page);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(130, 103, 116);
    doc.text(
      `THE FINAL CHAPTER | Page ${page} of ${total}`,
      doc.internal.pageSize.getWidth() / 2,
      doc.internal.pageSize.getHeight() - 9,
      { align: "center" }
    );
  }
}

async function downloadReviewPDF(review) {
  const jsPDF = await window.jsPDFReady;
  const doc = new jsPDF({ unit: "mm", format: "a4" });

  const submittedDate = new Date(review.date).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short"
  });

  doc.setProperties({
    title: "Darshika's Final Review",
    subject: "Birthday website and gifts feedback",
    author: "The Friendship Archive"
  });

  // Cover page
  doc.setFillColor(255, 248, 242);
  doc.rect(
    0, 0,
    doc.internal.pageSize.getWidth(),
    doc.internal.pageSize.getHeight(),
    "F"
  );

  doc.setTextColor(173, 61, 96);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("THE FRIENDSHIP ARCHIVE", 20, 35);

  doc.setTextColor(40, 19, 30);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(29);
  doc.text("THE FINAL", 20, 70);
  doc.text("REVIEW", 20, 84);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(11);
  doc.text(
    doc.splitTextToSize(
      "A final review of the birthday website, gifts, jokes, and the questionable decisions made along the way.",
      155
    ),
    20,
    103
  );

  doc.setDrawColor(214, 94, 126);
  doc.roundedRect(20, 135, 170, 33, 4, 4, "S");

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text("OVERALL RATING", 27, 148);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(13);
  doc.text(`${review.rating} / 5 stars`, 27, 158);

  doc.setFontSize(10);
  doc.text(`Submitted: ${submittedDate}`, 20, 190);

  doc.setFont("helvetica", "italic");
  doc.text("The end of the website. Not necessarily the end of the friendship.", 20, 211);

  // Feedback pages
  doc.addPage();
  doc._reviewY = 25;

  addPdfHeading(doc, "THE REVIEW REPORT");
  addPdfParagraph(doc, `Overall rating: ${review.rating} / 5 stars`, {
    size: 11,
    bold: true,
    gap: 14
  });

  review.answers.forEach((answer) => {
    addPdfParagraph(doc, answer.label, {
      size: 12,
      bold: true,
      color: [173, 61, 96],
      gap: 5
    });

    addPdfParagraph(doc, answer.value || "No response provided.", {
      size: 10,
      gap: 13
    });
  });

  addPdfHeading(doc, "END OF REVIEW");

  addPdfParagraph(
    doc,
    "Feedback received. Ego status unknown. Friendship archive officially reviewed.",
    { size: 10, gap: 10 }
  );

  addPdfPageNumbers(doc);

  doc.save("Darshika_Final_Website_Review.pdf");
}

/* Ending sequence */

const wait = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms));

async function showEnding() {
  const screen = document.querySelector("#ending-screen");
  const content = document.querySelector("#ending-content");
  const page = document.querySelector("#review-page");
  const topbar = document.querySelector(".review-topbar");

  // Wait 90 seconds after submission.
  await wait(3_000);

  page.style.opacity = "0";
  topbar.style.opacity = "0";

  await wait(1000);

  screen.classList.add("active");

  // Briefly blank before the ending messages.
  content.innerHTML = "";
  await wait(3000);

  content.innerHTML = `
    <h1 class="ending-line">THE END.</h1>
  `;

  await wait(4500);

  content.innerHTML = `
    <h1 class="ending-line">Thanks for coming<br>till the end.</h1>
  `;

  await wait(4500);

  content.innerHTML = `
    <h1 class="ending-line">Happy Birthday<br>once again.</h1>
    <p class="ending-subline">You made it. Somehow. ♡</p>
  `;

  await wait(5000);

  // Black screen again.
  content.innerHTML = "";
  await wait(2500);

  content.innerHTML = `
    <p class="ending-line error">
      ERROR 404: NOTHING LEFT TO EXPLORE.
    </p>
    <p class="ending-subline">
      YOU HAVE REACHED THE FINAL DESTINATION.
    </p>
    <p class="ending-subline">
      Thank you. Now get out. ♡
    </p>
  `;

  // Remain on the final screen.
}

/* Review submission */

form.addEventListener("submit", async (event) => {
  event.preventDefault();

  if (submitted) return;

  if (!form.reportValidity()) return;

  const review = getReviewData();

  if (!review.rating) {
    statusMessage.textContent = "Rating select karna bhool gayi, madam.";
    return;
  }

  submitted = true;
  submitButton.disabled = true;
  submitButton.textContent = "GENERATING YOUR FINAL REPORT...";

  statusMessage.textContent =
    "Review apne paas rakh. Itni badi nahi ho gayi ki tu mujhe review de. 🙄";

  try {
    // Initiate the download before starting the final timer.
    await downloadReviewPDF(review);

    statusMessage.textContent =
      "Review apne paas rakh.. Ab nikal. 🙄";

    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Could not clear the saved draft.", error);
    }

    // The page stays available for 90 seconds before the ending.
    showEnding();
  } catch (error) {
    console.error("Review PDF generation failed:", error);

    submitted = false;
    submitButton.disabled = false;
    submitButton.textContent = "TRY SUBMITTING AGAIN ↗";

    statusMessage.textContent =
      "PDF nahi bani. Internet check karke refresh karo aur phir try karo.";
  }
});

/* Preloader */

(() => {
  const loader = document.querySelector("#review-loader");
  const message = document.querySelector("#loader-message");
  const progress = document.querySelector("#loader-progress");

  const messages = [
    "Preparing your final assignment.",
    "Checking the friendship archives.",
    "Calculating the emotional damage.",
    "Almost done. Do not celebrate yet."
  ];

  const duration = 3600;
  const start = Date.now();
  let messageIndex = 0;

  const messageTimer = setInterval(() => {
    messageIndex = Math.min(messageIndex + 1, messages.length - 1);
    message.textContent = messages[messageIndex];
  }, duration / messages.length);

  const progressTimer = setInterval(() => {
    const elapsed = Date.now() - start;
    const percentage = Math.min((elapsed / duration) * 100, 100);

    progress.style.width = `${percentage}%`;

    if (percentage >= 100) {
      clearInterval(progressTimer);
      clearInterval(messageTimer);
      loader.classList.add("hidden");
    }
  }, 40);
})();
