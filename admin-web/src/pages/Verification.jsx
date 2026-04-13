import React, { useEffect, useState } from "react";
import {
  collection,
  onSnapshot,
  query,
  where,
  doc,
  updateDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../firebase";
import s from "../styles/Admin.module.css";

// ── Status config ──────────────────────────────────────────────────────────
const STATUS = {
  unverified: {
    label: "Unverified",
    color: "#64748B",
    bg: "rgba(100,116,139,0.12)",
    icon: "—",
    border: "rgba(100,116,139,0.2)",
  },
  pending: {
    label: "Pending",
    color: "#F59E0B",
    bg: "rgba(245,158,11,0.12)",
    icon: "⏳",
    border: "rgba(245,158,11,0.25)",
  },
  verified: {
    label: "Verified",
    color: "#10B981",
    bg: "rgba(16,185,129,0.12)",
    icon: "✓",
    border: "rgba(16,185,129,0.25)",
  },
  rejected: {
    label: "Rejected",
    color: "#EF4444",
    bg: "rgba(239,68,68,0.12)",
    icon: "✕",
    border: "rgba(239,68,68,0.25)",
  },
};

const TABS = [
  { key: "pending", label: "Pending Review", urgent: true },
  { key: "verified", label: "Verified", urgent: false },
  { key: "rejected", label: "Rejected", urgent: false },
  { key: "unverified", label: "Unverified", urgent: false },
  { key: "all", label: "All", urgent: false },
];

const AVATARS = [
  "#3B82F6",
  "#10B981",
  "#F97316",
  "#F59E0B",
  "#EF4444",
  "#8B5CF6",
];
const avatarColor = (uid) =>
  AVATARS[(uid?.charCodeAt(0) || 0) % AVATARS.length];
const initials = (name) =>
  name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";
const fmt = (ts) =>
  ts?.toDate?.()?.toLocaleDateString("en-PH", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }) || "—";

