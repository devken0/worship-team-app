import { INSTRUMENT_OPTIONS } from "@/lib/domain";

/** Checkbox group of instruments/roles. Submits as repeated `instruments` fields. */
export default function InstrumentPicker({
  selected = [],
}: {
  selected?: string[];
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {INSTRUMENT_OPTIONS.map((opt) => (
        <label
          key={opt}
          className="cursor-pointer rounded-full border border-border bg-card px-3 py-1.5 text-sm has-[:checked]:border-primary has-[:checked]:bg-primary has-[:checked]:text-primary-foreground"
        >
          <input
            type="checkbox"
            name="instruments"
            value={opt}
            defaultChecked={selected.includes(opt)}
            className="sr-only"
          />
          {opt}
        </label>
      ))}
    </div>
  );
}
