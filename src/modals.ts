let openBackdropCount = 0;

export function createModalBackdrop(
  closeFunction: () => void,
  zIndex: number
): HTMLDivElement {
  const body = document.body;
  const backdrop = document.createElement("div");

  backdrop.classList.add("backdrop");
  backdrop.style.zIndex = String(zIndex);

  body.appendChild(backdrop);
  openBackdropCount += 1;
  body.classList.add("no-scroll");

  requestAnimationFrame(() => {
    backdrop.classList.add("active");
  });

  backdrop.addEventListener("click", () => {
    closeFunction();
  });

  return backdrop;
}

export function removeModalBackdrop(backdrop: HTMLDivElement | null): void {
  if (!backdrop) return;

  backdrop.classList.remove("active");
  setTimeout(() => {
    backdrop.remove();
  }, 200);

  openBackdropCount = Math.max(0, openBackdropCount - 1);
  if (openBackdropCount === 0) {
    document.body.classList.remove("no-scroll");
  }
}

export function openContainer(
  container: HTMLElement,
  modal: HTMLElement,
  zIndex: number
): void {
  requestAnimationFrame(() => {
    container.dataset.state = "open";
    container.style.zIndex = String(zIndex);
    modal.classList.add("fadeInUp");
  });
}

export function closeContainer(
  container: HTMLElement,
  modal: HTMLElement,
  onClosed?: () => void
): void {
  modal.classList.remove("fadeInUp");
  modal.classList.add("fadeOutDown");
  setTimeout(() => {
    modal.classList.remove("fadeOutDown");
    container.dataset.state = "closed";
    onClosed?.();
  }, 200);
}
