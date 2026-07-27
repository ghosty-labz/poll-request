import { Link, createFileRoute } from "@tanstack/react-router";
import { Ghost } from "lucide-react";
import { useMemo, useState } from "react";
import { SoundToggle } from "#/components/SoundToggle";
import { play } from "#/lib/sound";

export const Route = createFileRoute("/")({ component: App });

const INK = "#14160f";
const NEON = "#39ff14";
const CREAM = "#f4f3e8";
const MONO = "'IBM Plex Mono', monospace";
const PIXEL = "'Press Start 2P', monospace";

type Option = { key: string; label: string };

const OPTIONS: Array<Option> = [
  { key: "tabs", label: "Tabs" },
  { key: "spaces", label: "Spaces" },
  { key: "prettier", label: "I let Prettier fight it out" },
];

const STEPS = [
  {
    k: "01",
    cmd: "poll init",
    title: "Draft it",
    desc: "Type your question and options in ten seconds flat. No account, no onboarding wizard, no ceremony.",
  },
  {
    k: "02",
    cmd: "poll push",
    title: "Drop the link",
    desc: "Share one URL anywhere your team lurks. Slack, Teams & Discord integrations are inbound.",
  },
  {
    k: "03",
    cmd: "poll merge",
    title: "Merge the call",
    desc: "Watch votes land in real time and merge the team’s decision before the thread derails.",
  },
];

const FEATURES = [
  {
    cmd: "--live",
    title: "Real-time results",
    desc: "Votes stream in live. No refresh, no F5 spam.",
  },
  {
    cmd: "--link",
    title: "One shareable link",
    desc: "Anyone with the URL can vote. No login wall to climb.",
  },
  {
    cmd: "--anon",
    title: "Anonymous by default",
    desc: "No names attached unless you decide to ask for them.",
  },
  {
    cmd: "--format",
    title: "Single, multi or ranked",
    desc: "Your poll, your rules. Pick the voting format.",
  },
  {
    cmd: "--code",
    title: "Code in your options",
    desc: "Drop snippets in options. `merge` vs `rebase`, fight.",
  },
  {
    cmd: "--chat",
    title: "Slack · Teams · Discord",
    desc: "Chat integrations are next up in the backlog.",
    badge: "soon",
  },
];

const Tag = ({ children }: { children: React.ReactNode }) => (
  <div
    style={{
      display: "inline-block",
      font: `700 12px ${MONO}`,
      color: INK,
      background: NEON,
      border: `2px solid ${INK}`,
      borderRadius: 5,
      padding: "4px 10px",
    }}
  >
    {children}
  </div>
);

