import { useState, useEffect } from "react";

function DateInput({ value, onChange }) {
  const [displayValue, setDisplayValue] = useState("");

  useEffect(() => {
    if (value) {
      setDisplayValue(formatDateToDisplay(value));
    }
  }, [value]);

  function formatDateToDisplay(dateStr) {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "";
    return `${date.getDate().toString().padStart(2, "0")}.${(date.getMonth() + 1).toString().padStart(2, "0")}.${date.getFullYear()}`;
  }

  function formatDateToISO(dateStr) {
    const parts = dateStr.split(".");
    if (parts.length === 3) {
      const [day, month, year] = parts;
      return `${year}-${month}-${day}`;
    }
    return "";
  }

  return (
    <input
      type="text"
      className="deadline-input"
      value={displayValue}
      onChange={(e) => setDisplayValue(e.target.value)}
      onBlur={() => {
        const isoDate = formatDateToISO(displayValue);
        if (isoDate) {
          onChange(isoDate);
          setDisplayValue(formatDateToDisplay(isoDate));
        } else {
          setDisplayValue("");
        }
      }}
    />
  );
}

export default DateInput;
