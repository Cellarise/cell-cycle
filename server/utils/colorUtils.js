"use strict";
const CSS_COLORS = ["AliceBlue", "AntiqueWhite", "Aqua", "Aquamarine", "Azure", "Beige", "Bisque", "Black", "BlanchedAlmond", "Blue", "BlueViolet", "Brown", "BurlyWood", "CadetBlue", "Chartreuse", "Chocolate", "Coral", "CornflowerBlue", "Cornsilk", "Crimson", "Cyan", "DarkBlue", "DarkCyan", "DarkGoldenRod", "DarkGray", "DarkGrey", "DarkGreen", "DarkKhaki", "DarkMagenta", "DarkOliveGreen", "Darkorange", "DarkOrchid", "DarkRed", "DarkSalmon", "DarkSeaGreen", "DarkSlateBlue", "DarkSlateGray", "DarkSlateGrey", "DarkTurquoise", "DarkViolet", "DeepPink", "DeepSkyBlue", "DimGray", "DimGrey", "DodgerBlue", "FireBrick", "FloralWhite", "ForestGreen", "Fuchsia", "Gainsboro", "GhostWhite", "Gold", "GoldenRod", "Gray", "Grey", "Green", "GreenYellow", "HoneyDew", "HotPink", "IndianRed", "Indigo", "Ivory", "Khaki", "Lavender", "LavenderBlush", "LawnGreen", "LemonChiffon", "LightBlue", "LightCoral", "LightCyan", "LightGoldenRodYellow", "LightGray", "LightGrey", "LightGreen", "LightPink", "LightSalmon", "LightSeaGreen", "LightSkyBlue", "LightSlateGray", "LightSlateGrey", "LightSteelBlue", "LightYellow", "Lime", "LimeGreen", "Linen", "Magenta", "Maroon", "MediumAquaMarine", "MediumBlue", "MediumOrchid", "MediumPurple", "MediumSeaGreen", "MediumSlateBlue", "MediumSpringGreen", "MediumTurquoise", "MediumVioletRed", "MidnightBlue", "MintCream", "MistyRose", "Moccasin", "NavajoWhite", "Navy", "OldLace", "Olive", "OliveDrab", "Orange", "OrangeRed", "Orchid", "PaleGoldenRod", "PaleGreen", "PaleTurquoise", "PaleVioletRed", "PapayaWhip", "PeachPuff", "Peru", "Pink", "Plum", "PowderBlue", "Purple", "Red", "RosyBrown", "RoyalBlue", "SaddleBrown", "Salmon", "SandyBrown", "SeaGreen", "SeaShell", "Sienna", "Silver", "SkyBlue", "SlateBlue", "SlateGray", "SlateGrey", "Snow", "SpringGreen", "SteelBlue", "Tan", "Teal", "Thistle", "Tomato", "Turquoise", "Violet", "Wheat", "White", "WhiteSmoke", "Yellow", "YellowGreen"]; //eslint-disable-line
const CSS_COLORS_LENGTH = CSS_COLORS.length;
const CSS_STATE_COLORS = {
  "ACT": "GoldenRod",
  "NSW": "SkyBlue",
  "TAS": "DarkGreen",
  "QLD": "Maroon",
  "VIC": "DarkBlue",
  "SA": "GoldenRod",
  "WA": "DarkRed",
  "NT": "Sienna"
};
//CSS road colors excludes the state colors
const CSS_ROAD_COLORS = ["Orange", "PaleVioletRed", "Olive", "Brown", "Purple", "Green", "Blue", "Crimson", "MediumVioletRed", "DarkOrange", "DarkKhaki", "SaddleBrown", "Indigo"]; //eslint-disable-line
const CSS_ROAD_COLORS_LENGTH = CSS_ROAD_COLORS.length; //eslint-disable-line

/**
 * Get color name from number. Performs a lookup on CSS colors list.
 * @param {Number} index current position in the list
 * @returns {String} color name
 */
function getColorName(index) {
  return CSS_COLORS[index % CSS_COLORS_LENGTH];
}

/**
 * Get label color name from number. Performs a lookup on CSS label colors list.
 * @param {Number} index current position in the list
 * @returns {String} color name
 */
function getRoadColorName(index) {
  return CSS_ROAD_COLORS[index % CSS_ROAD_COLORS_LENGTH];
}

module.exports = {
  "getColorName": getColorName,
  "getRoadColorName": getRoadColorName,
  "getStateColors": CSS_STATE_COLORS,
  "getColors": CSS_COLORS
};
