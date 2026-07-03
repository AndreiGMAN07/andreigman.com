document.addEventListener("DOMContentLoaded", () => {
  const grid = document.getElementById("archiveGrid");
  const categoryInputs = document.querySelectorAll('input[name="archiveCategory"]');
  const statusFilter = document.getElementById("archiveStatusFilter");

  const getCategory = () => {
    const checked = document.querySelector('input[name="archiveCategory"]:checked');
    return checked ? checked.value : "all";
  };

  const renderArchive = async () => {
    let items = await MediaArchive.filterByCategory(getCategory());
    items = MediaArchive.filterByStatus(items, statusFilter?.value || "all");

    grid.innerHTML = "";
    grid.className = "media-grid";

    if (!items.length) {
      MediaUI.renderEmpty(
        grid,
        "Your archive is empty. Browse a category and add titles you want to track."
      );
      return;
    }

    items.forEach((item) => grid.appendChild(MediaUI.renderArchiveCard(item)));
  };

  categoryInputs.forEach((input) => input.addEventListener("change", renderArchive));
  statusFilter?.addEventListener("change", renderArchive);
  renderArchive();
});
