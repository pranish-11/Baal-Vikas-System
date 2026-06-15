export default function LegoBrickIcon({ size = 24, className, style, ...props }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" className={className} style={style} {...props}>
      <circle cx="12" cy="4.5" r="3" fill="currentColor" fillOpacity="0.15" />
      <path d="M12 7.5 Q11.5 10 12 12.5" />
      <path d="M12 9 Q7 5.5 5 7" />
      <path d="M12 9 Q17 7.5 19 9" />
      <path d="M12 12.5 Q9 15.5 7 18" />
      <path d="M12 12.5 Q14.5 15 17 17" />
    </svg>
  );
}
