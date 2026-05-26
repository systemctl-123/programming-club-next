# Drag-and-Drop vs. Text Selection Fix

This document explains the common pitfall with HTML5 Drag-and-Drop in interfaces containing form elements, and documents our lightweight, repository-wide solution.

---

## The Issue

When an element has the HTML5 attribute `draggable="true"` set, the browser prioritizes drag-and-drop operations over standard mouse selection behaviors for all of its nested children. 

As a result, if you have input fields (`<input>`, `<textarea>`, `<select>`) nested inside a draggable container:
1.  **Cursor positioning with the mouse fails**: Clicking inside the field to place the blinking cursor (caret) is ignored.
2.  **Text selection with the mouse fails**: Clicking and dragging the mouse across text in the input does not highlight or select it; instead, the browser tries to drag the entire card.
3.  **Double-clicking fails**: Double-clicking a word inside the field to highlight it is intercepted and fails.
4.  **Arrow keys are unaffected**: Only keyboard inputs (like backspace or left/right arrow keys) work.

This completely ruins the user experience in admin panels or forms where cards are both **reorderable** and **editable**.

---

## What Doesn't Work (Common Mistakes)

### 1. Adding `draggable="false"` directly to the `<input>`
Setting `<input draggable="false">` does not resolve the issue. The parent element still has `draggable="true"`, so on `mousedown`, the browser still initiates drag preparation for the parent container before the click can register selection on the input.

### 2. Calling `e.preventDefault()` on `dragstart` for Inputs
```javascript
listEl.addEventListener('dragstart', e => {
  if (e.target.tagName === 'INPUT') {
    e.preventDefault(); // This is too late!
  }
});
```
This prevents the card from moving when dragged *from* the inputs, but it still **does not** allow mouse text selection because the browser has already intercepted the click-and-drag.

---

## The Solution

The industry-standard solution is to **only make the element draggable when interacting with the designated drag handle** (e.g., the `⠿` icon), and to disable `draggable` when interacting with the rest of the card (especially inputs).

We implement this dynamically at the **event level** inside our central `initDragSort` utility in `editor.js` using event delegation:

1.  **On `mousedown`**:
    *   If the user clicked the designated drag handle (`.drag-handle`), we set the card's `draggable` attribute to `"true"`.
    *   If the user clicked anywhere else (like inside an input field), we set the card's `draggable` attribute to `"false"`.
2.  **On `mouseup` / `dragend` / `drop`**:
    *   We reset the `draggable` attribute of all cards back to `"true"` so they are ready for the next legitimate drag operation.

### Implementation in `editor.js`

Here is our updated `initDragSort` helper:

```javascript
function initDragSort(listEl, getArray, onReorder) {
  let dragged = null;

  // 1. Temporarily toggle parent draggable attribute on mousedown
  listEl.addEventListener('mousedown', e => {
    const handle = e.target.closest('.drag-handle');
    const card = e.target.closest('[draggable]');
    if (card) {
      if (handle) {
        card.setAttribute('draggable', 'true'); // Drag handle clicked -> allow drag
      } else {
        card.setAttribute('draggable', 'false'); // Input/text clicked -> disable drag (allows selection)
      }
    }
  });

  // Helper to safely restore dragging capability
  const resetDraggable = () => {
    const cards = listEl.querySelectorAll('[draggable]');
    cards.forEach(card => card.setAttribute('draggable', 'true'));
  };

  // 2. Standard HTML5 Dragstart
  listEl.addEventListener('dragstart', e => {
    // Prevent accidental drags from native elements
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.tagName === 'SELECT') {
      e.preventDefault();
      return;
    }
    dragged = e.target.closest('[draggable]');
    if (dragged && dragged.getAttribute('draggable') === 'true') {
      dragged.classList.add('dragging');
    } else {
      e.preventDefault();
    }
  });

  // 3. Reset draggable back to "true" on dragend / drop / mouseup
  listEl.addEventListener('dragend', () => {
    if (dragged) dragged.classList.remove('dragging');
    dragged = null;
    resetDraggable();
  });

  listEl.addEventListener('drop', () => {
    const items  = [...listEl.querySelectorAll('[draggable]')];
    const arr    = getArray();
    const sorted = items.map(el => arr[parseInt(el.dataset.idx)]);
    sorted.forEach((item, i) => { arr[i] = item; });
    onReorder();
    resetDraggable();
  });

  // Reset draggable if mouse is released anywhere after a click (even if they didn't drag)
  document.addEventListener('mouseup', resetDraggable);
}
```

---

## Summary of Benefits

1.  **Universal Fix**: Because it's baked into the central `initDragSort` in `editor.js`, this fix immediately works for **Members**, **Courses**, and any future editors we add.
2.  **No HTML clutter**: Card templates can just maintain standard `draggable="true"` by default. No need for complex inline attributes or inline event handlers.
3.  **Perfect UX**: Dragging from the ⠿ handle reorders elements smoothly, while inputs allow clicks, double-clicks, text selections, and cursor adjustments without any browser interference.
