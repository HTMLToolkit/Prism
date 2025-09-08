// Cache DOM elements
const elements = {
  input: document.getElementById("gradientInput"),
  buttons: document.querySelectorAll(".gradientBtn"),
  title: document.getElementById("title"),
  guide: document.getElementById("guide"),
  pickersContainer: document.getElementById("colorPickers"),
  addStopBtn: document.getElementById("addStop"),
  removeStopBtn: document.getElementById("removeStop"),
};

// Utility functions
const utils = {
  hexToRgb(hex) {
    hex = hex.replace(/^#/, "");
    if (hex.length === 3) {
      hex = hex
        .split("")
        .map((c) => c + c)
        .join("");
    }
    const num = parseInt(hex, 16);
    return [num >> 16, (num >> 8) & 255, num & 255];
  },

  getBrightness(rgb) {
    return (rgb[0] * 299 + rgb[1] * 587 + rgb[2] * 114) / 1000;
  },

  pickTextColor(colors) {
    if (colors.length === 0) return "white";
    const rgbs = colors.map((c) => this.hexToRgb(c));
    const avgBrightness =
      rgbs.reduce((sum, rgb) => sum + this.getBrightness(rgb), 0) / rgbs.length;
    return avgBrightness > 128 ? "black" : "white";
  },

  sanitizeGradient(gradStr) {
    if (!gradStr) return null;
    gradStr = gradStr.trim();
    if (gradStr.endsWith(";")) {
      gradStr = gradStr.slice(0, -1);
    }
    return gradStr;
  },

  extractColors(gradStr) {
    const colorMatches = gradStr.matchAll(/#([0-9a-fA-F]{3,6})/g);
    return Array.from(colorMatches, (match) => match[0]);
  },

  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },
};

// Main gradient management
const gradientManager = {
  buildGradientFromPickers() {
    const colorInputs =
      elements.pickersContainer.querySelectorAll("input[type=color]");
    const colors = Array.from(colorInputs, (picker) => picker.value);
    return `linear-gradient(to right, ${colors.join(", ")})`;
  },

  updateBackground(gradStr) {
    try {
      document.body.style.background = gradStr;
      document.body.style.backgroundSize = "cover";
      return true;
    } catch (error) {
      console.warn("Invalid gradient:", error);
      return false;
    }
  },

  updateTextStyles(colors) {
    const textColor = utils.pickTextColor(colors);
    const isLight = textColor === "black";

    elements.title.style.color = textColor;
    elements.guide.style.color = textColor;
    elements.input.style.color = textColor;
    elements.input.style.background = isLight
      ? "rgba(255,255,255,0.25)"
      : "rgba(0,0,0,0.15)";

    // Update stop control button colors
    elements.addStopBtn.style.color = textColor;
    elements.removeStopBtn.style.color = textColor;
  },

  updateColorPickers(colors) {
    const existingPickers =
      elements.pickersContainer.querySelectorAll("input[type=color]");

    // Only rebuild pickers if the count changes significantly
    if (Math.abs(colors.length - existingPickers.length) > 0) {
      this.rebuildPickers(colors);
    } else {
      // Update existing picker values
      colors.forEach((color, i) => {
        if (existingPickers[i]) {
          existingPickers[i].value = color;
        }
      });
    }
  },

  rebuildPickers(colors) {
    // Clear existing pickers
    elements.pickersContainer.innerHTML = "";

    // Create new pickers
    colors.forEach((color) => {
      const picker = this.createColorPicker(color);
      elements.pickersContainer.appendChild(picker);
    });
  },

  createColorPicker(color) {
    const picker = document.createElement("input");
    picker.type = "color";
    picker.value = color;

    // Use debounced update for better performance
    const debouncedUpdate = utils.debounce(() => {
      this.updateGradient(this.buildGradientFromPickers());
    }, 50);

    picker.addEventListener("input", debouncedUpdate);
    return picker;
  },

  updateRemoveButtonState() {
    const pickerCount =
      elements.pickersContainer.querySelectorAll("input[type=color]").length;
    elements.removeStopBtn.disabled = pickerCount <= 2;
  },

  updateGradient(gradStr, isManualInput = false) {
    const sanitized = utils.sanitizeGradient(gradStr);
    if (!sanitized) return;

    // Update background
    if (!this.updateBackground(sanitized)) return;

    // Update input field if not manual input
    if (!isManualInput) {
      elements.input.value = sanitized;
    }

    // Extract and process colors
    const colors = utils.extractColors(sanitized);
    if (colors.length > 0) {
      this.updateTextStyles(colors);
      this.updateColorPickers(colors);
    }

    // Update UI state
    this.updateRemoveButtonState();
  },
};

// Event handlers
const eventHandlers = {
  handlePresetClick(event) {
    const gradient = event.target.dataset.gradient;
    if (gradient) {
      gradientManager.updateGradient(gradient);
    }
  },

  handleManualInput: utils.debounce((event) => {
    try {
      gradientManager.updateGradient(event.target.value, true);
    } catch (error) {
      // Silently handle invalid gradients during typing
    }
  }, 300),

  handleAddStop() {
    const picker = gradientManager.createColorPicker("#ffffff");
    elements.pickersContainer.appendChild(picker);
    gradientManager.updateGradient(gradientManager.buildGradientFromPickers());
  },

  handleRemoveStop() {
    const pickers =
      elements.pickersContainer.querySelectorAll("input[type=color]");
    if (pickers.length > 2) {
      elements.pickersContainer.removeChild(pickers[pickers.length - 1]);
      gradientManager.updateGradient(
        gradientManager.buildGradientFromPickers()
      );
    }
  },
};

// Initialize the application
function init() {
  // Attach event listeners
  elements.buttons.forEach((btn) =>
    btn.addEventListener("click", eventHandlers.handlePresetClick)
  );

  elements.input.addEventListener("input", eventHandlers.handleManualInput);
  elements.addStopBtn.addEventListener("click", eventHandlers.handleAddStop);
  elements.removeStopBtn.addEventListener(
    "click",
    eventHandlers.handleRemoveStop
  );

  // Set initial gradient
  gradientManager.updateGradient("linear-gradient(to right, #00c6ff, #0072ff)");
}

// Start the application when DOM is ready
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
