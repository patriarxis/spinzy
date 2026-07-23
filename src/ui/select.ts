import { soundManager } from "../audio";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectOptions {
  id: string;
  value: string;
  options: SelectOption[];
  ariaLabel: string;
  onChange: (value: string) => void;
}

interface OpenSelectState {
  root: HTMLElement;
  list: HTMLUListElement;
}

let openState: OpenSelectState | null = null;

function positionList(trigger: HTMLElement, list: HTMLElement): void {
  const rect = trigger.getBoundingClientRect();
  const maxHeight = 224;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUpward = spaceBelow < maxHeight && rect.top > spaceBelow;

  list.style.position = "fixed";
  list.style.left = `${Math.round(rect.left)}px`;
  list.style.width = `${Math.round(rect.width)}px`;
  list.style.zIndex = "2000";
  list.style.maxHeight = `${maxHeight}px`;

  if (openUpward) {
    list.style.top = "auto";
    list.style.bottom = `${Math.round(window.innerHeight - rect.top + 4)}px`;
  } else {
    list.style.top = `${Math.round(rect.bottom + 4)}px`;
    list.style.bottom = "auto";
  }
}

function closeOpenSelect(): void {
  if (!openState) return;

  const { root, list } = openState;
  root.classList.remove("is-open");
  root
    .querySelector<HTMLButtonElement>(".ui-select__trigger")
    ?.setAttribute("aria-expanded", "false");

  list.classList.remove("is-visible");
  list.hidden = true;
  root.appendChild(list);
  openState = null;
}

function isEventInsideSelect(event: Event): boolean {
  if (!openState) return false;
  const target = event.target as Node;
  return (
    openState.root.contains(target) || openState.list.contains(target)
  );
}

document.addEventListener("pointerdown", (event) => {
  if (!openState) return;
  if (!isEventInsideSelect(event)) {
    closeOpenSelect();
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    closeOpenSelect();
  }
});

window.addEventListener(
  "scroll",
  () => {
    if (!openState) return;
    const trigger = openState.root.querySelector<HTMLElement>(
      ".ui-select__trigger"
    );
    if (trigger) {
      positionList(trigger, openState.list);
    }
  },
  true
);

window.addEventListener("resize", () => {
  if (!openState) return;
  const trigger = openState.root.querySelector<HTMLElement>(
    ".ui-select__trigger"
  );
  if (trigger) {
    positionList(trigger, openState.list);
  }
});

export function closeAllSelects(): void {
  closeOpenSelect();
}

export function createSelect(options: SelectOptions): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "ui-select";
  root.dataset.value = options.value;

  const selected =
    options.options.find((option) => option.value === options.value) ??
    options.options[0];

  const trigger = document.createElement("button");
  trigger.type = "button";
  trigger.className = "ui-select__trigger";
  trigger.id = options.id;
  trigger.setAttribute("aria-label", options.ariaLabel);
  trigger.setAttribute("aria-haspopup", "listbox");
  trigger.setAttribute("aria-expanded", "false");

  const label = document.createElement("span");
  label.className = "ui-select__label";
  label.textContent = selected?.label ?? "";

  const chevron = document.createElement("span");
  chevron.className = "ui-select__chevron";
  chevron.setAttribute("aria-hidden", "true");

  trigger.append(label, chevron);

  const list = document.createElement("ul");
  list.className = "ui-select__list";
  list.setAttribute("role", "listbox");
  list.setAttribute("aria-label", options.ariaLabel);
  list.hidden = true;

  const setValue = (value: string, emit = true): void => {
    const next = options.options.find((option) => option.value === value);
    if (!next) return;

    root.dataset.value = value;
    label.textContent = next.label;

    list
      .querySelectorAll<HTMLLIElement>(".ui-select__option")
      .forEach((item) => {
        const isSelected = item.dataset.value === value;
        item.classList.toggle("is-selected", isSelected);
        item.setAttribute("aria-selected", String(isSelected));
      });

    if (emit) {
      options.onChange(value);
    }
  };

  options.options.forEach((option) => {
    const item = document.createElement("li");
    item.className = "ui-select__option";
    item.dataset.value = option.value;
    item.setAttribute("role", "option");
    item.setAttribute(
      "aria-selected",
      String(option.value === options.value)
    );
    item.classList.toggle("is-selected", option.value === options.value);
    item.textContent = option.label;

    item.addEventListener("pointerenter", () => {
      soundManager.play("prizeHover");
    });

    item.addEventListener("click", (event) => {
      event.preventDefault();
      event.stopPropagation();
      soundManager.play("prizePressed");
      setValue(option.value);
      closeOpenSelect();
    });

    list.appendChild(item);
  });

  const open = (): void => {
    if (openState?.root === root) return;
    if (openState) closeOpenSelect();

    root.classList.add("is-open");
    trigger.setAttribute("aria-expanded", "true");
    list.hidden = false;
    list.classList.add("is-visible");
    document.body.appendChild(list);
    positionList(trigger, list);
    openState = { root, list };
  };

  const toggle = (): void => {
    if (openState?.root === root) {
      closeOpenSelect();
    } else {
      open();
    }
  };

  trigger.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    toggle();
  });

  root.append(trigger, list);
  return root;
}
