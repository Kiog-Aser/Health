#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Mapping from path index to desired id attribute
const mapping = {
  53: "skin-back",
  83: "neck-back-left",
  84: "neck-back-right",
  49: "trapezius-posterior-left",
  50: "trapezius-posterior-right",
  73: "deltoid-posterior-left",
  74: "deltoid-posterior-right",
  82: "deltoid-lateral-left",
  81: "deltoid-lateral-right",
  68: "teres-major-left",
  65: "teres-major-right",
  56: "latissimus-dorsi-left",
  55: "latissimus-dorsi-right",
  76: "erector-spinae-left",
  75: "erector-spinae-right",
  60: "triceps-brachii-left",
  61: "triceps-brachii-right",
  77: "forearm-flexors-medial-left",
  78: "forearm-flexors-medial-right",
  54: "forearm-extensors-lateral-left",
  64: "forearm-extensors-lateral-right",
  86: "rhomboid-major-left",
  85: "rhomboid-major-right",
  52: "gluteus-maximus-left",
  51: "gluteus-maximus-right",
  59: "hamstrings-left",
  57: "hamstrings-right",
  63: "adductor-group-inner-thigh-left",
  62: "adductor-group-inner-thigh-right",
  79: "thigh-outer-left",
  80: "thigh-outer-right",
  70: "gastrocnemius-medial-left",
  71: "gastrocnemius-lateral-left",
  69: "gastrocnemius-medial-right",
  72: "gastrocnemius-lateral-right",
  67: "soleus-left",
  66: "soleus-right",
};

const svgPath = path.join(__dirname, '../assets/image.svg');
let content = fs.readFileSync(svgPath, 'utf8');

let index = -1;
// Inject id attributes only where mapping is defined and no existing id
content = content.replace(/<path\b([^>]*?)(>)/g, (match, attrs, close) => {
  index++;
  const hasId = /\bid=/.test(attrs);
  if (hasId || mapping[index] == null) {
    return match; // leave existing id or no mapping
  }
  return `<path id="${mapping[index]}"${attrs}${close}`;
});

fs.writeFileSync(svgPath, content, 'utf8');
console.log('Successfully injected back-view IDs into assets/image.svg'); 