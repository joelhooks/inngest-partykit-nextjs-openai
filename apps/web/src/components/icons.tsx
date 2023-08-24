export const Send = ({ className }: { className?: string }) => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      fill="none"
      className={className}
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="m10.308 13.692 4.846-4.846M20.11 5.89l-4.09 13.294c-.367 1.192-.55 1.788-.867 1.985a.999.999 0 0 1-.912.076c-.345-.143-.624-.7-1.182-1.816l-2.59-5.182a2.104 2.104 0 0 0-.193-.342 1.002 1.002 0 0 0-.18-.181 2.036 2.036 0 0 0-.331-.186L4.572 10.94c-1.115-.558-1.673-.837-1.816-1.181a1 1 0 0 1 .076-.913c.197-.316.793-.5 1.985-.867l13.295-4.09c.937-.289 1.405-.433 1.722-.316a1 1 0 0 1 .594.594c.116.316-.028.784-.316 1.72v.002Z"
      />
    </svg>
  );
};
export const Loading = ({ className }: { className?: string }) => {
  return (
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="none" className={`animate-spin ${className}`}>
  <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 16H5v5m9-13h5V3M4.583 9.003a8 8 0 0 1 14.331-1.027m.504 7.021a8 8 0 0 1-14.332 1.027"/>
</svg>
  );
};
