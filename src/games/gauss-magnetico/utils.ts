// Helpers de UI/DOM sin estado de React

export function setPoleClass(el: HTMLElement, v: string) {
  el.textContent = v;
  el.classList.toggle("n", v === "N");
  el.classList.toggle("s", v === "S");
}

export function flipCarElement(carEl: HTMLElement) {
  const L = carEl.dataset.left!;
  const R = carEl.dataset.right!;
  carEl.dataset.left  = R;
  carEl.dataset.right = L;
  const poles = carEl.querySelectorAll<HTMLElement>(".pole");
  setPoleClass(poles[0], carEl.dataset.left!);
  setPoleClass(poles[1], carEl.dataset.right!);
}

export function getCenter(el: HTMLElement) {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

export function setSlotDragStyle(
  slot: HTMLElement,
  style: "drag-ok" | "drag-bad" | null
) {
  slot.classList.remove("drag-ok", "drag-bad");
  if (style) slot.classList.add(style);
}

export function showToast(toast: HTMLElement, html: string, ms = 2200) {
  toast.innerHTML = html;
  toast.style.display = "block";
  // Usar una propiedad en la función con tipado correcto
  type ShowToastFn = typeof showToast & { _t?: ReturnType<typeof setTimeout> };
  clearTimeout((showToast as ShowToastFn)._t);
  (showToast as ShowToastFn)._t = setTimeout(() => (toast.style.display = "none"), ms);
}
