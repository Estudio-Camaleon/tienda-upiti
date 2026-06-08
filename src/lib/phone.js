export function onlyDigits(value) {
  if (value === undefined || value === null) return "";
  return String(value).replace(/\D+/g, "");
}

export function concatParts(region, area, local) {
  return `${onlyDigits(region)}${onlyDigits(area)}${onlyDigits(local)}`;
}

export function splitWhatsAppNumber(value) {
  const num = onlyDigits(value || "");
  if (!num) return { region: "", area: "", local: "" };

  const match = num.match(/^(\d{1,4})(\d{2,4})(\d{6,8})$/);
  if (match) {
    return {
      region: match[1] || "",
      area: match[2] || "",
      local: match[3] || "",
    };
  }

  return {
    region: num.slice(0, 2) || "",
    area: num.slice(2, 5) || "",
    local: num.slice(5) || "",
  };
}
