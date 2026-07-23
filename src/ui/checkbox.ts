export interface CheckboxOptions {
  id: string;
  checked: boolean;
  ariaLabel: string;
  onChange: (checked: boolean) => void;
}

export function createCheckbox(options: CheckboxOptions): HTMLLabelElement {
  const label = document.createElement("label");
  label.className = "ui-checkbox";
  label.htmlFor = options.id;

  const input = document.createElement("input");
  input.type = "checkbox";
  input.className = "ui-checkbox__input";
  input.id = options.id;
  input.checked = options.checked;
  input.setAttribute("aria-label", options.ariaLabel);
  input.addEventListener("change", () => {
    options.onChange(input.checked);
  });

  const box = document.createElement("span");
  box.className = "ui-checkbox__box";
  box.setAttribute("aria-hidden", "true");

  const dot = document.createElement("span");
  dot.className = "ui-checkbox__dot";
  box.appendChild(dot);

  label.append(input, box);
  return label;
}
