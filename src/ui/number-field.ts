export interface NumberFieldOptions {
  id: string;
  value: string;
  ariaLabel: string;
  suggestions?: string[];
  min?: number;
  step?: string;
  onChange: (value: string) => void;
}

let openSuggestions: {
  root: HTMLElement;
  panel: HTMLElement;
} | null = null;

function closeSuggestions(): void {
  if (!openSuggestions) return;
  const { root, panel } = openSuggestions;
  root.classList.remove("is-open");
  panel.classList.remove("is-visible");
  panel.hidden = true;
  root.appendChild(panel);
  openSuggestions = null;
}

function positionSuggestions(
  input: HTMLElement,
  panel: HTMLElement
): void {
  const rect = input.getBoundingClientRect();
  panel.style.position = "fixed";
  panel.style.left = `${Math.round(rect.left + rect.width / 2)}px`;
  panel.style.top = `${Math.round(rect.bottom + 4)}px`;
  panel.style.transform = "translateX(-50%)";
  panel.style.zIndex = "2000";
}

document.addEventListener("pointerdown", (event) => {
  if (!openSuggestions) return;
  const target = event.target as Node;

  // Switching to another number field — let that field's focus handler take over
  if (
    target instanceof Element &&
    target.closest(".ui-number__input") &&
    !openSuggestions.root.contains(target)
  ) {
    return;
  }

  if (
    !openSuggestions.root.contains(target) &&
    !openSuggestions.panel.contains(target)
  ) {
    closeSuggestions();
  }
});

window.addEventListener(
  "scroll",
  () => {
    if (!openSuggestions) return;
    const input =
      openSuggestions.root.querySelector<HTMLElement>(".ui-number__input");
    if (input) {
      positionSuggestions(input, openSuggestions.panel);
    }
  },
  true
);

export function closeAllNumberSuggestions(): void {
  closeSuggestions();
}

export function createNumberField(
  options: NumberFieldOptions
): HTMLDivElement {
  const root = document.createElement("div");
  root.className = "ui-number";

  const input = document.createElement("input");
  input.type = "text";
  input.inputMode = "decimal";
  input.className = "ui-number__input";
  input.id = options.id;
  input.value = options.value;
  input.autocomplete = "off";
  input.spellcheck = false;
  input.setAttribute("aria-label", options.ariaLabel);

  const sanitize = (raw: string): string => {
    const cleaned = raw.replace(/[^\d.]/g, "");
    const parts = cleaned.split(".");
    if (parts.length <= 1) return cleaned;
    return `${parts[0]}.${parts.slice(1).join("")}`;
  };

  const commit = (): void => {
    const next = sanitize(input.value);
    input.value = next;
    options.onChange(next);
  };

  input.addEventListener("input", () => {
    input.value = sanitize(input.value);
  });

  input.addEventListener("change", commit);

  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      event.preventDefault();
      commit();
      closeSuggestions();
      input.blur();
    }
    if (event.key === "Escape") {
      closeSuggestions();
      input.blur();
    }
  });

  root.appendChild(input);

  if (options.suggestions && options.suggestions.length > 0) {
    const panel = document.createElement("div");
    panel.className = "ui-number__suggestions";
    panel.hidden = true;

    options.suggestions.forEach((suggestion) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "ui-number__suggestion";
      button.textContent = suggestion;
      button.addEventListener("pointerdown", (event) => {
        event.preventDefault();
        event.stopPropagation();
        input.value = suggestion;
        commit();
        closeSuggestions();
        input.blur();
      });
      panel.appendChild(button);
    });

    const open = (): void => {
      if (openSuggestions?.root === root) return;
      closeSuggestions();
      root.classList.add("is-open");
      panel.hidden = false;
      panel.classList.add("is-visible");
      document.body.appendChild(panel);
      positionSuggestions(input, panel);
      openSuggestions = { root, panel };
    };

    input.addEventListener("focus", () => {
      open();
    });

    input.addEventListener("blur", () => {
      // Only close this field's panel — don't kill another input that just opened
      window.setTimeout(() => {
        if (openSuggestions?.root === root) {
          closeSuggestions();
        }
        if (document.activeElement !== input) {
          commit();
        }
      }, 0);
    });

    root.appendChild(panel);
  }

  return root;
}
