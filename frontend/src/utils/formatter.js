export function labelColor(label) {
  const map = { 
    LUAR: "bg-amber-800", 
    ATASAN: "bg-blue-800", 
    BAWAHAN: "bg-indigo-800", 
    SEPATU: "bg-emerald-800", 
    AKSESORIS: "bg-purple-800",
    AKSESORI: "bg-purple-800"
  };
  return map[label] || "bg-gray-800";
}
