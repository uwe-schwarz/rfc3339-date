addEventListener("DOMContentLoaded", async () => {
  const target = document.getElementById("github-profile");
  if (!target) return;
  try {
    const response = await fetch("/github/uwe-schwarz/contributions");
    const data = await response.json();
    if (!data.countText || !data.calendarHtml) {
      target.innerHTML =
        '<p>GitHub stats are temporarily unavailable. <a class="font-bold underline" href="' +
        data.profileUrl +
        '">View the profile directly</a>.</p>';
      return;
    }
    target.innerHTML =
      '<p class="mb-4 text-base font-bold">' +
      data.countText +
      '</p><div class="gh-calendar-shell">' +
      data.calendarHtml +
      "</div>";
  } catch {
    target.innerHTML =
      '<p>GitHub stats are temporarily unavailable. <a class="font-bold underline" href="https://github.com/uwe-schwarz">View the profile directly</a>.</p>';
  }
});
