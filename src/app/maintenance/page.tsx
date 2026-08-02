// src/app/maintenance/page.tsx
// The "we'll be back soon" page shown while MAINTENANCE_MODE=on.

export const metadata = {
  title: "We'll be right back — Dahriola",
  robots: { index: false, follow: false }, // don't let search engines index this
};

export default function MaintenancePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "#f4f4f2",
        padding: "24px",
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif",
      }}
    >
      <div
        style={{
          maxWidth: 460,
          width: "100%",
          background: "#ffffff",
          borderRadius: 16,
          padding: "48px 32px",
          textAlign: "center",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        }}
      >
        <div
          style={{
            fontSize: 11,
            letterSpacing: 4,
            textTransform: "uppercase",
            color: "#3f5040",
            marginBottom: 20,
          }}
        >
          Dahriola
        </div>

        <h1 style={{ fontSize: 26, color: "#111", margin: "0 0 14px", fontWeight: 700 }}>
          We&rsquo;ll be right back
        </h1>

        <p style={{ fontSize: 15, color: "#666", lineHeight: 1.6, margin: "0 0 28px" }}>
          Our store is briefly down for a little maintenance while we make things
          even better for you. Please check back shortly &mdash; thank you for your
          patience. 💛
        </p>

        <div
          style={{
            fontSize: 13,
            color: "#888",
            borderTop: "1px solid #eee",
            paddingTop: 20,
          }}
        >
          For orders or enquiries, reach us on Instagram{" "}
          <a
            href="https://instagram.com/dahriola"
            style={{ color: "#3f5040", textDecoration: "none", fontWeight: 600 }}
          >
            @dahriola
          </a>
          <br />
          or email{" "}
          <a
            href="mailto:info.dahriola@gmail.com"
            style={{ color: "#3f5040", textDecoration: "none" }}
          >
            info.dahriola@gmail.com
          </a>
        </div>
      </div>
    </div>
  );
}
