const NumberNotation = ({
  label,
  isMainBoxColor,
}: {
  label: string;
  isMainBoxColor: boolean;
}) => {
  return (
    <div
      className={`font-semibold text-[10px] md:text-xs absolute left-1 top-0.5 select-none pointer-events-none ${
        isMainBoxColor ? 'text-boardLightText' : 'text-boardDarkText'
      }`}
    >
      {label}
    </div>
  );
};

export default NumberNotation;
