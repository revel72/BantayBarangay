// A shield with an eye in it: "bantay" means to watch over / guard.
export default function Logo({ size = 40 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" role="img" aria-label="BantayBarangay logo">
      <path
        d="M24 3 6.5 9.5v13.2c0 11.1 7.2 18.5 17.5 22.3 10.3-3.8 17.5-11.2 17.5-22.3V9.5L24 3Z"
        fill="#12306b"
      />
      <path d="M24 3 6.5 9.5v4.2L24 7.2l17.5 6.5V9.5L24 3Z" fill="#f2b705" />
      <path
        d="M11.5 25c3.2-5 7.6-7.6 12.5-7.6S33.3 20 36.5 25c-3.2 5-7.6 7.6-12.5 7.6S14.700 30 11.5 25Z"
        fill="#fff"
      />
      <circle cx="24" cy="25" r="5.2" fill="#12306b" />
      <circle cx="25.8" cy="23.2" r="1.6" fill="#fff" />
    </svg>
  );
}
