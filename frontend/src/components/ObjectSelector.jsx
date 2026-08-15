import React from "react";

export const OBJECT_META = {
  Account: { color: "#5EEAD4" },
  Opportunity: { color: "#F5A623" },
  Lead: { color: "#8B9CF7" },
  Contact: { color: "#F0546B" },
  Case: { color: "#B9E45C" },
};

export default function ObjectSelector({ value, onChange }) {
  return (
    <div className="object-selector">
      <label htmlFor="object-select">Object</label>
      <select id="object-select" value={value} onChange={(e) => onChange(e.target.value)}>
        {Object.keys(OBJECT_META).map((obj) => (
          <option key={obj} value={obj}>
            {obj}
          </option>
        ))}
      </select>
      <span className="object-dot" style={{ background: OBJECT_META[value]?.color }} />
    </div>
  );
}
