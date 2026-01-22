# Keyboard Shortcuts Guide

Comprehensive keyboard navigation and shortcuts for StatQ. This guide ensures full accessibility for keyboard-only users.

## General Navigation

### Form Builder

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next interactive element |
| `Shift + Tab` | Move to previous interactive element |
| `Enter` | Activate focused button or link |
| `Space` | Toggle checkboxes, activate buttons |
| `Esc` | Close modal dialogs |

### Form Respondent View

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between form fields |
| `Shift + Tab` | Navigate backward through fields |
| `Enter` | Submit form (when on submit button) |
| `Esc` | Cancel/close form preview |

## Question Type Specific

### Short Text / Long Text

| Shortcut | Action |
|----------|--------|
| `Tab` | Move to next question |
| `Shift + Tab` | Move to previous question |
| `Ctrl + A` | Select all text |
| `Ctrl + C/V/X` | Copy/paste/cut |

### Multiple Choice

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Navigate between options |
| `Space` | Select focused option |
| `Tab` | Move to next question |

### Checkboxes

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Navigate between options |
| `Space` | Toggle focused checkbox |
| `Tab` | Move to next checkbox or next question |

### Dropdown

| Shortcut | Action |
|----------|--------|
| `Enter` or `Space` | Open dropdown |
| `Arrow Up/Down` | Navigate options |
| `Enter` | Select focused option |
| `Esc` | Close dropdown without selecting |
| `Type letters` | Jump to option starting with that letter |

### Linear Scale

| Shortcut | Action |
|----------|--------|
| `Arrow Left/Right` | Navigate between scale values |
| `Space` or `Enter` | Select focused value |
| `Home` | Jump to minimum value |
| `End` | Jump to maximum value |
| `Tab` | Move to next question |

### Matrix Questions

Matrix questions support comprehensive keyboard navigation for grid-based interactions.

| Shortcut | Action |
|----------|--------|
| `Arrow Up` | Move focus to cell above |
| `Arrow Down` | Move focus to cell below |
| `Arrow Left` | Move focus to cell on left |
| `Arrow Right` | Move focus to cell on right |
| `Enter` or `Space` | Select/toggle focused cell |
| `Home` | Move to first column in current row |
| `End` | Move to last column in current row |
| `Ctrl + Home` | Move to first cell (top-left) |
| `Ctrl + End` | Move to last cell (bottom-right) |
| `Tab` | Exit matrix grid to next question |
| `Shift + Tab` | Exit matrix grid to previous question |

**Visual Feedback:**
- Focused cell has blue ring outline and light blue background
- Selected cells show filled radio button or checkbox
- Screen readers announce row and column labels on focus

### Date/Time

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Increment/decrement date component |
| `Arrow Left/Right` | Move between date components (day/month/year) |
| `Tab` | Move between date and time fields |
| `Enter` | Open calendar picker (if available) |

### File Upload

| Shortcut | Action |
|----------|--------|
| `Enter` or `Space` | Open file picker dialog |
| `Tab` | Move to uploaded files list or next question |

### Ranking

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between ranked items and unranked items |
| `Enter` or `Space` | Add item to ranking (from unranked) or remove (from ranked) |
| `Arrow Up/Down` | Navigate through ranked items |

### Slider

| Shortcut | Action |
|----------|--------|
| `Arrow Left` | Decrease value by step |
| `Arrow Right` | Increase value by step |
| `Home` | Set to minimum value |
| `End` | Set to maximum value |
| `Page Up` | Increase by large step (10% of range) |
| `Page Down` | Decrease by large step (10% of range) |
| `Tab` | Move to next question |

## Form Builder Specific

### Question Editor

| Shortcut | Action |
|----------|--------|
| `Tab` | Navigate between form controls |
| `Enter` | Confirm changes, save question |
| `Esc` | Cancel editing |

### Drag and Drop (Alternative)

For users who cannot use drag-and-drop:

| Action | Alternative Method |
|--------|-------------------|
| Reorder questions | Use "Move Up" / "Move Down" buttons with `Enter` |
| Move question to position | Use keyboard to focus buttons, then `Enter` to activate |

## Modal Dialogs

| Shortcut | Action |
|----------|--------|
| `Tab` | Cycle through dialog controls |
| `Esc` | Close dialog |
| `Enter` | Confirm primary action (if button is focused) |
| `Space` | Activate focused button |

## Data Tables / Analytics

| Shortcut | Action |
|----------|--------|
| `Arrow Up/Down` | Navigate table rows |
| `Arrow Left/Right` | Scroll table horizontally |
| `Home` | Jump to first row |
| `End` | Jump to last row |
| `Enter` | Open row details |
| `Tab` | Move to next column or control |

## Accessibility Features

### Screen Reader Support

All interactive elements have proper ARIA labels and roles:
- Form fields announce their labels and validation states
- Error messages are announced when they appear
- Dynamic content changes are announced via ARIA live regions
- Matrix grids properly identify row and column headers

### Focus Management

- Visible focus indicators on all interactive elements
- Focus is trapped within modal dialogs
- Focus returns to triggering element when dialogs close
- Skip links available for bypassing navigation

### Keyboard-Only Testing

To test keyboard-only navigation:
1. Disconnect your mouse or don't use it
2. Use only `Tab`, `Shift+Tab`, `Enter`, `Space`, and arrow keys
3. Verify you can complete all form actions
4. Check that focus is always visible

## Browser-Specific Notes

### Windows

- Use `Alt + Tab` for switching browser tabs
- Use `F6` to cycle between page regions (browser-specific)

### macOS

- Use `Cmd + Tab` for switching applications
- Use `Ctrl + Tab` for switching browser tabs
- Use `Cmd + L` to focus address bar

### Linux

- Use `Alt + Tab` for switching applications
- Use `Ctrl + Tab` for switching browser tabs

## Tips for Efficient Navigation

1. **Learn Tab Order**: Understanding the tab order helps navigate faster
2. **Use Home/End**: Quickly jump to start/end of lists
3. **Matrix Navigation**: Use arrow keys for efficient grid navigation
4. **Form Validation**: Errors are announced and focus moves to first error
5. **Autocomplete**: Use arrow keys to select from autocomplete suggestions

## Reporting Accessibility Issues

If you encounter keyboard navigation issues:
1. Note the specific page and component
2. Document the expected vs. actual behavior
3. Include your browser and OS version
4. Report via GitHub issues or contact support

## Standards Compliance

This application follows:
- **WCAG 2.1 Level AA** guidelines
- **ARIA 1.2** best practices
- **WAI-ARIA Authoring Practices** patterns

## Additional Resources

- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Practices](https://www.w3.org/WAI/ARIA/apg/)
- [Keyboard Navigation Best Practices](https://webaim.org/techniques/keyboard/)