function App() {
  const [voted, setVoted] = useState<string | null>(null);
  const [votes, setVotes] = useState<Record<string, number>>({
    tabs: 47,
    spaces: 52,
    prettier: 31,
  });

  const vote = (key: string) => {
    setVotes((prev) => {
      const next = { ...prev };
      if (voted === key) {
        next[key] -= 1;
      } else {
        if (voted) next[voted] -= 1;
        next[key] += 1;
      }
      return next;
    });
    play(voted === key ? "tick" : "success");
    setVoted((prev) => (prev === key ? null : key));
  };

  const { total, opts } = useMemo(() => {
    const sum = OPTIONS.reduce((a, o) => a + votes[o.key], 0);
    return {
      total: sum,
      opts: OPTIONS.map((o) => ({
        ...o,
        votes: votes[o.key],
        pct: sum ? Math.round((votes[o.key] / sum) * 100) : 0,
        isMine: voted === o.key,
      })),
    };
  }, [votes, voted]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: CREAM,
        fontFamily: MONO,
        color: INK,
      }}
    >
      <style>{`
        @keyframes pr-pulse{0%,100%{opacity:1}50%{opacity:.2}}
        @keyframes pr-bob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}
        .pr-nav-cta{transition:transform .15s,box-shadow .15s}
        .pr-nav-cta:hover{transform:translate(-1px,-1px);box-shadow:4px 4px 0 ${NEON}}
        .pr-primary{transition:transform .15s,box-shadow .15s}
        .pr-primary:hover{transform:translate(-2px,-2px);box-shadow:6px 6px 0 ${NEON}}
        .pr-secondary{transition:background .15s}
        .pr-secondary:hover{background:${NEON}}
        .pr-opt{transition:background .2s}
        .pr-opt:hover{background:#eafde3}
        .pr-feat{transition:transform .15s,box-shadow .15s}
        .pr-feat:hover{box-shadow:4px 4px 0 ${NEON};transform:translate(-1px,-1px)}
        .pr-cta-btn{transition:transform .15s}
        .pr-cta-btn:hover{transform:translate(-2px,-2px)}
        .pr-nav-link{cursor:pointer}
      `}</style>

      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        {/* nav */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "22px 44px",
            borderBottom: `2px solid ${INK}`,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 11 }}>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                width: 30,
                height: 30,
                background: INK,
                borderRadius: 6,
                font: `400 11px ${PIXEL}`,
                color: NEON,
              }}
            >
              PR
            </span>
            <span style={{ font: `700 15px ${MONO}`, color: INK }}>
              poll_request
            </span>
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 26,
              font: `500 13px ${MONO}`,
              color: "#5c6356",
            }}
          >
            <span className="pr-nav-link" data-cuelume-hover="whisper">
              how_it_works
            </span>
            <span className="pr-nav-link" data-cuelume-hover="whisper">
              features
            </span>
            <Link
              to="/polls"
              className="pr-nav-link"
              data-cuelume-hover="whisper"
              style={{ color: "inherit", textDecoration: "none" }}
            >
              my_polls
            </Link>
            <SoundToggle />
            <Link
              to="/polls/new"
              className="pr-nav-cta inline-flex gap-2"
              data-cuelume-hover="chime"
              data-cuelume-press="press"
              style={{
                cursor: "pointer",
                alignItems: "center",
                padding: "8px 16px",
                background: INK,
                borderRadius: 6,
                color: NEON,
                fontWeight: 700,
                boxShadow: `3px 3px 0 ${NEON}`,
              }}
            >
              Open a poll →
            </Link>
          </div>
        </div>

        {/* hero */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 52,
            padding: "74px 44px 64px",
            alignItems: "center",
          }}
        >
          <div style={{ position: "relative" }}>
            <Tag>// real-time polls for dev teams</Tag>
            <div
              style={{
                font: `400 38px/1.36 ${PIXEL}`,
                color: INK,
                marginTop: 26,
              }}
            >
              POLL
              <br />
              <span
                style={{
                  background: NEON,
                  boxShadow: `0 0 0 7px ${NEON}`,
                  borderRadius: 2,
                }}
              >
                REQUEST
              </span>
            </div>
            <p
              style={{
                font: `400 16px/1.75 ${MONO}`,
                color: "#3c4138",
                margin: "34px 0 0",
                maxWidth: 460,
              }}
            >
              Stop bikeshedding in the thread. Open a Poll Request, drop the
              link, and let the whole team vote in real time — then merge the
              decision before the thread derails.
            </p>
            <div
              style={{
                display: "flex",
                gap: 14,
                marginTop: 34,
                flexWrap: "wrap",
              }}
            >
              <Link
                to="/polls/new"
                className="pr-primary inline-flex gap-2"
                data-cuelume-hover="chime"
                data-cuelume-press="press"
                style={{
                  cursor: "pointer",
                  alignItems: "center",
                  padding: "15px 24px",
                  background: INK,
                  color: NEON,
                  borderRadius: 8,
                  font: `700 14px ${MONO}`,
                  boxShadow: `4px 4px 0 ${NEON}`,
                }}
              >
                Open a Poll Request →
              </Link>
              <span
                className="pr-secondary"
                data-cuelume-hover="whisper"
                data-cuelume-press="press"
                style={{
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 9,
                  padding: "15px 24px",
                  background: "#fff",
                  border: `2px solid ${INK}`,
                  color: INK,
                  borderRadius: 8,
                  font: `700 14px ${MONO}`,
                }}
              >
                See the live demo ↘
              </span>
            </div>
            <div
              style={{
                display: "flex",
                gap: 22,
                marginTop: 26,
                font: `600 12px ${MONO}`,
                color: "#5c6356",
              }}
            >
              <span>✓ no login to vote</span>
              <span>✓ results update live</span>
            </div>
            <Ghost
              color="#ff4d5e"
              size={52}
              strokeWidth={2}
              style={{
                position: "absolute",
                right: -26,
                top: -14,
                animation: "pr-bob 3.4s ease-in-out infinite",
              }}
            />
          </div>

          {/* live demo card */}
          <div
            style={{
              background: "#fff",
              border: `2px solid ${INK}`,
              borderRadius: 12,
              padding: "24px 24px 20px",
              boxShadow: `7px 7px 0 ${INK}`,
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <span
                style={{
                  font: `700 11px ${MONO}`,
                  letterSpacing: ".14em",
                  color: "#5c6356",
                  textTransform: "uppercase",
                }}
              >
                live demo
              </span>
              <span
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  font: `700 11px ${MONO}`,
                  color: INK,
                  letterSpacing: ".06em",
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: "#1fae0a",
                    animation: "pr-pulse 1.4s infinite",
                  }}
                />
                LIVE
              </span>
            </div>
            <div
              style={{
                font: `700 20px ${MONO}`,
                color: INK,
                margin: "14px 0 18px",
              }}
            >
              Tabs or spaces?{" "}
              <span style={{ color: "#9aa091" }}>// settle it</span>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {opts.map((opt) => (
                <div
                  key={opt.key}
                  className="pr-opt"
                  onClick={() => vote(opt.key)}
                  data-cuelume-hover="whisper"
                  data-cuelume-press="press"
                  style={{
                    cursor: "pointer",
                    border: `2px solid ${INK}`,
                    borderRadius: 9,
                    padding: "12px 14px",
                    background: CREAM,
                    position: "relative",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      bottom: 0,
                      width: `${opt.pct}%`,
                      background: NEON,
                      transition: "width .55s cubic-bezier(.4,0,.2,1)",
                    }}
                  />
                  <div
                    style={{
                      position: "relative",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <span
                      style={{
                        font: `600 13px ${MONO}`,
                        color: INK,
                        display: "flex",
                        alignItems: "center",
                        gap: 9,
                      }}
                    >
                      {opt.label}
                      {opt.isMine && (
                        <span
                          style={{
                            font: `700 9px ${MONO}`,
                            color: NEON,
                            background: INK,
                            padding: "2px 6px",
                            borderRadius: 4,
                            letterSpacing: ".06em",
                          }}
                        >
                          YOUR PICK
                        </span>
                      )}
                    </span>
                    <span
                      style={{
                        font: `700 13px ${MONO}`,
                        color: INK,
                        whiteSpace: "nowrap",
                      }}
                    >
                      {opt.pct}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginTop: 18,
                font: `600 11px ${MONO}`,
                color: "#5c6356",
              }}
            >
              <span>{total} votes cast</span>
              <span>tap to vote · tap again to undo</span>
            </div>
          </div>
        </div>

        {/* how it works */}
        <div style={{ padding: "34px 44px 64px" }}>
          <div style={{ marginBottom: 28 }}>
            <Tag>// how_it_works</Tag>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 18,
            }}
          >
            {STEPS.map((s) => (
              <div
                key={s.k}
                style={{
                  border: `2px solid ${INK}`,
                  borderRadius: 11,
                  padding: "24px 22px",
                  background: "#fff",
                  boxShadow: `4px 4px 0 ${INK}`,
                }}
              >
                <div
                  style={{
                    font: `400 13px ${PIXEL}`,
                    color: "#cfcfc0",
                    marginBottom: 18,
                  }}
                >
                  {s.k}
                </div>
                <div
                  style={{
                    display: "inline-block",
                    font: `700 12px ${MONO}`,
                    color: INK,
                    background: NEON,
                    border: `1.5px solid ${INK}`,
                    borderRadius: 5,
                    padding: "4px 9px",
                    marginBottom: 14,
                  }}
                >
                  $ {s.cmd}
                </div>
                <div
                  style={{
                    font: `700 17px ${MONO}`,
                    color: INK,
                    marginBottom: 9,
                  }}
                >
                  {s.title}
                </div>
                <div
                  style={{ font: `400 13px/1.65 ${MONO}`, color: "#54594c" }}
                >
                  {s.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* features */}
        <div style={{ padding: "0 44px 66px" }}>
          <div style={{ marginBottom: 28 }}>
            <Tag>// features --all</Tag>
          </div>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3,1fr)",
              gap: 16,
            }}
          >
            {FEATURES.map((f) => (
              <div
                key={f.cmd}
                className="pr-feat"
                style={{
                  border: `2px solid ${INK}`,
                  borderRadius: 11,
                  padding: 22,
                  background: "#fff",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 13,
                  }}
                >
                  <span style={{ font: `700 12px ${MONO}`, color: "#1fae0a" }}>
                    {f.cmd}
                  </span>
                  {f.badge && (
                    <span
                      style={{
                        font: `700 9px ${MONO}`,
                        color: INK,
                        background: "#ffb84d",
                        border: `1.5px solid ${INK}`,
                        borderRadius: 4,
                        padding: "2px 6px",
                        letterSpacing: ".08em",
                        textTransform: "uppercase",
                      }}
                    >
                      {f.badge}
                    </span>
                  )}
                </div>
                <div
                  style={{
                    font: `700 16px ${MONO}`,
                    color: INK,
                    marginBottom: 8,
                  }}
                >
                  {f.title}
                </div>
                <div style={{ font: `400 13px/1.6 ${MONO}`, color: "#54594c" }}>
                  {f.desc}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* bottom CTA */}
        <div style={{ padding: "0 44px 60px" }}>
          <div
            style={{
              border: `2px solid ${INK}`,
              borderRadius: 14,
              padding: "52px 48px",
              background: INK,
              boxShadow: `7px 7px 0 ${NEON}`,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 28,
              flexWrap: "wrap",
            }}
          >
            <div>
              <div style={{ font: `400 21px/1.5 ${PIXEL}`, color: NEON }}>
                Ready to merge
                <br />
                some opinions?
              </div>
              <p
                style={{
                  font: `400 14px ${MONO}`,
                  color: "#9bb293",
                  margin: "20px 0 0",
                }}
              >
                Spin up your first poll. It takes about as long as `git status`.
              </p>
            </div>
            <Link
              to="/polls/new"
              className="pr-cta-btn inline-flex gap-2"
              data-cuelume-hover="chime"
              data-cuelume-press="press"
              style={{
                cursor: "pointer",
                alignItems: "center",
                padding: "17px 28px",
                background: NEON,
                color: INK,
                borderRadius: 9,
                font: `700 15px ${MONO}`,
                boxShadow: "4px 4px 0 rgba(255,255,255,.18)",
              }}
            >
              Open your first poll →
            </Link>
          </div>
        </div>

        {/* footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "24px 44px",
            borderTop: `2px solid ${INK}`,
            font: `600 12px ${MONO}`,
            color: "#5c6356",
          }}
        >
          <span>poll_request © 2026 · merge opinions, not conflicts</span>
          <Ghost
            color="#1fae0a"
            size={52}
            strokeWidth={2}
            style={{ transform: "scale(.62)", transformOrigin: "right center" }}
          />
        </div>
      </div>
    </div>
  );
}