export default function Verification() {
  const [users, setUsers] = useState([]);
  const [selected, setSelected] = useState(null);
  const [filter, setFilter] = useState("pending");
  const [reason, setReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [search, setSearch] = useState("");
  const [imgModal, setImgModal] = useState(false);

  useEffect(() => {
    const unsub = onSnapshot(
      query(collection(db, "users"), where("role", "==", "citizen")),
      (snap) => setUsers(snap.docs.map((d) => ({ id: d.id, ...d.data() }))),
    );
    return unsub;
  }, []);

  const counts = {
    all: users.length,
    pending: users.filter((u) => u.verificationStatus === "pending").length,
    verified: users.filter((u) => u.verificationStatus === "verified").length,
    rejected: users.filter((u) => u.verificationStatus === "rejected").length,
    unverified: users.filter(
      (u) => !u.verificationStatus || u.verificationStatus === "unverified",
    ).length,
  };

  const filtered = users
    .filter((u) => {
      const matchTab =
        filter === "all" || (u.verificationStatus || "unverified") === filter;
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q);
      return matchTab && matchSearch;
    })
    .sort((a, b) => {
      const order = { pending: 0, unverified: 1, rejected: 2, verified: 3 };
      return (
        (order[a.verificationStatus] || 9) - (order[b.verificationStatus] || 9)
      );
    });

  // ── Approve ────────────────────────────────────────────────────────────
  const handleApprove = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", selected.id), {
        verificationStatus: "verified",
        isVerified: true,
        verifiedAt: serverTimestamp(),
        rejectionReason: null,
      });
      setFeedback("approved");
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
        setReason("");
      }, 2500);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  // ── Reject ─────────────────────────────────────────────────────────────
  const handleReject = async () => {
    if (!selected) return;
    if (!reason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", selected.id), {
        verificationStatus: "rejected",
        isVerified: false,
        rejectionReason: reason.trim(),
        verifiedAt: null,
      });
      setFeedback("rejected");
      setTimeout(() => {
        setFeedback(null);
        setSelected(null);
        setReason("");
      }, 2500);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  // ── Revoke (un-verify a previously verified user) ──────────────────────
  const handleRevoke = async () => {
    if (!selected) return;
    if (!window.confirm(`Revoke verification for ${selected.name}?`)) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "users", selected.id), {
        verificationStatus: "unverified",
        isVerified: false,
        verifiedAt: null,
        rejectionReason: null,
      });
      setSelected(null);
    } catch (err) {
      alert("Error: " + err.message);
    }
    setSaving(false);
  };

  const currentStatus = selected?.verificationStatus || "unverified";
  const cfg = STATUS[currentStatus] || STATUS.unverified;

  return (
    <div className={s.page}>
      {/* ── Header ── */}
      <div className={s.pageHeader}>
        <div>
          <h1 className={s.pageTitle}>Identity Verification</h1>
          <p className={s.pageSubtitle}>
            Review and approve citizen identity submissions
          </p>
        </div>
        {counts.pending > 0 && (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              backgroundColor: "rgba(245,158,11,0.1)",
              border: "1px solid rgba(245,158,11,0.25)",
              borderRadius: 12,
              padding: "10px 16px",
            }}
          >
            <span style={{ fontSize: 18 }}>⚠️</span>
            <div>
              <div style={{ color: "#F59E0B", fontWeight: 800, fontSize: 15 }}>
                {counts.pending} Pending
              </div>
              <div style={{ color: "var(--text-3)", fontSize: 12 }}>
                Awaiting your review
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Stats row ── */}
      <div className={s.statsRow} style={{ "--cols": "repeat(4,1fr)" }}>
        {[
          { label: "Pending Review", value: counts.pending, color: "#F59E0B" },
          { label: "Verified", value: counts.verified, color: "#10B981" },
          { label: "Rejected", value: counts.rejected, color: "#EF4444" },
          { label: "Unverified", value: counts.unverified, color: "#64748B" },
        ].map((x, i) => (
          <div
            key={i}
            className={s.statCard}
            style={{ "--accent-color": x.color }}
          >
            <div className={s.statValue}>{x.value}</div>
            <div className={s.statLabel}>{x.label}</div>
          </div>
        ))}
      </div>

      {/* ── Tabs + Search ── */}
      <div
        style={{
          display: "flex",
          gap: 10,
          marginBottom: 16,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {TABS.map((tab) => {
            const active = filter === tab.key;
            const sc = STATUS[tab.key];
            return (
              <button
                key={tab.key}
                style={{
                  padding: "7px 14px",
                  borderRadius: 99,
                  fontSize: 12,
                  fontWeight: active ? 700 : 500,
                  cursor: "pointer",
                  backgroundColor: active
                    ? (sc?.color || "var(--blue)") + "20"
                    : "transparent",
                  border: `1px solid ${active ? sc?.color || "var(--blue)" : "var(--border)"}`,
                  color: active
                    ? sc?.color || "var(--blue-light)"
                    : "var(--text-2)",
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                }}
                onClick={() => {
                  setFilter(tab.key);
                  setSelected(null);
                }}
              >
                {tab.urgent && counts.pending > 0 && tab.key === "pending" && (
                  <span
                    style={{
                      width: 6,
                      height: 6,
                      borderRadius: 3,
                      background: "#F59E0B",
                      display: "inline-block",
                    }}
                  />
                )}
                {tab.label}
                <span
                  style={{
                    background: "rgba(255,255,255,0.08)",
                    borderRadius: 99,
                    padding: "1px 7px",
                    fontSize: 11,
                  }}
                >
                  {counts[tab.key]}
                </span>
              </button>
            );
          })}
        </div>
        {/* Search */}
        <div
          style={{
            flex: 1,
            minWidth: 200,
            display: "flex",
            alignItems: "center",
            gap: 8,
            background: "var(--surface-2)",
            border: "1px solid var(--border)",
            borderRadius: 10,
            padding: "8px 12px",
          }}
        >
          <span style={{ color: "var(--text-3)" }}>🔍</span>
          <input
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              color: "var(--text-1)",
              fontSize: 13,
            }}
            placeholder="Search citizens…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* ── Main layout ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: selected ? "1fr 380px" : "1fr",
          gap: 16,
        }}
      >
        {/* ── Table ── */}
        <div className={s.tableWrap}>
          {filtered.length === 0 ? (
            <div className={s.empty}>
              <div className={s.emptyIcon}>✅</div>
              <p className={s.emptyTitle}>
                No {filter === "all" ? "" : filter} submissions
              </p>
            </div>
          ) : (
            <table className={s.table}>
              <thead className={s.thead}>
                <tr>
                  {[
                    "Citizen",
                    "Contact",
                    "Barangay",
                    "ID Type",
                    "Status",
                    "Submitted",
                    "Actions",
                  ].map((h) => (
                    <th key={h} className={s.th}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((u) => {
                  const st = STATUS[u.verificationStatus || "unverified"];
                  const uid = u.uid || u.id;
                  const isSel = selected?.id === u.id;
                  return (
                    <tr
                      key={u.id}
                      className={`${s.tr} ${s.trClickable} ${isSel ? s.trSelected : ""}`}
                      onClick={() => {
                        setSelected(isSel ? null : u);
                        setReason("");
                        setFeedback(null);
                      }}
                    >
                      <td className={s.td}>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              backgroundColor: avatarColor(uid),
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#fff",
                              fontWeight: 700,
                              fontSize: 12,
                              flexShrink: 0,
                            }}
                          >
                            {initials(u.name)}
                          </div>
                          <div>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--text-1)",
                                fontSize: 13,
                              }}
                            >
                              {u.name}
                            </div>
                            <div
                              style={{
                                fontSize: 11,
                                color: "var(--text-3)",
                                marginTop: 1,
                              }}
                            >
                              {u.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className={s.td} style={{ fontSize: 12 }}>
                        {u.phone || "—"}
                      </td>
                      <td className={s.td}>
                        <span
                          className={s.badge}
                          style={{
                            background: "rgba(59,130,246,0.1)",
                            color: "var(--blue-light)",
                          }}
                        >
                          {u.barangay || "—"}
                        </span>
                      </td>
                      <td
                        className={s.td}
                        style={{
                          fontSize: 12,
                          color: u.idType ? "var(--text-1)" : "var(--text-3)",
                        }}
                      >
                        {u.idType || <em>Not submitted</em>}
                      </td>
                      <td className={s.td}>
                        <span
                          className={s.badge}
                          style={{
                            backgroundColor: st.bg,
                            color: st.color,
                            border: `1px solid ${st.border}`,
                          }}
                        >
                          {st.icon} {st.label}
                        </span>
                      </td>
                      <td
                        className={s.td}
                        style={{
                          fontSize: 11,
                          color: "var(--text-3)",
                          whiteSpace: "nowrap",
                        }}
                      >
                        {fmt(u.submittedAt)}
                      </td>
                      <td className={s.td}>
                        <div style={{ display: "flex", gap: 6 }}>
                          <button
                            className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                            onClick={() => {
                              setSelected(isSel ? null : u);
                              setReason("");
                              setFeedback(null);
                            }}
                          >
                            {isSel ? "Close" : "Review"}
                          </button>
                          {/* Quick approve for pending */}
                          {(u.verificationStatus === "pending" ||
                            u.verificationStatus === "unverified") &&
                            !isSel && (
                              <button
                                style={{
                                  padding: "5px 8px",
                                  borderRadius: "var(--r-sm)",
                                  background: "rgba(16,185,129,0.12)",
                                  border: "1px solid rgba(16,185,129,0.25)",
                                  color: "#10B981",
                                  cursor: "pointer",
                                  fontSize: 13,
                                }}
                                title="Quick approve"
                                onClick={async (e) => {
                                  e.stopPropagation();
                                  await updateDoc(doc(db, "users", u.id), {
                                    verificationStatus: "verified",
                                    isVerified: true,
                                    verifiedAt: serverTimestamp(),
                                    rejectionReason: null,
                                  });
                                }}
                              >
                                ✓
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* ── Detail panel ── */}
        {selected && (
          <div
            className={s.card}
            style={{ alignSelf: "start", padding: 0, overflow: "hidden" }}
          >
            {/* Panel header */}
            <div
              style={{
                padding: "16px 18px",
                borderBottom: "1px solid var(--border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
              }}
            >
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "var(--text-1)",
                    marginBottom: 6,
                  }}
                >
                  Review Submission
                </div>
                <span
                  className={s.badge}
                  style={{
                    backgroundColor: cfg.bg,
                    color: cfg.color,
                    border: `1px solid ${cfg.border}`,
                    fontSize: 11,
                  }}
                >
                  {cfg.icon} {cfg.label}
                </span>
              </div>
              <button
                className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                onClick={() => setSelected(null)}
              >
                ✕
              </button>
            </div>

            {/* Citizen info */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  marginBottom: 14,
                }}
              >
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    backgroundColor: avatarColor(selected.uid || selected.id),
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "#fff",
                    fontWeight: 900,
                    fontSize: 20,
                    flexShrink: 0,
                  }}
                >
                  {initials(selected.name)}
                </div>
                <div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: "var(--text-1)",
                    }}
                  >
                    {selected.name}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: "var(--text-3)",
                      marginTop: 2,
                    }}
                  >
                    {selected.email}
                  </div>
                </div>
              </div>

              {/* Info grid */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 0,
                  background: "var(--surface-2)",
                  borderRadius: "var(--r-lg)",
                  border: "1px solid var(--border)",
                  overflow: "hidden",
                }}
              >
                {[
                  { label: "Phone", value: selected.phone || "—" },
                  { label: "Barangay", value: selected.barangay || "—" },
                  {
                    label: "ID Type",
                    value: selected.idType || "Not submitted",
                  },
                  { label: "ID No.", value: selected.idNumber || "—" },
                  { label: "Submitted", value: fmt(selected.submittedAt) },
                  { label: "Registered", value: fmt(selected.createdAt) },
                ].map((x, i, arr) => (
                  <div
                    key={i}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "9px 14px",
                      borderBottom:
                        i < arr.length - 1 ? "1px solid var(--border)" : "none",
                      fontSize: 13,
                    }}
                  >
                    <span style={{ color: "var(--text-3)" }}>{x.label}</span>
                    <span style={{ color: "var(--text-1)", fontWeight: 500 }}>
                      {x.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* ID Photo */}
            <div
              style={{
                padding: "14px 18px",
                borderBottom: "1px solid var(--border)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: 10,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "var(--text-3)",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                  }}
                >
                  Submitted ID Photo
                </span>
                {selected.idImageUrl && (
                  <button
                    className={`${s.btn} ${s.btnGhost} ${s.btnSm}`}
                    onClick={() => window.open(selected.idImageUrl, "_blank")}
                  >
                    View Full ↗
                  </button>
                )}
              </div>

              {selected.idImageUrl ? (
                <div
                  style={{
                    position: "relative",
                    borderRadius: "var(--r-md)",
                    overflow: "hidden",
                    cursor: "pointer",
                  }}
                  onClick={() => window.open(selected.idImageUrl, "_blank")}
                >
                  <img
                    src={selected.idImageUrl}
                    alt="ID"
                    style={{
                      width: "100%",
                      maxHeight: 200,
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      inset: 0,
                      background: "rgba(0,0,0,0)",
                      transition: "background 0.2s",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <span style={{ fontSize: 11, color: "transparent" }}>
                      Click to enlarge
                    </span>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    padding: "24px",
                    textAlign: "center",
                    background: "var(--surface-2)",
                    borderRadius: "var(--r-md)",
                    border: "1px dashed var(--border)",
                  }}
                >
                  <div style={{ fontSize: 32, marginBottom: 8, opacity: 0.4 }}>
                    📂
                  </div>
                  <p
                    style={{ color: "var(--text-3)", fontSize: 13, margin: 0 }}
                  >
                    {selected.verificationStatus === "unverified"
                      ? "Citizen has not submitted an ID yet"
                      : "No ID photo available"}
                  </p>
                </div>
              )}
            </div>

            {/* ═══════════════════════════════════════
                  APPROVE / REJECT ACTIONS
                ═══════════════════════════════════════ */}
            <div style={{ padding: "16px 18px" }}>
              {/* Feedback banners */}
              {feedback === "approved" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    background: "rgba(16,185,129,0.1)",
                    border: "1px solid rgba(16,185,129,0.25)",
                    borderRadius: "var(--r-md)",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 20 }}>✅</span>
                  <div>
                    <div
                      style={{
                        color: "#10B981",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Approved!
                    </div>
                    <div style={{ color: "var(--text-3)", fontSize: 12 }}>
                      Citizen now has full access
                    </div>
                  </div>
                </div>
              )}
              {feedback === "rejected" && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                    padding: "12px 14px",
                    background: "rgba(239,68,68,0.1)",
                    border: "1px solid rgba(239,68,68,0.25)",
                    borderRadius: "var(--r-md)",
                    marginBottom: 14,
                  }}
                >
                  <span style={{ fontSize: 20 }}>❌</span>
                  <div>
                    <div
                      style={{
                        color: "#EF4444",
                        fontWeight: 700,
                        fontSize: 14,
                      }}
                    >
                      Rejected
                    </div>
                    <div style={{ color: "var(--text-3)", fontSize: 12 }}>
                      Citizen will be asked to resubmit
                    </div>
                  </div>
                </div>
              )}

              {!feedback && (
                <>
                  {/* Previous rejection reason */}
                  {selected.rejectionReason && (
                    <div
                      style={{
                        padding: "10px 12px",
                        background: "rgba(239,68,68,0.07)",
                        border: "1px solid rgba(239,68,68,0.2)",
                        borderRadius: "var(--r-md)",
                        marginBottom: 14,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "#EF4444",
                          textTransform: "uppercase",
                          letterSpacing: "0.4px",
                          marginBottom: 5,
                        }}
                      >
                        Previous Rejection Reason
                      </div>
                      <p
                        style={{
                          color: "#FCA5A5",
                          fontSize: 13,
                          margin: 0,
                          lineHeight: 1.5,
                        }}
                      >
                        {selected.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* ── APPROVE button ── */}
                  {currentStatus !== "verified" && (
                    <button
                      onClick={handleApprove}
                      disabled={saving}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        padding: "13px 16px",
                        background: "#10B981",
                        border: "none",
                        borderRadius: "var(--r-md)",
                        color: "#fff",
                        cursor: "pointer",
                        marginBottom: 10,
                        opacity: saving ? 0.6 : 1,
                        boxShadow: "0 4px 16px rgba(16,185,129,0.35)",
                        transition: "all 0.15s",
                      }}
                    >
                      <span style={{ fontSize: 20 }}>✅</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>
                          Approve & Verify
                        </div>
                        <div
                          style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}
                        >
                          Grant full access to CitiVoice
                        </div>
                      </div>
                    </button>
                  )}

                  {/* ── Divider ── */}
                  {currentStatus !== "verified" && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        margin: "12px 0",
                      }}
                    >
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: "var(--border)",
                        }}
                      />
                      <span
                        style={{
                          color: "var(--text-3)",
                          fontSize: 11,
                          fontWeight: 700,
                        }}
                      >
                        OR
                      </span>
                      <div
                        style={{
                          flex: 1,
                          height: 1,
                          background: "var(--border)",
                        }}
                      />
                    </div>
                  )}

                  {/* ── REJECT section ── */}
                  {currentStatus !== "verified" && (
                    <div>
                      <label
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: "var(--text-3)",
                          textTransform: "uppercase",
                          letterSpacing: "0.5px",
                          display: "block",
                          marginBottom: 8,
                        }}
                      >
                        Rejection Reason{" "}
                        <span style={{ color: "var(--red)" }}>*</span>
                      </label>
                      <textarea
                        style={{
                          width: "100%",
                          background: "var(--surface-3)",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          color: "var(--text-1)",
                          padding: "10px 12px",
                          fontSize: 13,
                          resize: "vertical",
                          outline: "none",
                          boxSizing: "border-box",
                          minHeight: 72,
                          marginBottom: 8,
                          fontFamily: "inherit",
                        }}
                        placeholder="e.g. ID photo is blurry. Please take a clearer photo showing all corners."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                      />
                      <button
                        onClick={handleReject}
                        disabled={saving || !reason.trim()}
                        style={{
                          width: "100%",
                          display: "flex",
                          alignItems: "center",
                          gap: 12,
                          padding: "13px 16px",
                          background: "rgba(239,68,68,0.12)",
                          border: "2px solid rgba(239,68,68,0.3)",
                          borderRadius: "var(--r-md)",
                          color: "#EF4444",
                          cursor: "pointer",
                          opacity: saving || !reason.trim() ? 0.5 : 1,
                          transition: "all 0.15s",
                        }}
                      >
                        <span style={{ fontSize: 20 }}>❌</span>
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>
                            Reject Submission
                          </div>
                          <div
                            style={{ fontSize: 11, opacity: 0.8, marginTop: 1 }}
                          >
                            Citizen must resubmit their ID
                          </div>
                        </div>
                      </button>
                    </div>
                  )}

                  {/* Already verified — show revoke option */}
                  {currentStatus === "verified" && (
                    <div>
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 10,
                          padding: "12px 14px",
                          background: "rgba(16,185,129,0.08)",
                          border: "1px solid rgba(16,185,129,0.2)",
                          borderRadius: "var(--r-md)",
                          marginBottom: 14,
                        }}
                      >
                        <span style={{ fontSize: 20 }}>✅</span>
                        <div>
                          <div
                            style={{
                              color: "#10B981",
                              fontWeight: 700,
                              fontSize: 13,
                            }}
                          >
                            Verified Citizen
                          </div>
                          <div
                            style={{
                              color: "var(--text-3)",
                              fontSize: 11,
                              marginTop: 2,
                            }}
                          >
                            Approved on {fmt(selected.verifiedAt)}
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={handleRevoke}
                        disabled={saving}
                        style={{
                          width: "100%",
                          padding: "10px",
                          background: "transparent",
                          border: "1px solid var(--border)",
                          borderRadius: "var(--r-md)",
                          color: "var(--text-3)",
                          cursor: "pointer",
                          fontSize: 13,
                          fontWeight: 600,
                          opacity: saving ? 0.5 : 1,
                        }}
                      >
                        Revoke Verification
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
