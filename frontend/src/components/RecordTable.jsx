import React, { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../api";
import RecordFormModal from "./RecordFormModal";

const PAGE_SIZE = 20;

export default function RecordTable({ object }) {
  const [fields, setFields] = useState([]);
  const [displayField, setDisplayField] = useState(null);
  const [records, setRecords] = useState([]);
  const [offset, setOffset] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [modal, setModal] = useState(null); // { mode, record }
  const scrollRef = useRef(null);

  // Reset and reload whenever the selected object changes.
  useEffect(() => {
    let cancelled = false;
    setRecords([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
    setFields([]);

    (async () => {
      try {
        const meta = await api.getFields(object);
        if (cancelled) return;
        setFields(meta.fields);
        setDisplayField(meta.displayField);
        await loadPage(0, true);
      } catch (err) {
        if (!cancelled) setError(err.message);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [object]);

  const loadPage = useCallback(
    async (pageOffset, replace = false) => {
      setLoading(true);
      setError(null);
      try {
        const data = await api.getRecords(object, { limit: PAGE_SIZE, offset: pageOffset });
        setRecords((prev) => (replace ? data.records : [...prev, ...data.records]));
        setHasMore(data.hasMore);
        setOffset(data.nextOffset);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [object]
  );

  const handleScroll = () => {
    const el = scrollRef.current;
    if (!el || loading || !hasMore) return;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
    if (nearBottom) loadPage(offset);
  };

  const refreshFirstPage = () => loadPage(0, true).then(() => setOffset(PAGE_SIZE));

  const handleCreate = async (payload) => {
    await api.createRecord(object, payload);
    setModal(null);
    refreshFirstPage();
  };

  const handleEdit = async (payload) => {
    await api.updateRecord(object, modal.record.Id, payload);
    setModal(null);
    refreshFirstPage();
  };

  const handleDelete = async (record) => {
    const label = record[displayField] || record.Id;
    if (!window.confirm(`Delete ${object} "${label}"? This cannot be undone.`)) return;
    try {
      await api.deleteRecord(object, record.Id);
      setRecords((prev) => prev.filter((r) => r.Id !== record.Id));
    } catch (err) {
      setError(err.message);
    }
  };

  const visibleFields = fields.slice(0, 6); // keep the table readable; full field set is in the modal

  return (
    <div className="table-wrap">
      <div className="table-toolbar">
        <div className="table-title">
          <h2>{object}s</h2>
          <span className="count-pill">{records.length} loaded</span>
        </div>
        <button className="btn btn-primary" onClick={() => setModal({ mode: "create" })} disabled={fields.length === 0}>
          + New {object}
        </button>
      </div>

      {error && <div className="banner-error">{error}</div>}

      <div className="table-scroll" ref={scrollRef} onScroll={handleScroll}>
        <table>
          <thead>
            <tr>
              {visibleFields.map((f) => (
                <th key={f.apiName}>{f.label}</th>
              ))}
              <th className="actions-col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {records.map((r) => (
              <tr key={r.Id}>
                {visibleFields.map((f) => (
                  <td key={f.apiName}>{formatValue(r[f.apiName], f.inputType)}</td>
                ))}
                <td className="actions-col">
                  <button className="link-btn" onClick={() => setModal({ mode: "view", record: r })}>
                    View
                  </button>
                  <button className="link-btn" onClick={() => setModal({ mode: "edit", record: r })}>
                    Edit
                  </button>
                  <button className="link-btn link-danger" onClick={() => handleDelete(r)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {records.length === 0 && !loading && (
              <tr>
                <td colSpan={visibleFields.length + 1} className="empty-row">
                  No {object} records found. Create the first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
        {loading && <div className="loading-row">Loading records…</div>}
        {!hasMore && records.length > 0 && <div className="end-row">— end of list —</div>}
      </div>

      {modal && (
        <RecordFormModal
          object={object}
          fields={fields}
          record={modal.record}
          mode={modal.mode}
          onClose={() => setModal(null)}
          onSubmit={modal.mode === "create" ? handleCreate : handleEdit}
        />
      )}
    </div>
  );
}

function formatValue(val, inputType) {
  if (val === null || val === undefined || val === "") return "—";
  if (inputType === "checkbox") return val ? "Yes" : "No";
  if (inputType === "number" && typeof val === "number") return val.toLocaleString();
  return String(val);
}
