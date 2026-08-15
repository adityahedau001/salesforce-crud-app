import React, { useState } from "react";

// mode: "create" | "edit" | "view"
export default function RecordFormModal({ object, fields, record, mode, onClose, onSubmit }) {
  const readOnly = mode === "view";
  const [values, setValues] = useState(() => {
    const init = {};
    fields.forEach((f) => {
      init[f.apiName] = record?.[f.apiName] ?? (f.inputType === "checkbox" ? false : "");
    });
    return init;
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const setField = (name, val) => setValues((v) => ({ ...v, [name]: val }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      // Strip empty strings for optional fields so Salesforce doesn't complain
      // about type mismatches on blank numeric/date fields.
      const payload = {};
      fields.forEach((f) => {
        if (!f.updateable && mode === "edit") return;
        const val = values[f.apiName];
        if (val === "" || val === undefined) {
          if (mode === "edit") payload[f.apiName] = null;
          return;
        }
        payload[f.apiName] = f.inputType === "number" ? Number(val) : val;
      });
      await onSubmit(payload);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const titleVerb = mode === "create" ? "New" : mode === "edit" ? "Edit" : "View";

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>
            {titleVerb} {object}
          </h2>
          <button className="icon-btn" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {fields.map((f) => (
              <div className="field-row" key={f.apiName}>
                <label htmlFor={f.apiName}>
                  {f.label}
                  {f.required && <span className="required">*</span>}
                </label>

                {f.inputType === "select" ? (
                  <select
                    id={f.apiName}
                    disabled={readOnly}
                    value={values[f.apiName]}
                    onChange={(e) => setField(f.apiName, e.target.value)}
                    required={f.required}
                  >
                    <option value="">— none —</option>
                    {(f.picklistValues || []).map((pv) => (
                      <option key={pv} value={pv}>
                        {pv}
                      </option>
                    ))}
                  </select>
                ) : f.inputType === "textarea" ? (
                  <textarea
                    id={f.apiName}
                    disabled={readOnly}
                    value={values[f.apiName]}
                    onChange={(e) => setField(f.apiName, e.target.value)}
                    rows={3}
                  />
                ) : f.inputType === "checkbox" ? (
                  <input
                    id={f.apiName}
                    type="checkbox"
                    disabled={readOnly}
                    checked={!!values[f.apiName]}
                    onChange={(e) => setField(f.apiName, e.target.checked)}
                  />
                ) : (
                  <input
                    id={f.apiName}
                    type={f.inputType}
                    disabled={readOnly}
                    value={values[f.apiName]}
                    onChange={(e) => setField(f.apiName, e.target.value)}
                    required={f.required}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className="form-error">{error}</div>}

          <div className="modal-footer">
            <button type="button" className="btn btn-ghost" onClick={onClose}>
              {readOnly ? "Close" : "Cancel"}
            </button>
            {!readOnly && (
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? "Saving…" : mode === "create" ? "Create record" : "Save changes"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
