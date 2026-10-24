// A shield with an eye in it: "bantay" means to watch over / guard.
export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="BantayBarangay logo">
      <path
        d="M24 3 6.5 9.5v13.2c0 11.1 7.2 18.5 17.5 22.3 10.3-3.8 17.5-11.2 17.5-22.3V9.5L24 3Z"
        fill="#0f6b4f"
        stroke="#fff"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path d="M24 5.2 8.500 11v3L24 8.200 39.500 14v-3L24 5.200Z" fill="#ff8a2a" />
      <path
        d="M11.500 25c3.200-5 7.600-7.600 12.500-7.600S33.300 20 36.500 25c-3.200 5-7.600 7.600-12.500 7.600S14.700 30 11.500 25Z"
        fill="#fff"
      />
      <circle cx="24" cy="25" r="5.200" fill="#0a3d2f" />
      <circle cx="25.800" cy="23.200" r="1.600" fill="#fff" />
    </svg>
  );
}
